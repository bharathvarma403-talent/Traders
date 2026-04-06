import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import NovaFloatingButton from '../components/NovaFloatingButton';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import { Search, ArrowLeft, ShieldCheck, ShoppingCart, AlertTriangle } from 'lucide-react';

const FALLBACK_PRODUCTS = [
  { id: 1, name: '1/18 Wire (~1-1.5 sqmm)', category: 'Electrical', description: 'Wires (per meter approx.)', price: 15, brand: { name: 'Havells' }, stockStatus: 'In Stock', stockCount: 500 },
  { id: 2, name: 'Wire 2.0 sqmm', category: 'Electrical', description: 'Wires (per meter approx.)', price: 24, brand: { name: 'Havells' }, stockStatus: 'In Stock', stockCount: 400 },
  { id: 3, name: 'Wire 2.5 sqmm', category: 'Electrical', description: 'Wires (per meter approx.)', price: 33, brand: { name: 'Havells' }, stockStatus: 'In Stock', stockCount: 350 },
  { id: 14, name: 'Ceiling Fan', category: 'Electrical', description: 'Energy efficient ceiling fan', price: 3150, brand: { name: 'Crompton' }, stockStatus: 'In Stock', stockCount: 25 },
  { id: 16, name: '3/4 inch CPVC Pipe', category: 'Pipes', description: 'CPVC pipe (per ft approx.)', price: 33, brand: { name: 'Ashirvad' }, stockStatus: 'In Stock', stockCount: 200 },
  { id: 24, name: '500 L Tank', category: 'Tanks', description: 'Storage tank', price: 4000, brand: { name: 'Nandi' }, stockStatus: 'In Stock', stockCount: 15 },
  { id: 16, name: '3/4 inch CPVC Pipe', category: 'Plumbing', description: 'CPVC pipe (per ft approx.)', price: 33, brand: { name: 'Ashirvad' }, stockStatus: 'In Stock', stockCount: 200 },
  { id: 24, name: '500 L Tank', category: 'Plumbing', description: 'Storage tank', price: 4000, brand: { name: 'Nandi' }, stockStatus: 'In Stock', stockCount: 15 },
  { id: 27, name: 'KCP Cement', category: 'Cement', description: 'Price per 50kg bag', price: 385, brand: { name: 'KCP Cement' }, stockStatus: 'In Stock', stockCount: 200 },
  { id: 34, name: 'Asian Paints (Emulsion)', category: 'Paint', description: 'Price per Liter', price: 425, brand: { name: 'Asian Paints' }, stockStatus: 'In Stock', stockCount: 100 },
];

