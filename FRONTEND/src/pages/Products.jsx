import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, ArrowLeft, Search, ShieldCheck, ShoppingCart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import ProductCard from '../components/ProductCard';
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

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [brokenImages, setBrokenImages] = useState(new Set());

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
        const { data } = await axios.get(`${API_URL}/api/products?t=${Date.now()}`);
        if (cancelled) return;
        
        const productsData = Array.isArray(data) ? data : [];
        setProducts(productsData);
      } catch (error) {
        if (cancelled) return;
        setProducts([]);
        setErrorMessage(error?.response?.data?.error || 'Unable to load the materials catalog right now.');
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

  useEffect(() => {
    if (!API_URL) return;

    const eventSource = new EventSource(`${API_URL}/api/sync/catalog`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CATALOG_UPDATED') {
          setIsRefreshing(true);
          // Add a cache buster query parameter to guarantee a fresh pull bypasses CDN edge logic
          axios.get(`${API_URL}/api/products?forceRefresh=true&t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-cache' }
          }).then(({ data: freshData }) => {
            if (Array.isArray(freshData)) {
              setProducts(freshData);
              setIsRefreshing(false);
            }
          }).catch(() => setIsRefreshing(false));
        }
      } catch (err) {}
    };

    return () => {
      eventSource.close();
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
        ) : (!selectedCategory && !searchTerm) ? (
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
              {selectedCategory || 'Search Results'}
            </h2>

            {filteredProducts.length === 0 ? (
              <p className="py-20 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                No products match your search.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onReserve={handleReserveClick}
                    isBroken={brokenImages.has(product.id)}
                    onImageError={() => {
                      if (!brokenImages.has(product.id)) {
                        setBrokenImages(prev => new Set(prev).add(product.id));
                      }
                    }}
                    API_URL={API_URL}
                  />
                ))}
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
