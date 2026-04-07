import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, ArrowLeft, Search, ShieldCheck, ShoppingCart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import { useAuth } from '../utils/AuthContext';

const CATEGORY_MARKERS = {
  Bricks: 'BK',
  Cement: 'CM',
  Electrical: 'EL',
  Hardware: 'HW',
  Paint: 'PT',
  Plumbing: 'PL',
  Sand: 'SD',
  Steel: 'ST',
  Tools: 'TL',
};

const formatPrice = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function Products() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem('vt_catalog_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(products.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (!API_URL) {
      setErrorMessage('Backend API URL is not configured. Add VITE_API_URL to FRONTEND/.env.local.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProducts = async () => {
      // Only show full loading spinner if we have no cached data
      if (products.length === 0) setLoading(true);
      else setIsRefreshing(true);
      
      setErrorMessage('');

      try {
        const { data } = await axios.get(`${API_URL}/api/products`);
        if (cancelled) return;
        
        const productsData = Array.isArray(data) ? data : [];
        setProducts(productsData);
        
        // Cache the result for instant load next time
        localStorage.setItem('vt_catalog_cache', JSON.stringify(productsData));
      } catch (error) {
        if (cancelled) return;
        // If we have cached data, don't clear it on error, just warn the user
        if (products.length === 0) {
          setProducts([]);
          setErrorMessage(error?.response?.data?.error || 'Unable to load the materials catalog right now.');
        } else {
          console.warn('Background refresh failed, using cached data:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [API_URL]);

  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    const query = searchTerm.trim().toLowerCase();
    const haystack = [product.name, product.description, product.brand?.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return matchesCategory && (!query || haystack.includes(query));
  });

  const handleReserveClick = (product) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: { pathname: '/products' },
          message: 'Please sign in to place an order.',
        },
      });
      return;
    }

    if (product.stockStatus === 'Out of Stock') return;
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-12">
        <div className="mb-10">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Materials <span style={{ color: 'var(--color-accent)' }}>Catalog</span>
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--color-muted)' }}>
            Browse verified products from the live catalog.
            {isRefreshing && (
              <span className="ml-3 animate-pulse text-xs italic" style={{ color: 'var(--color-accent)' }}>
                • Updating live stock...
              </span>
            )}
          </p>
        </div>

        {errorMessage && (
          <div
            className="mb-6 rounded-2xl px-5 py-4 text-sm"
            style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.22)',
              color: '#fecaca',
            }}
          >
            {errorMessage}
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          {selectedCategory ? (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('');
                setSearchTerm('');
              }}
              className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all sm:w-auto"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              All Categories
            </button>
          ) : null}

          <div className="relative flex-1">
            <label htmlFor="product-search" className="sr-only">
              Search products, descriptions, or brands
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--color-muted)' }}
            />
            <input
              id="product-search"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={selectedCategory ? `Search in ${selectedCategory}...` : 'Search all products...'}
              className="w-full rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div
              className="h-8 w-8 animate-spin rounded-full border-b-2"
              style={{ borderColor: 'var(--color-accent)' }}
            />
          </div>
        ) : !selectedCategory ? (
          categories.length === 0 ? (
            <div
              className="rounded-3xl border border-dashed px-6 py-16 text-center text-sm"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
            >
              No products are available in the catalog yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setSearchTerm('');
                  }}
                  className="group flex flex-col items-center justify-center rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <div
                    className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl text-lg font-semibold tracking-[0.2em]"
                    style={{
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {CATEGORY_MARKERS[category] || category.slice(0, 2).toUpperCase()}
                  </div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    {category}
                  </h2>
                </button>
              ))}
            </div>
          )
        ) : (
          <>
            <h2 className="mb-6 text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
              {selectedCategory}
            </h2>

            {filteredProducts.length === 0 ? (
              <p className="py-20 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                No products match your search in this category.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stockStatus === 'Out of Stock';
                  
                  // Optimize image URLs: request smaller width and lower quality for thumbnails
                  let imageSrc = product.imageUrl?.startsWith('/uploads')
                    ? `${API_URL}${product.imageUrl}`
                    : product.imageUrl;
                  
                  if (imageSrc && imageSrc.includes('unsplash.com')) {
                    const baseUrl = imageSrc.split('?')[0];
                    imageSrc = `${baseUrl}?auto=format&fit=crop&w=400&q=75`;
                  }

                  return (
                    <article
                      key={product.id}
                      className="flex flex-col overflow-hidden rounded-2xl transition-all duration-300"
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        opacity: isOutOfStock ? 0.7 : 1,
                      }}
                    >
                      <div
                        className="relative flex h-44 items-center justify-center overflow-hidden"
                        style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
                      >
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                            style={{ filter: isOutOfStock ? 'grayscale(1)' : 'none' }}
                          />
                        ) : (
                          <ShieldCheck className="h-8 w-8" style={{ color: 'var(--color-muted)', opacity: 0.7 }} />
                        )}

                        {isOutOfStock ? (
                          <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ background: 'rgba(0,0,0,0.52)' }}
                          >
                            <span
                              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
                              style={{
                                background: 'rgba(248,113,113,0.2)',
                                border: '1px solid rgba(248,113,113,0.3)',
                                color: '#fca5a5',
                              }}
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Out of Stock
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <span
                            className="text-xs font-semibold uppercase tracking-wider"
                            style={{ color: 'var(--color-accent)' }}
                          >
                            {product.category}
                          </span>
                          <span
                            className="rounded px-2 py-0.5 text-xs"
                            style={{
                              background: 'var(--color-bg)',
                              color: 'var(--color-muted)',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            {product.brand?.name || 'Unbranded'}
                          </span>
                        </div>

                        <h3 className="mb-1.5 font-semibold" style={{ color: 'var(--color-text)' }}>
                          {product.name}
                        </h3>
                        <p className="mb-4 flex-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                          {product.description || 'No description available.'}
                        </p>

                        <div className="mb-4 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                          {formatPrice(product.price)}
                          <span className="ml-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                            / {product.unit || 'unit'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleReserveClick(product)}
                          disabled={isOutOfStock}
                          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all"
                          style={{
                            background: isOutOfStock ? 'var(--color-border)' : 'var(--color-accent)',
                            color: isOutOfStock ? 'var(--color-muted)' : '#1a1500',
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {isOutOfStock ? 'Out of Stock' : 'Order Now'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}
