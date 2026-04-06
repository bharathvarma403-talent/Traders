import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useToast } from '../utils/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Mail, Phone, LogIn, AlertCircle, ShieldCheck,
  User, Eye, EyeOff, RefreshCw, CheckCircle2, UserPlus
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const TAB = { EMAIL: 'email', PHONE: 'phone', REGISTER: 'register' };

// ─── PIN Input Component ──────────────────────────────────────────────────
function PinInput({ value, onChange, length = 6, id }) {
  const inputRefs = useRef([]);
  const digits = value.split('').concat(Array(length - value.length).fill(''));

  const handleChange = (index, e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val && e.nativeEvent.inputType === 'deleteContentBackward') {
      const newDigits = [...digits];
      newDigits[index] = '';
      onChange(newDigits.join(''));
      if (index > 0) inputRefs.current[index - 1]?.focus();
      return;
    }
    if (!val) return;

    const newDigits = [...digits];
    newDigits[index] = val.charAt(val.length - 1);
    const newValue = newDigits.join('');
    onChange(newValue);

    if (index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    const nextIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" id={id}>
      {digits.slice(0, length).map((digit, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="w-11 h-13 text-center text-xl font-bold rounded-xl outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: digit ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(75,124,243,0.5)'}
          onBlur={e => e.target.style.borderColor = digit ? 'var(--color-accent)' : 'var(--color-border)'}
        />
      ))}
    </div>
  );
}

// ─── Input Component ──────────────────────────────────────────────────────
function AuthInput({ icon: Icon, type = 'text', value, onChange, placeholder, id, autoComplete, error }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 opacity-50"
          style={{ color: 'var(--color-muted)' }} />
        <input
          id={id}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full rounded-xl py-3 pl-10 pr-10 text-sm outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(75,124,243,0.5)')}
          onBlur={(e) => (e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'var(--color-border)')}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--color-muted)' }}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs mt-1" style={{ color: '#fca5a5' }}>{error}</p>}
    </div>
  );
}

