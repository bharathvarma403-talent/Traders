import React, { useState } from 'react';
import { X, CheckCircle, ShoppingCart, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useToast } from '../utils/ToastContext';
import axios from 'axios';

export default function Modal({ isOpen, onClose, product }) {
  const [formData, setFormData] = useState({ quantity: 1, pickupDate: '', notes: '' });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const API_URL = import.meta.env.VITE_API_URL;

  if (!isOpen || !product) return null;

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/products' }, message: 'Please log in to place an order.' } });
      onClose();
      return;
    }

    if (!API_URL) { setErrorMsg('Backend not configured.'); return; }

    setStatus('submitting');
    setErrorMsg('');

    try {
      await axios.post(`${API_URL}/api/reservations`, {
        productId: product.id,
        quantity: Number(formData.quantity),
        pickupDate: formData.pickupDate,
        notes: formData.notes || undefined,
      });
      setStatus('success');
      toast.success(`Order placed for ${product.name}!`);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Order failed. Try again.';
      setErrorMsg(msg);
      if (err?.response?.status === 401) {
        navigate('/login', { state: { from: { pathname: '/products' }, message: 'Please log in to place an order.' } });
        onClose();
      }
      setStatus('idle');
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setErrorMsg('');
    setFormData({ quantity: 1, pickupDate: '', notes: '' });
    onClose();
  };

  const handleGoToOrders = () => {
    handleClose();
    navigate('/orders');
  };

  const inputStyle = {
    width: '100%', background: 'var(--color-bg)', border: '1px solid var(--color-border)',
    borderRadius: '8px', padding: '10px 14px', color: 'var(--color-text)', fontSize: '14px', outline: 'none',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-start" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>Place Order</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>{product.name} · {product.brand?.name}</p>
          </div>
          <button onClick={handleClose} style={{ color: 'var(--color-muted)' }} className="hover:opacity-70">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {status === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-accent)' }} />
              <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Order Placed!</h3>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Your order is pending review. Track it in your Orders page.</p>
              <div className="flex gap-3 mt-6 justify-center">
                <button onClick={handleGoToOrders} className="btn-primary text-sm">View Orders</button>
                <button onClick={handleClose} className="btn-outline text-sm">Close</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name (pre-filled, read-only) */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>Product</label>
                <input type="text" value={`${product.name} (${product.brand?.name})`} readOnly style={{ ...inputStyle, opacity: 0.7 }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>Quantity</label>
                  <input required type="number" min="1" name="quantity" value={formData.quantity} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>Preferred Delivery Date</label>
                  <input required type="date" name="pickupDate" value={formData.pickupDate} onChange={handleChange} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
                  Special Notes <span className="opacity-50">(optional)</span>
                </label>
                <textarea name="notes" value={formData.notes} onChange={handleChange}
                  placeholder="Any specific requirements..."
                  rows={2}
                  style={{ ...inputStyle, resize: 'none' }} />
              </div>

              <p className="text-xs py-3" style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)' }}>
                Payment collected at the store. Orders are reviewed within 24 hours.
              </p>

              <button type="submit" disabled={status === 'submitting'} className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                style={{ opacity: status === 'submitting' ? 0.6 : 1 }}>
                {status === 'submitting' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                {status === 'submitting' ? 'Placing Order…' : 'Confirm Order'}
              </button>
              {errorMsg && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '8px' }}>{errorMsg}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
