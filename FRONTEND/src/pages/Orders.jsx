import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ClipboardList, Package, Clock3, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import NovaFloatingButton from '../components/NovaFloatingButton';
import { useAuth } from '../utils/AuthContext';

const getStatusStyles = (status) => {
  switch (status) {
    case 'Accepted':
      return { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.24)', color: '#86efac' };
    case 'Rejected':
      return { background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.24)', color: '#fca5a5' };
    case 'Completed':
      return { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.24)', color: '#93c5fd' };
    default: // Pending
      return { background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.24)', color: '#fde68a' };
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'Accepted': return <CheckCircle2 className="h-3.5 w-3.5" />;
    case 'Rejected': return <XCircle className="h-3.5 w-3.5" />;
    case 'Completed': return <Package className="h-3.5 w-3.5" />;
    default: return <Clock3 className="h-3.5 w-3.5" />;
  }
};

const formatDate = (value, withTime = false) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-IN', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
};

export default function Orders() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async (silent = false) => {
    if (!API_URL || !user?.id) return;
    if (silent) setRefreshing(true); else setLoading(true);

    try {
      const { data } = await axios.get(`${API_URL}/api/reservations`, { params: { userId: user.id } });
      setOrders(data);
    } catch {
      // silently fail on poll
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_URL, user?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Poll every 15 seconds for real-time updates
  useEffect(() => {
    if (!API_URL || !user?.id) return;
    const interval = setInterval(() => loadOrders(true), 15000);
    return () => clearInterval(interval);
  }, [API_URL, user?.id, loadOrders]);

  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const acceptedCount = orders.filter(o => o.status === 'Accepted').length;
  const completedCount = orders.filter(o => o.status === 'Completed').length;
  const rejectedCount = orders.filter(o => o.status === 'Rejected').length;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.16)' }}>
                <ClipboardList className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
              </div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                My <span style={{ color: 'var(--color-accent)' }}>Orders</span>
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Track the status of your material orders in real time.</p>
          </div>
          <button onClick={() => loadOrders(true)} disabled={refreshing}
            className="btn-outline flex items-center gap-2 text-sm w-fit"
            style={{ opacity: refreshing ? 0.6 : 1 }}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Pending', value: pendingCount, color: '#fde68a' },
            { label: 'Accepted', value: acceptedCount, color: '#86efac' },
            { label: 'Completed', value: completedCount, color: '#93c5fd' },
            { label: 'Rejected', value: rejectedCount, color: '#fca5a5' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>{label}</div>
              <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Orders List */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2" style={{ borderColor: 'var(--color-accent)' }} />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Package className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-muted)', opacity: 0.4 }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>No orders yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', opacity: 0.7 }}>Your orders will appear here once you place them.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="w-full hidden sm:table" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Item Name', 'Quantity', 'Date Placed', 'Delivery Date', 'Status'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => (
                    <tr key={order.id}
                      style={{ borderBottom: i < orders.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                      className="transition-colors"
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{order.product?.name || `Product #${order.productId}`}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{order.product?.brand?.name || ''}</div>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text)' }}>{order.quantity}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-muted)' }}>{formatDate(order.createdAt, true)}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-muted)' }}>{formatDate(order.pickupDate)}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                          style={getStatusStyles(order.status)}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3 p-4">
                {orders.map(order => (
                  <div key={order.id} className="rounded-xl p-4" style={{ background: 'rgba(5,5,5,0.5)', border: '1px solid var(--color-border)' }}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{order.product?.name || `Product #${order.productId}`}</div>
                        <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{order.product?.brand?.name}</div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={getStatusStyles(order.status)}>
                        {getStatusIcon(order.status)} {order.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                      <div>Qty: <span style={{ color: 'var(--color-text)' }}>{order.quantity}</span></div>
                      <div>Placed: {formatDate(order.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <NovaFloatingButton />
    </div>
  );
}