// ─── Error/Success Banners ─────────────────────────────────────────────────
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#86efac' }}>
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export default function Login() {
  const [activeTab, setActiveTab] = useState(TAB.REGISTER);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Email login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPhonePassword, setLoginPhonePassword] = useState('');

  // Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, login, loginWithPhone, register, googleLogin, isAuthenticated, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';
  const loginMessage = location.state?.message || '';
  const devAdminHint = import.meta.env.DEV
    ? 'Run npm run seed:auth in BACKEND to generate local login credentials.'
    : '';
  const googleAuthConfigured =
    typeof import.meta.env.VITE_GOOGLE_CLIENT_ID === 'string' &&
    import.meta.env.VITE_GOOGLE_CLIENT_ID.trim().endsWith('.apps.googleusercontent.com');

  // Redirect if already authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (isAdminMode && user.role !== 'ADMIN') return;

    navigate(user.role === 'ADMIN' ? '/admin/dashboard' : from, { replace: true });
  }, [from, isAdminMode, isAuthenticated, navigate, user]);

  const clearMessages = () => { setError(''); setSuccess(''); setFieldErrors({}); };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    clearMessages();
  };

  // ── Email Login ──────────────────────────────────────────────────────────
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Enter your email address.');
      return;
    }

    setLoading(true);
    const result = await login(trimmedEmail, password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate(result.user?.role === 'ADMIN' ? '/admin/dashboard' : from, { replace: true });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    clearMessages();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Enter the admin email address.');
      return;
    }

    setLoading(true);
    const result = await login(trimmedEmail, password);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.user?.role !== 'ADMIN') {
      logout();
      setError('This account does not have admin access.');
      setLoading(false);
      return;
    }

    toast.success('Admin access verified.');
    navigate('/admin/dashboard', { replace: true });
    setLoading(false);
  };

  // ── Phone Login ──────────────────────────────────────────────────────────
  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!loginPhone.match(/^\+?[0-9]{7,15}$/)) { setError('Enter a valid phone number.'); setLoading(false); return; }
    setLoading(true);
    const result = await loginWithPhone(loginPhone, loginPhonePassword);
    if (result.success) {
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // ── Register ─────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();

    const errors = {};
    if (!regName.trim() || regName.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
    if (!regEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = 'Enter a valid email address.';
    if (!regPassword.match(/^\d{6}$/)) errors.password = 'Password must be exactly 6 digits.';
    if (regPhone && !regPhone.match(/^\+?[0-9]{7,15}$/)) errors.phone = 'Enter a valid phone number.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    const result = await register(regName, regEmail, regPassword, regPhone || undefined);
    if (result.success) {
      toast.success('Account created successfully!');
      navigate(from, { replace: true });
    } else {
      if (result.redirectToLogin) {
        setSuccess(result.error);
        setTimeout(() => handleTabChange(TAB.EMAIL), 2000);
      } else {
        setError(result.error);
      }
    }
    setLoading(false);
  };

  // ── Google ───────────────────────────────────────────────────────────────
  const handleGoogleSuccess = async (response) => {
    clearMessages();
    if (!response?.credential) {
      setError('Google did not return a valid credential. Please try again.');
      return;
    }

    setLoading(true);
    const result = await googleLogin(response.credential);
    if (result.success) {
      toast.success('Signed in with Google!');
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const tabStyle = (tab) =>
    activeTab === tab
      ? { background: 'var(--color-accent)', color: '#1a1500' }
      : { background: 'transparent', color: 'var(--color-muted)', border: '1px solid var(--color-border)' };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-md overflow-hidden rounded-3xl p-8 shadow-2xl transition-all duration-500"
          style={{
            background: 'var(--color-surface)',
            border: `1px solid ${isAdminMode ? 'rgba(255,215,0,0.3)' : 'var(--color-border)'}`,
            boxShadow: isAdminMode ? '0 0 60px rgba(255,215,0,0.06)' : '0 24px 80px rgba(0,0,0,0.4)',
          }}
        >
          {/* Header */}
          <div className="mb-7 text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-500"
              style={{
                background: isAdminMode ? 'rgba(255,215,0,0.1)' : 'rgba(75,124,243,0.1)',
                border: `1px solid ${isAdminMode ? 'rgba(255,215,0,0.2)' : 'rgba(75,124,243,0.2)'}`,
              }}
            >
              {isAdminMode
                ? <ShieldCheck className="h-7 w-7 text-[var(--color-accent)]" />
                : <User className="h-7 w-7 text-blue-400" />}
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {isAdminMode ? 'Admin Portal' : activeTab === TAB.REGISTER ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--color-muted)' }}>
              {isAdminMode ? 'Authorized personnel only.'
                : activeTab === TAB.REGISTER ? 'Join Vasavi Traders today.'
                : 'Sign in to track your material requests.'}
            </p>
          </div>

          {loginMessage && <SuccessBanner message={loginMessage} />}

          {/* ═══ CUSTOMER PANEL ═══ */}
          {!isAdminMode ? (
            <div className="space-y-6">

              {/* Google */}
              {activeTab !== TAB.REGISTER && (
                googleAuthConfigured ? (
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google Authentication Failed. Check your Google Cloud authorized origins and try again.')}
                      theme="filled_black"
                      shape="pill"
                      width="320"
                    />
                  </div>
                ) : (
                  <SuccessBanner message="Google Sign-In is not configured yet. Add VITE_GOOGLE_CLIENT_ID to FRONTEND/.env.local to enable it." />
                )
              )}

              {/* Divider */}
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-[var(--color-border)]" />
                <span className="mx-3 shrink-0 text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
                  or continue with
                </span>
                <div className="flex-grow border-t border-[var(--color-border)]" />
              </div>

              {/* Tab Pills */}
              <div className="flex gap-2 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {[
                  { id: TAB.REGISTER, icon: UserPlus, label: 'Register' },
                  { id: TAB.EMAIL, icon: Mail, label: 'Email' },
                  { id: TAB.PHONE, icon: Phone, label: 'Phone' },
                ].map(({ id, icon: Icon, label }) => (
                  <button key={id} type="button" onClick={() => handleTabChange(id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all"
                    style={tabStyle(id)}>
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              <ErrorBanner message={error} />
              <SuccessBanner message={success} />

              {/* ── Email Login ── */}
              {activeTab === TAB.EMAIL && (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>Email</label>
                    <AuthInput id="email-login-email" icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>6-Digit Password</label>
                    <PinInput value={password} onChange={setPassword} id="email-login-password" />
                  </div>
                  <button type="submit" disabled={loading || password.length < 6}
                    className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold"
                    style={{ opacity: loading || password.length < 6 ? 0.6 : 1 }}>
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                  <p className="text-center text-xs" style={{ color: 'var(--color-muted)' }}>
                    No account?{' '}
                    <button type="button" onClick={() => handleTabChange(TAB.REGISTER)}
                      className="font-semibold underline underline-offset-2 hover:opacity-80"
                      style={{ color: 'var(--color-accent)' }}>
                      Register here
                    </button>
                  </p>
                </form>
              )}

              {/* ── Phone Login ── */}
              {activeTab === TAB.PHONE && (
                <form onSubmit={handlePhoneLogin} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>Phone Number</label>
                    <AuthInput id="phone-login-phone" icon={Phone} type="tel" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>6-Digit Password</label>
                    <PinInput value={loginPhonePassword} onChange={setLoginPhonePassword} id="phone-login-password" />
                  </div>
                  <button type="submit" disabled={loading || loginPhonePassword.length < 6}
                    className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold"
                    style={{ opacity: loading || loginPhonePassword.length < 6 ? 0.6 : 1 }}>
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                  <p className="text-center text-xs" style={{ color: 'var(--color-muted)' }}>
                    No account?{' '}
                    <button type="button" onClick={() => handleTabChange(TAB.REGISTER)}
                      className="font-semibold underline underline-offset-2 hover:opacity-80"
                      style={{ color: 'var(--color-accent)' }}>
                      Register here
                    </button>
                  </p>
                </form>
              )}

              {/* ── Register ── */}
              {activeTab === TAB.REGISTER && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>Full Name</label>
                    <AuthInput id="reg-name" icon={User} value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Your full name" autoComplete="name" error={fieldErrors.name} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>Email Address</label>
                    <AuthInput id="reg-email" icon={Mail} type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" error={fieldErrors.email} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
                      Phone <span className="normal-case font-normal opacity-60">(optional)</span>
                    </label>
                    <AuthInput id="reg-phone" icon={Phone} type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" error={fieldErrors.phone} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>6-Digit Password</label>
                    <PinInput value={regPassword} onChange={setRegPassword} id="reg-password" />
                    {fieldErrors.password && <p className="text-xs mt-1.5 text-center" style={{ color: '#fca5a5' }}>{fieldErrors.password}</p>}
                  </div>
                  <button type="submit" disabled={loading}
                    className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold"
                    style={{ opacity: loading ? 0.7 : 1 }}>
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                  <p className="text-center text-xs" style={{ color: 'var(--color-muted)' }}>
                    Already have an account?{' '}
                    <button type="button" onClick={() => handleTabChange(TAB.EMAIL)}
                      className="font-semibold underline underline-offset-2 hover:opacity-80"
                      style={{ color: 'var(--color-accent)' }}>
                      Sign in
                    </button>
                  </p>
                </form>
              )}

              {/* Admin toggle */}
              <div className="relative flex items-center pt-2">
                <div className="flex-grow border-t border-dashed border-[var(--color-border)]" />
                <button type="button" onClick={() => { setIsAdminMode(true); setEmail(''); setPassword(''); clearMessages(); }}
                  className="mx-3 shrink-0 text-xs font-medium uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--color-muted)' }}>
                  Admin Access
                </button>
                <div className="flex-grow border-t border-dashed border-[var(--color-border)]" />
              </div>
            </div>

          ) : (
          /* ═══ ADMIN PANEL ═══ */
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <ErrorBanner message={error} />
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Admin Email</label>
                <AuthInput id="admin-email" icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vasavi@admin.com" autoComplete="username" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>6-Digit Password</label>
                <PinInput value={password} onChange={setPassword} id="admin-password" />
              </div>
              {devAdminHint && (
                <p className="text-center text-xs" style={{ color: 'var(--color-muted)' }}>
                  {devAdminHint}
                </p>
              )}
              <button type="submit" disabled={loading || password.length < 6}
                className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold"
                style={{ opacity: loading || password.length < 6 ? 0.6 : 1 }}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {loading ? 'Verifying...' : 'Verify Admin Access'}
              </button>
              <button type="button" onClick={() => { setIsAdminMode(false); setEmail(''); setPassword(''); clearMessages(); }}
                className="w-full text-center text-xs underline underline-offset-2 opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--color-muted)' }}>
                ← Back to Customer Login
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
