import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CheckCircle2, Clock3, ClipboardList, Package, Search,
  User, Mail, Phone, AlertCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../utils/AuthContext';

const initialFormState = {
  name: '',
  phone: '',
  productId: '',
  quantity: '1',
  pickupDate: '',
};

const getStatusStyles = (status) => {
  if (status === 'Approved')
    return { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.24)', color: '#86efac' };
  if (status === 'Rejected')
    return { background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.24)', color: '#fca5a5' };
  if (status === 'Completed')
    return { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.24)', color: '#93c5fd' };
  return { background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.24)', color: '#fde68a' };
};

const formatDate = (value, withTime = false) => {
  if (!value) return 'Not set';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-IN', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
};

export default function UserDashboard() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { user, isAuthenticated } = useAuth();

  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [requests, setRequests] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [requestsError, setRequestsError] = useState('');

  // Auto-fill name/phone from authenticated user
  useEffect(() => {
    if (user) {
      setFormData((current) => ({
        ...current,
        name: current.name || user.name || '',
        phone: current.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Load products
  useEffect(() => {
    if (!API_URL) { setLoadingProducts(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/products`);
        if (cancelled) return;
        setProducts(data);
        setFormData((current) => ({
          ...current,
          productId: current.productId || String(data[0]?.id || ''),
        }));
      } catch {
        if (!cancelled) setFormError('Unable to load products right now.');
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => { cancelled = true; };
  }, [API_URL]);

  // Load requests: prefer userId if logged in, else fall back to phone
  const loadRequests = async (phoneOverride) => {
    if (!API_URL) { setRequestsError('Backend URL is not configured.'); return; }

    const params = {};
    if (user?.id) {
      params.userId = user.id;
    } else {
      const phone = String(phoneOverride ?? formData.phone).trim();
      if (!phone) { setRequests([]); setRequestsError('Enter a phone number to load your requests.'); return; }
      params.phone = phone;
    }

    setLoadingRequests(true);
    setRequestsError('');
    try {
      const { data } = await axios.get(`${API_URL}/api/reservations`, { params });
      setRequests(data);
    } catch (error) {
      setRequests([]);
      setRequestsError(error?.response?.data?.error || 'Unable to load your requests.');
    } finally {
      setLoadingRequests(false);
    }
  };

  // Auto-load orders if user is authenticated
  useEffect(() => {
    if (user?.id && API_URL) loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, API_URL]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormMessage('');
    setFormError('');
    if (!API_URL) { setFormError('Backend URL is not configured.'); return; }
    if (!formData.productId) { setFormError('Select a product before submitting.'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/reservations`, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        productId: Number(formData.productId),
        quantity: Number(formData.quantity),
        pickupDate: formData.pickupDate,
      });
      setFormMessage('Order request sent! Track it in My Requests below.');
      await loadRequests(formData.phone);
      setFormData((current) => ({ ...current, quantity: '1', pickupDate: '' }));
    } catch (error) {
      setFormError(error?.response?.data?.error || 'Unable to submit your request.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount   = requests.filter((r) => r.status === 'Pending').length;
  const approvedCount  = requests.filter((r) => r.status === 'Approved').length;
  const completedCount = requests.filter((r) => r.status === 'Completed').length;

  const inputStyle = {
    width: '100%',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '12px 14px',
    color: 'var(--color-text)',
    fontSize: '14px',
    outline: 'none',
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-12">

        {/* ── Hero / Stats ── */}
        <section
          className="overflow-hidden rounded-3xl p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.14), rgba(15,15,11,0.96) 55%)',
            border: '1px solid rgba(255,215,0,0.14)',
          }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: 'var(--color-accent)' }}>
                My Dashboard
              </p>
              <h1 className="text-3xl font-semibold sm:text-4xl" style={{ color: 'var(--color-text)' }}>
                {user ? `Welcome back, ${user.name.split(' ')[0]}!` : 'Place a material request.'}
              </h1>
              <p className="mt-3 max-w-xl text-sm sm:text-base" style={{ color: 'var(--color-muted)' }}>
                Submit your requirement below, then track its approval status in real time.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: 'Pending',   value: pendingCount,   icon: Clock3 },
                { label: 'Approved',  value: approvedCount,  icon: CheckCircle2 },
                { label: 'Completed', value: completedCount, icon: Package },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl px-4 py-4"
                  style={{ background: 'rgba(5,5,5,0.66)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em]" style={{ color: 'var(--color-muted)' }}>
                    <Icon className="h-4 w-4" /> {label}
                  </div>
                  <div className="mt-3 text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {!API_URL && (
          <section className="rounded-2xl px-5 py-4 text-sm"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)', color: '#fecaca' }}>
            Set <strong>VITE_API_URL</strong> in <code>FRONTEND/.env.local</code> to use the order workflow.
          </section>
        )}

        {/* ── Profile Card (only when authenticated) ── */}
        {isAuthenticated && user && (
          <section className="rounded-3xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl p-3" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.16)' }}>
                <User className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>My Profile</h2>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Your account information</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: User,  label: 'Name',  value: user.name || '—' },
                { icon: Mail,  label: 'Email', value: user.email || '—' },
                { icon: Phone, label: 'Phone', value: user.phone || 'Not set' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}>
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-muted)' }} />
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--color-muted)' }}>{label}</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Order Form + Requests ── */}
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Order Form */}
          <div className="rounded-3xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl p-3" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.16)' }}>
                <ClipboardList className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>New Order Request</h2>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Fill in the details and submit for approval.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-muted)' }}>Full Name</label>
                  <input required name="name" type="text" value={formData.name}
                    onChange={handleChange} placeholder="Customer name" style={inputStyle} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-muted)' }}>Phone Number</label>
                  <input required name="phone" type="tel" value={formData.phone}
                    onChange={handleChange} placeholder="+91 98765 43210" style={inputStyle} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-muted)' }}>Product</label>
                <select required name="productId" value={formData.productId} onChange={handleChange}
                  style={inputStyle} disabled={loadingProducts || products.length === 0}>
                  <option value="">{loadingProducts ? 'Loading products...' : 'Select a product'}</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — {product.brand?.name || 'Unbranded'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-muted)' }}>Quantity</label>
                  <input required min="1" name="quantity" type="number" value={formData.quantity} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--color-muted)' }}>Pickup Date</label>
                  <input required name="pickupDate" type="date" value={formData.pickupDate} onChange={handleChange}
                    style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
              </div>

              {formMessage && (
                <p className="rounded-2xl px-4 py-3 text-sm"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', color: '#bbf7d0' }}>
                  {formMessage}
                </p>
              )}
              {formError && (
                <p className="rounded-2xl px-4 py-3 text-sm"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', color: '#fecaca' }}>
                  {formError}
                </p>
              )}

              <button type="submit" disabled={submitting || !API_URL} className="btn-primary w-full text-sm"
                style={{ opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Sending Request...' : 'Submit Order Request'}
              </button>
            </form>
          </div>

          {/* My Requests */}
          <div className="rounded-3xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>My Requests</h2>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  {isAuthenticated ? 'Your linked orders load automatically.' : 'Search by phone to track requests.'}
                </p>
              </div>
            </div>

            {/* Phone search — only shown when NOT authenticated */}
            {!isAuthenticated && (
              <div className="mb-5 flex gap-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
                  <input
                    type="tel" value={formData.phone}
                    onChange={(e) => setFormData((c) => ({ ...c, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                    style={{ ...inputStyle, paddingLeft: '42px' }}
                  />
                </div>
                <button type="button" className="btn-outline text-sm"
                  onClick={() => loadRequests()} disabled={loadingRequests || !API_URL}>
                  {loadingRequests ? 'Loading...' : 'Track'}
                </button>
              </div>
            )}

            {requestsError && (
              <p className="mb-4 rounded-2xl px-4 py-3 text-sm"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', color: '#fecaca' }}>
                {requestsError}
              </p>
            )}

            <div className="space-y-4">
              {loadingRequests ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2" style={{ borderColor: 'var(--color-accent)' }} />
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-3xl border border-dashed px-5 py-10 text-center text-sm"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                  {isAuthenticated
                    ? 'No orders yet. Submit your first request above!'
                    : 'No requests loaded yet. Submit a request or search with your phone number.'}
                </div>
              ) : (
                requests.map((request) => (
                  <article key={request.id} className="rounded-3xl p-5"
                    style={{ background: 'rgba(5,5,5,0.55)', border: '1px solid var(--color-border)' }}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-[0.25em]" style={{ color: 'var(--color-muted)' }}>
                          Request #{request.id}
                        </div>
                        <h3 className="mt-2 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                          {request.product?.name || `Product #${request.productId}`}
                        </h3>
                        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                          {request.product?.brand?.name || 'Brand pending'} · Qty {request.quantity}
                        </p>
                      </div>
                      <span className="inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
                        style={getStatusStyles(request.status)}>
                        {request.status}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2" style={{ color: 'var(--color-muted)' }}>
                      <div>Pickup: {formatDate(request.pickupDate)}</div>
                      <div>Requested: {formatDate(request.createdAt, true)}</div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