const CATEGORY_ICONS = {
  Electrical: '⚡',
  Plumbing: '🔧',
  Cement: '🏗️',
  Paint: '🎨',
  Steel: '🏗️',
  Sand: '🏜️',
  Bricks: '🧱',
  Tools: '🔨',
  Hardware: '🔩'
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [revealAnimation, setRevealAnimation] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!API_URL) {
      setProducts(FALLBACK_PRODUCTS);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let didTimeout = false;

    const timeoutId = setTimeout(() => {
      if (isMounted) {
        didTimeout = true;
        setProducts(FALLBACK_PRODUCTS);
        setLoading(false);
      }
    }, 3000);

    axios.get(`${API_URL}/api/products`)
      .then(res => {
        if (!isMounted || didTimeout) return;
        clearTimeout(timeoutId);
        if (res.data && res.data.length > 0) {
            const mapped = res.data.map(p => ({
            ...p,
            price: Math.round((p.priceMin + p.priceMax) / 2),
            }));
            setProducts(mapped);
        } else {
            setProducts(FALLBACK_PRODUCTS);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted || didTimeout) return;
        clearTimeout(timeoutId);
        setProducts(FALLBACK_PRODUCTS);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [API_URL]);

  const categories = [...new Set(products.map(p => p.category))].sort();

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setSearchTerm('');
    setRevealAnimation(false);
    setTimeout(() => setRevealAnimation(true), 50);
  };

  const filteredProducts = products.filter(p =>
    (selectedCategory ? p.category === selectedCategory : true) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleReserveClick = (product) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/products' }, message: 'Please log in to place an order.' } });
      return;
    }
    if (product.stockStatus === 'Out of Stock') return;
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main className="flex-grow py-12 px-6 max-w-7xl mx-auto w-full">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Materials <span style={{ color: 'var(--color-accent)' }}>Catalog</span></h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--color-muted)' }}>Browse construction materials by category</p>
        </div>

        {/* Search & Back */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-stretch sm:items-center">
          {selectedCategory && (
            <button onClick={() => { setSelectedCategory(null); setSearchTerm(''); setRevealAnimation(false); }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(75,124,243,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
              <ArrowLeft className="w-4 h-4" /> All Categories
            </button>
          )}
          {selectedCategory && (
            <div className="relative flex-1">
              <label htmlFor="product-search" className="sr-only">Search products or brands</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
              <input id="product-search" type="text"
                placeholder={`Search in ${selectedCategory}...`}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
            </div>
          )}
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-accent)' }}></div>
          </div>

        ) : !selectedCategory ? (
          /* ── CATEGORY GRID ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {categories.map(cat => (
              <div key={cat} onClick={() => handleCategoryClick(cat)}
                className="flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:-translate-y-1 group p-6 rounded-2xl"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(75,124,243,0.4)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>

                <div className="w-24 h-24 mb-4 rounded-2xl flex items-center justify-center overflow-hidden"
                  style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                  <span className="text-4xl">{CATEGORY_ICONS[cat] || '📦'}</span>
                </div>
                <h3 className="font-semibold text-center text-lg" style={{ color: 'var(--color-text)' }}>{cat}</h3>
              </div>
            ))}
          </div>

        ) : (
          /* ── PRODUCTS LIST ── */
          <>
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
              {selectedCategory}
            </h2>

            {filteredProducts.length === 0 ? (
              <p className="text-center py-20 text-sm" style={{ color: 'var(--color-muted)' }}>No products found.</p>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 ${revealAnimation ? 'products-reveal' : 'opacity-0'}`}>
                {filteredProducts.map((product, index) => {
                  const isOutOfStock = product.stockStatus === 'Out of Stock';
                  return (
                    <div key={product.id}
                      className="flex flex-col overflow-hidden transition-all duration-300 group rounded-2xl product-card"
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        opacity: isOutOfStock ? 0.6 : 1,
                        animationDelay: `${index * 60}ms`,
                      }}
                      onMouseEnter={e => { if (!isOutOfStock) e.currentTarget.style.borderColor = 'rgba(75,124,243,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}>

                      {/* Product Image */}
                      <div className="h-40 flex items-center justify-center overflow-hidden relative"
                        style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl.startsWith('/uploads') ? `${API_URL}${product.imageUrl}` : product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            style={{ filter: isOutOfStock ? 'grayscale(1)' : 'none' }}
                          />
                        ) : (
                          <ShieldCheck className="w-8 h-8" style={{ color: 'var(--color-muted)', opacity: 0.6 }} />
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center"
                            style={{ background: 'rgba(0,0,0,0.5)' }}>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                              style={{ background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.3)', color: '#fca5a5' }}>
                              <AlertTriangle className="w-3.5 h-3.5" /> Out of Stock
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex-grow flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>{product.category}</span>
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--color-bg)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>{product.brand?.name}</span>
                        </div>
                        <h3 className="font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>{product.name}</h3>
                        <p className="text-sm flex-grow mb-4" style={{ color: 'var(--color-muted)' }}>{product.description}</p>

                        <div className="text-base font-mono font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                          ₹{product.price} <span className="text-xs" style={{ color: 'var(--color-muted)' }}>/ {product.unit || 'unit'}</span>
                        </div>

                        <button onClick={() => handleReserveClick(product)}
                          disabled={isOutOfStock}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
                          style={{
                            background: isOutOfStock ? 'var(--color-border)' : 'var(--color-accent)',
                            color: isOutOfStock ? 'var(--color-muted)' : 'white',
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          }}
                          onMouseEnter={e => { if (!isOutOfStock) e.currentTarget.style.opacity = '0.85'; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                          <ShoppingCart className="w-4 h-4" />
                          {isOutOfStock ? 'Out of Stock' : 'Order Now'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={selectedProduct} />
      <NovaFloatingButton />
    </div>
  );
}
