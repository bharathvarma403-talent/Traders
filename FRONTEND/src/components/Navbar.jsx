import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, HardHat, LogOut, User, ClipboardList, ChevronDown } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const avatarRef = useRef(null);

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinkStyle = (path) => ({
    color: isActive(path) ? 'var(--color-text)' : 'var(--color-muted)',
    fontWeight: isActive(path) ? 600 : 500,
    borderBottom: isActive(path) ? '2px solid var(--color-accent)' : '2px solid transparent',
    paddingBottom: '4px',
    transition: 'all 0.2s ease',
  });

  const mobileActive = (path) => ({
    color: isActive(path) ? 'var(--color-accent)' : 'var(--color-muted)',
    fontWeight: isActive(path) ? 600 : 400,
  });

  const getInitial = () => {
    if (!user?.name) return 'U';
    return user.name.charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    setAvatarOpen(false);
    setIsOpen(false);
    navigate('/');
  };

  return (
    <nav style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
         className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">

          {/* Owner Photo + Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/images/owner.png"
              alt="Shop Owner"
              className="h-9 w-9 rounded-full object-cover"
              style={{ border: '2px solid var(--color-accent)' }}
            />
            <div className="flex items-center gap-2">
              <HardHat style={{ color: 'var(--color-accent)' }} className="h-6 w-6" />
              <span className="text-lg font-semibold tracking-wide" style={{ color: 'var(--color-text)' }}>
                Vasavi <span style={{ color: 'var(--color-accent)' }}>Traders</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" style={navLinkStyle('/')} className="text-sm hover:opacity-100 transition-opacity">Home</Link>
            <Link to="/products" style={navLinkStyle('/products')} className="text-sm hover:opacity-100 transition-opacity">Products</Link>
            <Link to="/contact" style={navLinkStyle('/contact')} className="text-sm hover:opacity-100 transition-opacity">Contact</Link>

            {isAuthenticated && (
              <Link to="/orders" style={navLinkStyle('/orders')} className="text-sm hover:opacity-100 transition-opacity">Orders</Link>
            )}

            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link to="/admin/dashboard" style={navLinkStyle('/admin')} className="text-sm hover:opacity-100 transition-opacity">Admin Panel</Link>
            )}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated ? (
              <Link to="/login"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                className="text-sm px-4 py-2 rounded-lg font-medium transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
                Login
              </Link>
            ) : (
              <div ref={avatarRef} className="relative">
                <button
                  onClick={() => setAvatarOpen(!avatarOpen)}
                  className="flex items-center gap-2 transition-all"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <div
                    className="flex items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      width: '38px', height: '38px',
                      background: 'linear-gradient(135deg, var(--color-accent), #C5A000)',
                      color: '#1a1500',
                      boxShadow: '0 2px 8px rgba(255,215,0,0.25)',
                      transition: 'box-shadow 0.2s ease',
                    }}
                  >
                    {getInitial()}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5" style={{
                    color: 'var(--color-muted)',
                    transform: avatarOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }} />
                </button>

                {avatarOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden shadow-2xl"
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      animation: 'fadeSlideDown 0.15s ease-out',
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{user.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/orders" onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                        style={{ color: 'var(--color-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-muted)'; }}>
                        <ClipboardList className="h-4 w-4" /> My Orders
                      </Link>
                      <Link to="/user-dashboard" onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                        style={{ color: 'var(--color-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-muted)'; }}>
                        <User className="h-4 w-4" /> My Profile
                      </Link>
                    </div>
                    <div style={{ borderTop: '1px solid var(--color-border)' }} className="py-1">
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm w-full transition-colors"
                        style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            className="md:hidden"
            style={{ color: 'var(--color-muted)' }}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }} className="md:hidden px-6 py-4 space-y-3">
          <Link to="/" className="block text-sm py-2" style={mobileActive('/')} onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/products" className="block text-sm py-2" style={mobileActive('/products')} onClick={() => setIsOpen(false)}>Products</Link>
          <Link to="/contact" className="block text-sm py-2" style={mobileActive('/contact')} onClick={() => setIsOpen(false)}>Contact</Link>

          {isAuthenticated && (
            <Link to="/orders" className="block text-sm py-2" style={mobileActive('/orders')} onClick={() => setIsOpen(false)}>Orders</Link>
          )}

          {isAuthenticated && user?.role === 'ADMIN' && (
            <Link to="/admin/dashboard" className="block text-sm py-2" style={mobileActive('/admin')} onClick={() => setIsOpen(false)}>Admin Panel</Link>
          )}

          <div className="pt-4 border-t border-white/10">
            {!isAuthenticated ? (
              <Link to="/login" className="block text-sm py-2 font-semibold text-[var(--color-accent)]" onClick={() => setIsOpen(false)}>Login</Link>
            ) : (
              <>
                <div className="flex items-center gap-3 py-2 mb-2">
                  <div className="flex items-center justify-center rounded-full text-sm font-bold"
                    style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--color-accent), #C5A000)', color: '#1a1500' }}>
                    {getInitial()}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{user.name}</span>
                </div>
                <Link to="/user-dashboard" className="block text-sm py-2" style={{ color: 'var(--color-muted)' }} onClick={() => setIsOpen(false)}>My Profile</Link>
                <button onClick={handleLogout} className="flex items-center gap-2 text-sm py-2 font-semibold text-red-400" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
