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
    <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-stone-700 font-oswald">
      {label}
    </label>
    <div className="relative">
      {/* Left icon */}
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Icon className={`w-4 h-4 ${error ? 'text-statusDanger' : 'text-stone-400'}`} />
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'current-password' : 'email'}
        className={`input-glass pl-10 font-erode ${rightElement ? 'pr-10' : 'pr-3'} ${
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative bg-[#FAF9F6]">
      {/* ── Fixed Back Button at Left Corner ────────────────────────── */}
      <div className="fixed top-5 left-5 sm:top-7 sm:left-7 z-30">
        <Link
          to={ROUTES.PUBLIC.HOME}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-oswald font-semibold uppercase tracking-widest text-stone-800 hover:text-stone-950 bg-white/90 hover:bg-white border border-[#DDD5C7] shadow-2xs transition-all group cursor-pointer"
          title="Return to Public LaundryWave Website"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-stone-700" />
          <span>Back to Website</span>
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
          {/* Logo Emblem */}
          <div className="inline-flex w-16 h-16 rounded-2xl bg-white border border-[#DDD5C7] items-center justify-center shadow-sm mb-4 overflow-hidden">
            <img
              src="/logo.svg"
              onError={(e) => { e.currentTarget.src = '/logo.png'; }}
              alt="LaundryWave"
              className="w-11 h-11 object-contain"
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-oswald uppercase tracking-tight text-stone-900">
            LaundryWave
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F6F3EE] border border-[#E7E2D8] mt-2 mb-3">
            <Zap className="w-3 h-3 text-stone-700" />
            <span className="text-[11px] font-oswald font-semibold text-stone-700 uppercase tracking-widest">
              Laundry Admin & Operations Portal
            </span>
          </div>
          <p className="text-sm font-erode text-stone-600">
            Sign in to manage your laundry facility and orders
          </p>
        </motion.div>

        {/* ── Glass Card ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white border border-[#E7E2D8] rounded-2xl shadow-xl p-7 sm:p-9"
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold font-oswald uppercase tracking-wide text-stone-900">Welcome back</h2>
            <p className="text-xs font-erode text-stone-600 mt-0.5">Enter your store admin credentials</p>
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
                    className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
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
                className="w-full py-3.5 rounded-full font-oswald font-semibold uppercase tracking-widest text-xs bg-stone-900 hover:bg-stone-800 text-white shadow-sm flex items-center justify-center gap-2 mt-4 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
            <p className="text-center text-xs font-erode text-stone-500 mt-6">
              Authorized access for{' '}
              <span className="text-stone-900 font-semibold font-oswald uppercase tracking-wide">Store Admins</span> &{' '}
              <span className="text-stone-900 font-semibold font-oswald uppercase tracking-wide">Super Admins</span>.
            </p>
          </motion.div>

          {/* ── Bottom branding ─────────────────────────────────────── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs font-erode text-stone-500 mt-6"
          >
            LaundryWave &copy; {new Date().getFullYear()} · Atelier Operations Standard
          </motion.p>
        </div>
      </div>
  );
};

export default Login;
