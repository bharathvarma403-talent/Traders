import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  CheckCircle2, Clock3, Package, RefreshCw, Search, ShieldCheck, XCircle,
  BarChart3, Mail, Users, Boxes, Settings, LayoutDashboard, Menu, X, ClipboardList, Plus, Trash2, Edit2
} from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { useToast } from '../utils/ToastContext';

const statusFilters = ['All', 'Pending', 'Accepted', 'Rejected', 'Completed'];

const getStatusStyles = (status) => {
  if (status === 'Accepted') return { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.24)', color: '#86efac' };
  if (status === 'Rejected') return { background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.24)', color: '#fca5a5' };
  if (status === 'Completed') return { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.24)', color: '#93c5fd' };
  return { background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.24)', color: '#fde68a' };
};

const formatDate = (value, withTime = false) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-IN', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
};

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'stock', label: 'Products/Stock', icon: Boxes },
  { id: 'settings', label: 'Settings', icon: Settings },
];



export default function AdminDashboard() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { user } = useAuth();
  const toast = useToast();

  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Orders state
  const [reservations, setReservations] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [savingId, setSavingId] = useState(null);

  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Products state
  const CATEGORY_OPTIONS = [
    'Electrical', 'Plumbing', 'Cement', 'Paint', 
    'Steel', 'Sand', 'Bricks', 'Tools', 'Hardware'
  ];

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editProductData, setEditProductData] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    name: '', category: 'Electrical', subcategory: '', 
    description: '', price: '', unit: '', brandName: '', 
    stockCount: 100, image: null 
  });

  const [errorMessage, setErrorMessage] = useState('');

  // ── Load Orders ────────────────────────────────────────
  const loadReservations = useCallback(async () => {
    if (!API_URL) {
      setErrorMessage('Backend API URL is not configured (Missing VITE_API_URL).');
      return;
    }
    setLoadingOrders(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/reservations`);
      setReservations(data);
    } catch (err) {
      setErrorMessage(err?.response?.data?.error || 'Failed to load orders.');
    } finally {
      setLoadingOrders(false);
    }
  }, [API_URL]);

  // ── Load Users ─────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    if (!API_URL) {
      setErrorMessage('Backend API URL is not configured (Missing VITE_API_URL).');
      return;
    }
    setLoadingUsers(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/users`);
      setUsers(data);
    } catch (err) {
      setErrorMessage(err?.response?.data?.error || 'Failed to load users.');
    } finally {
      setLoadingUsers(false);
    }
  }, [API_URL]);

  // ── Load Products ──────────────────────────────────────
  const loadProducts = useCallback(async () => {
    if (!API_URL) {
      setErrorMessage('Backend API URL is not configured (Missing VITE_API_URL).');
      return;
    }
    setLoadingProducts(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/products`);
      setProducts(data);
    } catch (err) {
      setErrorMessage(err?.response?.data?.error || 'Failed to load products.');
    } finally {
      setLoadingProducts(false);
    }
  }, [API_URL]);

  useEffect(() => {
    loadReservations();
    loadUsers();
    loadProducts();
  }, [loadReservations, loadUsers, loadProducts]);

  // Auto-refresh orders every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadReservations();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadReservations]);

  // ── Status Update ──────────────────────────────────────
  const handleStatusUpdate = async (id, nextStatus) => {
    if (!API_URL) return;
    setSavingId(id);
    try {
      const { data } = await axios.patch(`${API_URL}/api/reservations/${id}/status`, { status: nextStatus });
      setReservations(prev => prev.map(r => r.id === id ? data : r));
      toast.success(`Order #${id} marked as ${nextStatus}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update status.');
    } finally {
      setSavingId(null);
    }
  };

  // ── Stock Update ───────────────────────────────────────
  const handleStockUpdate = async (productId, stockStatus, stockCount) => {
    if (!API_URL) return;
    setUpdatingProductId(productId);
    try {
      const { data } = await axios.patch(`${API_URL}/api/products/${productId}/stock`, { stockStatus, stockCount });
      setProducts(prev => prev.map(p => p.id === productId ? data : p));
      toast.success('Stock updated!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update stock.');
    } finally {
      setUpdatingProductId(null);
    }
  };
  // ── Delete Product ───────────────────────────────────────
  const handleDeleteProduct = async (productId) => {
    if (!API_URL) return;
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/products/${productId}`);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Product deleted!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to delete product.');
    }
  };

  // ── Update Product (Full Edit) ───────────────────────────
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!API_URL || !editingProductId) return;
    setSavingEdit(true);
    try {
      const formData = new FormData();
      formData.append('name', editProductData.name);
      formData.append('category', editProductData.category);
      formData.append('subcategory', editProductData.subcategory);
      formData.append('description', editProductData.description);
      formData.append('price', editProductData.price);
      formData.append('unit', editProductData.unit);
      formData.append('brandName', editProductData.brandName);
      formData.append('stockCount', editProductData.stockCount);
      if (editProductData.image instanceof File) {
        formData.append('image', editProductData.image);
      }

      const { data } = await axios.put(`${API_URL}/api/admin/products/${editingProductId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProducts(prev => prev.map(p => p.id === editingProductId ? data : p));
      toast.success('Product updated!');
      setEditingProductId(null);
      setEditProductData(null);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update product.');
    } finally {
      setSavingEdit(false);
    }
  };


  // ── Add Product ────────────────────────────────────────
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!API_URL) return;
    setAddingProduct(true);
    try {
      const formData = new FormData();
      Object.keys(newProduct).forEach(key => {
        if (newProduct[key] !== null && newProduct[key] !== '') {
          formData.append(key, newProduct[key]);
        }
      });
      
      const { data } = await axios.post(`${API_URL}/api/admin/products`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setProducts(prev => [data, ...prev]);
      setShowAddProduct(false);
      setNewProduct({ name: '', category: CATEGORY_OPTIONS[0], subcategory: '', description: '', price: '', unit: '', brandName: '', stockCount: 100, image: null });
      toast.success('Product added successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to add product.');
    } finally {
      setAddingProduct(false);
    }
  };

  // Filters
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredReservations = reservations.filter(r => {
    const matchesStatus = activeStatus === 'All' || r.status === activeStatus;
    const text = [r.name, r.phone, r.product?.name, r.product?.brand?.name].filter(Boolean).join(' ').toLowerCase();
    return matchesStatus && (!normalizedSearch || text.includes(normalizedSearch));
  });

  const pendingCount = reservations.filter(r => r.status === 'Pending').length;
  const acceptedCount = reservations.filter(r => r.status === 'Accepted').length;
  const completedCount = reservations.filter(r => r.status === 'Completed').length;
  const rejectedCount = reservations.filter(r => r.status === 'Rejected').length;

  const sidebarStyle = { background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>

      {/* ── Sidebar (Desktop) ── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen" style={sidebarStyle}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Admin Panel</span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{user?.name || 'Admin'}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative"
              style={{
                background: activeSection === id ? 'rgba(255,215,0,0.08)' : 'transparent',
                color: activeSection === id ? 'var(--color-accent)' : 'var(--color-muted)',
                border: activeSection === id ? '1px solid rgba(255,215,0,0.16)' : '1px solid transparent',
              }}>
              <Icon className="h-4 w-4" /> 
              {label}
              {id === 'orders' && pendingCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold shadow-lg"
                  style={{ background: 'var(--color-accent)', color: '#000' }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <a href="/" className="text-xs" style={{ color: 'var(--color-muted)' }}>← Back to Website</a>
        </div>
      </aside>

      {/* ── Mobile Sidebar Toggle ── */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 h-full" style={sidebarStyle} onClick={e => e.stopPropagation()}>
            <div className="p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Admin Panel</span>
              </div>
            </div>
            <nav className="p-4 space-y-1">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setActiveSection(id); setSidebarOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: activeSection === id ? 'rgba(255,215,0,0.08)' : 'transparent',
                    color: activeSection === id ? 'var(--color-accent)' : 'var(--color-muted)',
                  }}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        {errorMessage && (
          <div className="mb-6 rounded-2xl px-5 py-4 text-sm" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)', color: '#fecaca' }}>
            {errorMessage}
            <button onClick={() => setErrorMessage('')} className="ml-3 underline text-xs">Dismiss</button>
          </div>
        )}

        {/* ═══ OVERVIEW ═══ */}
        {activeSection === 'overview' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Dashboard Overview</h1>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Welcome back, {user?.name?.split(' ')[0] || 'Admin'}!</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                { label: 'Total Orders', value: reservations.length, icon: BarChart3 },
                { label: 'Pending', value: pendingCount, icon: Clock3 },
                { label: 'Accepted', value: acceptedCount, icon: CheckCircle2 },
                { label: 'Completed', value: completedCount, icon: Package },
                { label: 'Rejected', value: rejectedCount, icon: XCircle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl px-5 py-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.16)' }}>
                      <Icon className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>{label}</div>
                      <div className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Registered Users</h3>
                <div className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>{users.length}</div>
              </div>
              <div className="rounded-2xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Products in Catalog</h3>
                <div className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>{products.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ORDERS ═══ */}
        {activeSection === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Orders Management</h1>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Accept, reject, or complete customer orders.</p>
              </div>
              <button onClick={loadReservations} className="btn-outline flex items-center gap-2 text-sm w-fit">
                <RefreshCw className={`h-4 w-4 ${loadingOrders ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search customer, phone, product..."
                  className="w-full rounded-xl px-4 py-3 pl-11 text-sm outline-none"
                  style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
              </div>
              <div className="flex flex-wrap gap-2">
                {statusFilters.map(s => (
                  <button key={s} onClick={() => setActiveStatus(s)}
                    className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                    style={activeStatus === s
                      ? { background: 'var(--color-accent)', color: '#1a1500' }
                      : { background: 'var(--color-bg)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            {loadingOrders ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2" style={{ borderColor: 'var(--color-accent)' }} />
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="text-center py-16 text-sm rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border)', color: 'var(--color-muted)' }}>
                No orders match the current filters.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReservations.map(r => (
                  <div key={r.id} className="rounded-2xl p-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <div>
                          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>Customer</div>
                          <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{r.name}</div>
                          <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{r.phone}</div>
                          {r.email && <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}><Mail className="h-3 w-3" />{r.email}</div>}
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>Product</div>
                          <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{r.product?.name || `#${r.productId}`}</div>
                          <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Qty: {r.quantity}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>Date Placed</div>
                          <div className="mt-1 text-sm" style={{ color: 'var(--color-text)' }}>{formatDate(r.createdAt, true)}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>Delivery</div>
                          <div className="mt-1 text-sm" style={{ color: 'var(--color-text)' }}>{formatDate(r.pickupDate)}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>Status</div>
                          <span className="inline-flex mt-1 rounded-full px-3 py-1 text-xs font-semibold uppercase" style={getStatusStyles(r.status)}>{r.status}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 xl:max-w-[280px] xl:justify-end shrink-0">
                        {[
                          { label: 'Accept', status: 'Accepted', icon: CheckCircle2 },
                          { label: 'Reject', status: 'Rejected', icon: XCircle },
                          { label: 'Complete', status: 'Completed', icon: Package },
                        ].map(({ label, status, icon: Icon }) => (
                          <button key={status} onClick={() => handleStatusUpdate(r.id, status)}
                            disabled={savingId === r.id || r.status === status}
                            className="btn-outline flex items-center gap-2 px-3 py-1.5 text-xs"
                            style={{ opacity: savingId === r.id || r.status === status ? 0.5 : 1 }}>
                            <Icon className="h-3.5 w-3.5" />
                            {savingId === r.id ? '...' : label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {r.notes && (
                      <div className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                        <strong>Notes:</strong> {r.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ USERS ═══ */}
        {activeSection === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>User Login Log</h1>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>All registered users and their activity.</p>
              </div>
              <button onClick={loadUsers} className="btn-outline flex items-center gap-2 text-sm">
                <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2" style={{ borderColor: 'var(--color-accent)' }} />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 text-sm rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border)', color: 'var(--color-muted)' }}>
                No users found.
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        {['Name', 'Email', 'Phone', 'Role', 'Last Login', 'Registered'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                          <td className="px-5 py-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{u.name}</td>
                          <td className="px-5 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{u.email}</td>
                          <td className="px-5 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{u.phone || '—'}</td>
                          <td className="px-5 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={u.role === 'ADMIN'
                                ? { background: 'rgba(255,215,0,0.12)', color: '#fde68a' }
                                : { background: 'rgba(75,124,243,0.12)', color: '#93c5fd' }}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{u.lastLoginAt ? formatDate(u.lastLoginAt, true) : 'Never'}</td>
                          <td className="px-5 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{formatDate(u.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ STOCK ═══ */}
        {activeSection === 'stock' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Stock & Availability</h1>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Manage product availability and stock counts.</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowAddProduct(!showAddProduct)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                  {showAddProduct ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {showAddProduct ? 'Cancel' : 'Add Product'}
                </button>
                <button onClick={loadProducts} className="btn-outline flex items-center gap-2 text-sm">
                  <RefreshCw className={`h-4 w-4 ${loadingProducts ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </div>

            {showAddProduct && (
              <div className="rounded-2xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>Add New Product</h2>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                    <div>
                      <input required type="text" placeholder="Product Name *" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                    </div>
                    <div>
                      <input required type="text" placeholder="Brand *" value={newProduct.brandName} onChange={e => setNewProduct({...newProduct, brandName: e.target.value})} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                    </div>
                    <div>
                      <select required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                        {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <input required type="text" placeholder="Subcategory *" value={newProduct.subcategory} onChange={e => setNewProduct({...newProduct, subcategory: e.target.value})} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>Price *</label>
                      <input required type="number" min="0" step="0.01" placeholder="Price (INR) *" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>Unit *</label>
                      <input required type="text" placeholder="Unit (piece, bag, kg) *" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>Stock Count</label>
                      <input type="number" min="0" placeholder="Stock Count" value={newProduct.stockCount} onChange={e => setNewProduct({...newProduct, stockCount: e.target.value})} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>Description *</label>
                    <textarea required value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} rows="2" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>Product Image *</label>
                    <input required type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e => setNewProduct({...newProduct, image: e.target.files[0]})} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }} />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={addingProduct} className="btn-primary flex items-center justify-center min-w-[120px] py-2.5 text-sm" style={{ opacity: addingProduct ? 0.7 : 1 }}>
                      {addingProduct ? 'Adding...' : 'Add Product'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingProducts ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2" style={{ borderColor: 'var(--color-accent)' }} />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-sm rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border)', color: 'var(--color-muted)' }}>
                No products found in the catalog.
              </div>
            ) : (
              <div className="grid gap-3">
                {products.map(p => (
                  <div key={p.id} className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all"
                    style={{ background: 'var(--color-surface)', border: editingProductId === p.id ? '1px solid var(--color-accent)' : '1px solid var(--color-border)' }}>
                    
                    {editingProductId === p.id ? (
                      <form onSubmit={handleUpdateProduct} className="flex-1 w-full space-y-4 py-2">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Edit Product</h4>
                          <button type="button" onClick={() => { setEditingProductId(null); setEditProductData(null); }} className="text-xs font-semibold py-1 px-3 rounded-full hover:bg-neutral-500/10" style={{ color: 'var(--color-muted)' }}>Cancel</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>Name *</label>
                            <input type="text" required value={editProductData.name} onChange={e => setEditProductData({...editProductData, name: e.target.value})} className="w-full rounded-lg px-2 py-1.5 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>Brand *</label>
                            <input type="text" required value={editProductData.brandName} onChange={e => setEditProductData({...editProductData, brandName: e.target.value})} className="w-full rounded-lg px-2 py-1.5 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>Category *</label>
                            <select required value={editProductData.category} onChange={e => setEditProductData({...editProductData, category: e.target.value})} className="w-full rounded-lg px-2 py-1.5 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                              {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>Subcategory *</label>
                            <input type="text" required value={editProductData.subcategory} onChange={e => setEditProductData({...editProductData, subcategory: e.target.value})} className="w-full rounded-lg px-2 py-1.5 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>Price *</label>
                            <input type="number" required value={editProductData.price} onChange={e => setEditProductData({...editProductData, price: e.target.value})} className="w-full rounded-lg px-2 py-1.5 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>Unit *</label>
                            <input type="text" required value={editProductData.unit} onChange={e => setEditProductData({...editProductData, unit: e.target.value})} className="w-full rounded-lg px-2 py-1.5 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>Qty</label>
                            <input type="number" value={editProductData.stockCount} onChange={e => setEditProductData({...editProductData, stockCount: e.target.value})} className="w-full rounded-lg px-2 py-1.5 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>New Image (optional)</label>
                            <input type="file" accept="image/*" onChange={e => setEditProductData({...editProductData, image: e.target.files[0]})} className="w-full rounded-lg px-2 py-1.5 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }} />
                          </div>
                        </div>
                        <div className="mb-2">
                          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>Description *</label>
                          <textarea required value={editProductData.description} onChange={e => setEditProductData({...editProductData, description: e.target.value})} rows="1" className="w-full rounded-lg px-2 py-1.5 text-sm outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }} />
                        </div>
                        <div className="flex justify-end pt-2">
                          <button type="submit" disabled={savingEdit} className="btn-primary px-4 py-2 text-sm rounded-lg" style={{ opacity: savingEdit ? 0.7 : 1 }}>
                            {savingEdit ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{p.name}</div>
                          <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{p.brand?.name} · {p.category}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-xs" style={{ color: 'var(--color-muted)' }}>Qty:</label>
                            <input type="number" min="0" defaultValue={p.stockCount}
                              className="w-20 rounded-lg px-2 py-1.5 text-sm outline-none"
                              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                              onBlur={e => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val !== p.stockCount) handleStockUpdate(p.id, undefined, val);
                              }} />
                          </div>
                          <button
                            onClick={() => handleStockUpdate(p.id, p.stockStatus === 'In Stock' ? 'Out of Stock' : 'In Stock')}
                            disabled={updatingProductId === p.id}
                            className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                            style={p.stockStatus === 'In Stock'
                              ? { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.24)', color: '#86efac' }
                              : { background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.24)', color: '#fca5a5' }}>
                            {updatingProductId === p.id ? '...' : p.stockStatus}
                          </button>
                          <button
                            onClick={() => {
                              setEditingProductId(p.id);
                              setEditProductData({
                                name: p.name,
                                brandName: p.brand?.name || '',
                                category: p.category,
                                subcategory: p.subcategory || '',
                                description: p.description || '',
                                price: p.price || 0,
                                unit: p.unit || 'piece',
                                stockCount: p.stockCount || 0,
                                image: null // Keep null so we don't upload a bad file reference
                              });
                            }}
                            className="rounded-full p-2 transition-all hover:bg-blue-500/10"
                            title="Edit Product"
                            style={{ color: 'var(--color-accent)' }}>
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="rounded-full p-2 transition-all hover:bg-red-500/10"
                            title="Delete Product"
                            style={{ color: '#fca5a5' }}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ SETTINGS ═══ */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Settings</h1>
            <div className="rounded-2xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Support Contact</h3>
              <div className="space-y-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                <p>Email: vasavitraderssupport@gmail.com</p>
                <p>Phone: +91 99125 17623</p>
                <p>WhatsApp: +91 99125 17623</p>
              </div>
            </div>
            <div className="rounded-2xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Admin Account</h3>
              <div className="space-y-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                <p>Name: {user?.name}</p>
                <p>Email: {user?.email}</p>
                <p>Role: {user?.role}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
