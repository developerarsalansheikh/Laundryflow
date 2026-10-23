import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Zap, LogIn, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../../routes/routeConstants';

// ── Helpers ──────────────────────────────────────────────────────────────────

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/**
 * Translate backend error messages to user-friendly English.
 */
const humanizeError = (message = '') => {
  if (typeof message !== 'string') return 'Something went wrong. Please try again.';
  const lower = message.toLowerCase();
  if (lower.includes('galat') || lower.includes('invalid') || lower.includes('wrong') || lower.includes('password'))
    return 'Invalid email or password.';
  if (lower.includes('verify') || lower.includes('verified'))
    return 'Your account has not been verified. Contact support.';
  if (lower.includes('deactivate'))
    return 'Your account has been deactivated. Contact support.';
  if (lower.includes('attempts') || lower.includes('zyada') || lower.includes('too many'))
    return 'Too many login attempts. Please try again in 15 minutes.';
  if (lower.includes('network') || lower.includes('err_network') || lower.includes('unable to connect') || lower.includes('failed to fetch'))
    return 'Cannot reach the server. Please check your connection.';
  if (lower.includes('temporary issue') || lower.includes('502') || lower.includes('503') || lower.includes('504'))
    return 'Server encountered a temporary issue. Please try again shortly.';
  return message || 'Something went wrong. Please try again.';
};

// ── Sub-components ────────────────────────────────────────────────────────────

const InputField = ({ id, label, type, value, onChange, onBlur, placeholder, icon: Icon, error, rightElement }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-textSecondary">
      {label}
    </label>
    <div className="relative">
      {/* Left icon */}
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Icon className={`w-4 h-4 ${error ? 'text-statusDanger' : 'text-textMuted'}`} />
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'current-password' : 'email'}
        className={`input-glass pl-10 ${rightElement ? 'pr-10' : 'pr-3'} ${
          error
            ? 'border-statusDanger/60 focus:border-statusDanger focus:shadow-[0_0_0_2px_rgba(239,68,68,0.2)]'
            : ''
        }`}
      />
      {rightElement && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
    {error && (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1.5 text-xs text-statusDanger"
      >
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        {error}
      </motion.p>
    )}
  </div>
);

// ── Main Login Component ──────────────────────────────────────────────────────

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [apiError, setApiError]       = useState('');

  // Field-level validation errors
  const [emailError, setEmailError]   = useState('');
  const [passError, setPassError]     = useState('');

  // Navigate based on role after successful login

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateEmail = (val = email) => {
    if (!val.trim()) { setEmailError('Email is required.'); return false; }
    if (!isValidEmail(val)) { setEmailError('Enter a valid email address.'); return false; }
    setEmailError('');
    return true;
  };

  const validatePassword = (val = password) => {
    if (!val) { setPassError('Password is required.'); return false; }
    if (val.length < 6) { setPassError('Password must be at least 6 characters.'); return false; }
    setPassError('');
    return true;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const emailOk = validateEmail();
    const passOk  = validatePassword();
    if (!emailOk || !passOk) return;

    setIsLoading(true);
    try {
      // POST /api/auth/login → { accessToken, user }
      const { accessToken, user } = await loginApi(email.trim().toLowerCase(), password);

      const userRole = String(user?.role || '').trim().toLowerCase();

      // Validate role — must be superadmin or admin
      if (userRole !== 'superadmin' && userRole !== 'admin') {
        setApiError('Access denied. This portal is for Administrators only.');
        return;
      }

      // Commit auth state
      setAuth({ user, token: accessToken });

      toast.success(`Welcome back, ${user.name}!`);

      // Navigate to respective role portal (validating destination against authenticated role)
      if (userRole === 'admin') {
        const fromPath = typeof location.state?.from === 'string'
          ? location.state.from
          : location.state?.from?.pathname;
        const isValid = typeof fromPath === 'string' &&
          fromPath.startsWith('/admin') &&
          !fromPath.startsWith('//') &&
          !fromPath.includes('://');
        const search = location.state?.from?.search || '';
        const target = isValid ? `${fromPath}${search}` : ROUTES.ADMIN.DASHBOARD;
        navigate(target, { replace: true });
      } else {
        const fromPath = typeof location.state?.from === 'string'
          ? location.state.from
          : location.state?.from?.pathname;
        const isValid = typeof fromPath === 'string' &&
          fromPath.startsWith('/superadmin') &&
          !fromPath.startsWith('//') &&
          !fromPath.includes('://');
        const search = location.state?.from?.search || '';
        const target = isValid ? `${fromPath}${search}` : ROUTES.SUPERADMIN.DASHBOARD;
        navigate(target, { replace: true });
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.details?.message || err?.message || '';
      setApiError(humanizeError(serverMsg));
    } finally {
      setIsLoading(false);
    }
  };


  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
      {/* ── Fixed Back Button at Left Corner ────────────────────────── */}
      <div className="fixed top-5 left-5 sm:top-7 sm:left-7 z-30">
        <Link
          to={ROUTES.PUBLIC.HOME}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-medium text-stone-300 hover:text-white bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/10 shadow-xl transition-all group cursor-pointer"
          title="Return to Public LaundryWave Website"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-indigo-400" />
          <span className="font-medium">Back to Website</span>
        </Link>
      </div>

      <div className="w-full max-w-md">

        {/* ── Header ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          {/* Logo */}
          <img
            src="/logo.svg"
            onError={(e) => { e.currentTarget.src = '/logo.png'; }}
            alt="LaundryWave"
            className="inline-block w-16 h-16 rounded-2xl object-contain shadow-md mb-5"
          />

          <h1 className="text-2xl font-bold text-textPrimary tracking-tight">
            LaundryWave
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-1.5 mb-3">
            <Zap className="w-3 h-3 text-indigo-400" />
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest">
              Laundry Admin & Operations Portal
            </span>
          </div>
          <p className="text-sm text-textMuted">
            Sign in to manage your laundry facility and orders
          </p>
        </motion.div>

        {/* ── Glass Card ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card p-8"
          style={{ boxShadow: '0 0 60px -12px rgba(99, 102, 241, 0.25), 0 25px 50px -12px rgba(0,0,0,0.5)' }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-textPrimary">Welcome back</h2>
            <p className="text-xs text-textSecondary mt-0.5">Enter your store admin credentials</p>
          </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Email */}
              <InputField
                id="login-email"
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                onBlur={() => validateEmail()}
                placeholder="admin@laundrywave.com"
                icon={Mail}
                error={emailError}
              />

              {/* Password */}
              <InputField
                id="login-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (passError) validatePassword(e.target.value); }}
                onBlur={() => validatePassword()}
                placeholder="••••••••"
                icon={Lock}
                error={passError}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="text-textMuted hover:text-textSecondary transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* API-level error */}
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-start gap-2.5 p-3.5 rounded-xl bg-statusDanger/10 border border-statusDanger/25 text-sm text-statusDanger"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </motion.div>
              )}

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In to Store
                  </>
                )}
              </button>
            </form>

            {/* Footer note */}
            <p className="text-center text-xs text-textMuted mt-6">
              Authorized access for{' '}
              <span className="text-indigo-400 font-semibold">Store Admins</span> &{' '}
              <span className="text-primaryPurple font-semibold">Super Admins</span>.
            </p>
          </motion.div>

          {/* ── Bottom branding ─────────────────────────────────────── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs text-textMuted mt-6"
          >
            LaundryWave &copy; {new Date().getFullYear()} · All rights reserved
          </motion.p>
        </div>
      </div>
  );
};

export default Login;
