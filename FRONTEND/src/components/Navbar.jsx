import { useState, useRef, useEffect } from 'react';
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

  const handleLogout = () => {
    logout();
    setAvatarOpen(false);
    setIsOpen(false);
    navigate('/');
  };

  const getInitial = () => {
    if (!user?.name) return 'U';
    return user.name.charAt(0).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-4 group">
            <div className="relative flex-shrink-0">
              <img
                src="/images/owner.png"
                alt="Shop Owner"
                className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500/50 group-hover:border-yellow-500 transition-colors"
              />
              <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                <HardHat className="h-3 w-3 text-black" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white leading-tight">
                VASAVI <span className="text-yellow-500">TRADERS</span>
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Industrial Materials</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            <Link to="/" className={`text-xs font-bold uppercase tracking-widest transition-all ${isActive('/') ? 'text-yellow-500' : 'text-zinc-500 hover:text-white'}`}>Home</Link>
            <Link to="/products" className={`text-xs font-bold uppercase tracking-widest transition-all ${isActive('/products') ? 'text-yellow-500' : 'text-zinc-500 hover:text-white'}`}>Products</Link>
            <Link to="/contact" className={`text-xs font-bold uppercase tracking-widest transition-all ${isActive('/contact') ? 'text-yellow-500' : 'text-zinc-500 hover:text-white'}`}>Contact</Link>
            {isAuthenticated && (
              <Link to="/orders" className={`text-xs font-bold uppercase tracking-widest transition-all ${isActive('/orders') ? 'text-yellow-500' : 'text-zinc-500 hover:text-white'}`}>Orders</Link>
            )}
            {isAuthenticated && user?.role?.toUpperCase() === 'ADMIN' && (
              <Link to="/admin/dashboard" className={`text-xs font-bold uppercase tracking-widest transition-all ${isActive('/admin') ? 'text-yellow-500' : 'text-zinc-500 hover:text-white'}`}>Admin</Link>
            )}
          </div>

          {/* User Controls */}
          <div className="hidden md:flex items-center gap-6">
            {!isAuthenticated ? (
              <Link to="/login" className="text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-lg transition-all border border-white/10 hover:border-yellow-500/50 hover:bg-yellow-500/5 text-white">
                Client Login
              </Link>
            ) : (
              <div ref={avatarRef} className="relative">
                <button onClick={() => setAvatarOpen(!avatarOpen)} className="flex items-center gap-3 group">
                  <div className="flex items-center justify-center rounded-lg text-sm font-bold w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 text-black shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition-transform">
                    {getInitial()}
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-300 ${avatarOpen ? 'rotate-180' : ''}`} />
                </button>
                {avatarOpen && (
                  <div className="absolute right-0 mt-4 w-60 rounded-xl glass shadow-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/5 bg-white/5">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[10px] font-bold text-zinc-500 truncate uppercase mt-1 tracking-wider">{user.email}</p>
                    </div>
                    <div className="py-2">
                      {user?.role?.toUpperCase() === 'ADMIN' && (
                        <Link to="/admin/dashboard" onClick={() => setAvatarOpen(false)} className="flex items-center gap-3 px-5 py-3 text-[11px] font-bold text-yellow-500 hover:bg-yellow-500/5 transition-all">
                          <HardHat className="h-4 w-4" /> ADMIN DASHBOARD
                        </Link>
                      )}
                      <Link to="/orders" onClick={() => setAvatarOpen(false)} className="flex items-center gap-3 px-5 py-3 text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
                        <ClipboardList className="h-4 w-4" /> MY ORDERS
                      </Link>
                      <Link to="/user-dashboard" onClick={() => setAvatarOpen(false)} className="flex items-center gap-3 px-5 py-3 text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
                        <User className="h-4 w-4" /> MY PROFILE
                      </Link>
                    </div>
                    <div className="py-2 border-t border-white/5">
                      <button onClick={handleLogout} className="flex items-center gap-3 px-5 py-3 text-[11px] font-bold text-red-400 hover:bg-red-500/10 w-full transition-all text-left">
                        <LogOut className="h-4 w-4" /> LOGOUT
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-zinc-500">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass border-t border-white/5 px-6 py-6 space-y-4">
          <Link to="/" onClick={() => setIsOpen(false)} className={`block text-xs font-bold uppercase tracking-widest ${isActive('/') ? 'text-yellow-500' : 'text-zinc-500'}`}>Home</Link>
          <Link to="/products" onClick={() => setIsOpen(false)} className={`block text-xs font-bold uppercase tracking-widest ${isActive('/products') ? 'text-yellow-500' : 'text-zinc-500'}`}>Products</Link>
          <Link to="/contact" onClick={() => setIsOpen(false)} className={`block text-xs font-bold uppercase tracking-widest ${isActive('/contact') ? 'text-yellow-500' : 'text-zinc-500'}`}>Contact</Link>
          <div className="pt-4 border-t border-white/5">
            {!isAuthenticated ? (
              <Link to="/login" onClick={() => setIsOpen(false)} className="block text-xs font-bold uppercase tracking-widest text-yellow-500">Client Login</Link>
            ) : (
              <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400">
                <LogOut className="h-4 w-4" /> LOGOUT
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
