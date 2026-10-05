import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings2,
  User,
  Shield,
  Sliders,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Mail,
  Globe,
  Bell,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '../../store/authStore';
import { usePlatformSettings, useUpdatePlatformSettings } from '../../hooks/useSettings';
import api from '../../api/axios';

// ── Constants ──────────────────────────────────────────────────
const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'platform', label: 'Platform', icon: Sliders },
];

const PAGE_VARIANTS = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const TAB_VARIANTS = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

// ── Field Row ──────────────────────────────────────────────────
const FieldRow = ({ label, value, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-4 border-b border-white/6 last:border-0">
    <span className="text-xs font-semibold text-textMuted w-40 shrink-0">{label}</span>
    {children || <span className="text-sm text-textPrimary font-medium">{value || '—'}</span>}
  </div>
);

// ── Input Component ────────────────────────────────────────────
const FormInput = ({ id, label, value, onChange, type = 'text', placeholder, disabled, rightIcon }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-semibold text-textMuted">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2.5 text-sm text-textPrimary bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all placeholder:text-textMuted disabled:opacity-50 disabled:cursor-not-allowed pr-10"
      />
      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightIcon}</div>
      )}
    </div>
  </div>
);

// ── Toggle Row ─────────────────────────────────────────────────
const ToggleRow = ({ label, description, value, onChange, disabled }) => (
  <div className="flex items-center justify-between gap-4 py-3.5 border-b border-white/6 last:border-0">
    <div>
      <p className="text-sm font-semibold text-textPrimary">{label}</p>
      {description && <p className="text-xs text-textMuted mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className="shrink-0 disabled:opacity-50 transition-all"
    >
      {value ? (
        <ToggleRight className="w-9 h-9 text-violet-400" />
      ) : (
        <ToggleLeft className="w-9 h-9 text-textMuted" />
      )}
    </button>
  </div>
);

// ── Profile Tab ────────────────────────────────────────────────
const ProfileTab = ({ user }) => (
  <motion.div variants={TAB_VARIANTS} initial="hidden" animate="visible" className="space-y-6">
    {/* Avatar + name */}
    <div className="flex items-center gap-4 p-5 glass-card rounded-2xl border border-white/8">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/40 to-indigo-600/40 border border-violet-500/20 flex items-center justify-center text-xl font-bold text-violet-300">
        {user?.name?.charAt(0)?.toUpperCase() || 'S'}
      </div>
      <div>
        <p className="text-base font-bold text-textPrimary">{user?.name || '—'}</p>
        <p className="text-xs text-violet-400 font-semibold capitalize mt-0.5">{user?.role}</p>
      </div>
    </div>

    {/* Profile fields */}
    <div className="glass-card rounded-2xl border border-white/8 px-5">
      <FieldRow label="Full Name" value={user?.name} />
      <FieldRow label="Email Address" value={user?.email} />
      <FieldRow label="Phone Number" value={user?.phone || '—'} />
      <FieldRow label="Role" value={user?.role?.toUpperCase()} />
      <FieldRow label="Account ID">
        <span className="text-xs font-mono text-textMuted">{user?._id || '—'}</span>
      </FieldRow>
    </div>

    <div className="glass-card rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4">
      <p className="text-xs text-amber-400 flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        To update your name, email, or phone, please contact the platform owner or modify directly in the database.
        Profile editing via the Super Admin portal is disabled for security reasons.
      </p>
    </div>
  </motion.div>
);

// ── Security Tab ───────────────────────────────────────────────
const SecurityTab = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await api.put('/api/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password changed successfully!');
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'Failed to change password. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div variants={TAB_VARIANTS} initial="hidden" animate="visible" className="space-y-6">
      <div className="glass-card rounded-2xl border border-white/8 p-5">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-bold text-textPrimary">Change Password</h2>
        </div>

        {success && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Password updated successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            id="settings-current-password"
            label="Current Password"
            type={showCurrent ? 'text' : 'password'}
            value={form.currentPassword}
            onChange={handleChange('currentPassword')}
            placeholder="Enter current password"
            rightIcon={
              <button type="button" onClick={() => setShowCurrent((s) => !s)} className="text-textMuted hover:text-textPrimary transition-colors">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <FormInput
            id="settings-new-password"
            label="New Password"
            type={showNew ? 'text' : 'password'}
            value={form.newPassword}
            onChange={handleChange('newPassword')}
            placeholder="Min. 8 characters"
            rightIcon={
              <button type="button" onClick={() => setShowNew((s) => !s)} className="text-textMuted hover:text-textPrimary transition-colors">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <FormInput
            id="settings-confirm-password"
            label="Confirm New Password"
            type={showConfirm ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={handleChange('confirmPassword')}
            placeholder="Repeat new password"
            rightIcon={
              <button type="button" onClick={() => setShowConfirm((s) => !s)} className="text-textMuted hover:text-textPrimary transition-colors">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              id="settings-change-password-btn"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {isLoading ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Session Info */}
      <div className="glass-card rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-bold text-textPrimary mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-violet-400" />
          Session Security
        </h2>
        <div className="space-y-1 text-xs text-textMuted">
          <p>• JWT-based authentication with refresh token rotation</p>
          <p>• Session automatically expires after token expiry</p>
          <p>• Rate limiting applied to all auth endpoints</p>
          <p>• HTTPS enforced in production environments</p>
        </div>
      </div>
    </motion.div>
  );
};

// ── Platform Tab ───────────────────────────────────────────────
const PlatformTab = () => {
  const { data, isLoading, isError } = usePlatformSettings();
  const { mutate: updateSettings, isPending } = useUpdatePlatformSettings();

  const [form, setForm] = useState({
    platformName: '',
    defaultCommissionPercent: 10,
    currency: 'INR',
    supportEmail: '',
    supportPhone: '',
    maintenanceMode: false,
    autoApproveLaundries: false,
    minOrderAmount: 50,
  });

  const [isDirty, setIsDirty] = useState(false);

  // Sync from server
  useEffect(() => {
    if (data?.data) {
      setForm({
        platformName: data.data.platformName || '',
        defaultCommissionPercent: data.data.defaultCommissionPercent ?? 10,
        currency: data.data.currency || 'INR',
        supportEmail: data.data.supportEmail || '',
        supportPhone: data.data.supportPhone || '',
        maintenanceMode: data.data.maintenanceMode ?? false,
        autoApproveLaundries: data.data.autoApproveLaundries ?? false,
        minOrderAmount: data.data.minOrderAmount ?? 50,
      });
      setIsDirty(false);
    }
  }, [data]);

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleToggle = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateSettings(form, {
      onSuccess: () => {
        toast.success('Platform settings saved!');
        setIsDirty(false);
      },
      onError: (err) => {
        const msg = err?.response?.data?.message || 'Failed to save settings';
        toast.error(msg);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl border border-white/8 p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-card rounded-2xl border border-rose-500/20 p-8 flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-400" />
        <p className="text-sm font-semibold text-textPrimary">Unable to load platform settings</p>
      </div>
    );
  }

  return (
    <motion.div variants={TAB_VARIANTS} initial="hidden" animate="visible" className="space-y-5">
      {/* General */}
      <div className="glass-card rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-bold text-textPrimary mb-5 flex items-center gap-2">
          <Globe className="w-4 h-4 text-violet-400" />
          General
        </h2>
        <div className="space-y-4">
          <FormInput
            id="settings-platform-name"
            label="Platform Name"
            value={form.platformName}
            onChange={handleChange('platformName')}
            placeholder="LaundryFlow"
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="settings-currency" className="text-xs font-semibold text-textMuted">
              Default Currency
            </label>
            <select
              id="settings-currency"
              value={form.currency}
              onChange={handleChange('currency')}
              className="px-3 py-2.5 text-sm text-textPrimary bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/40 cursor-pointer"
            >
              <option value="INR" className="bg-[#0f1224]">INR — Indian Rupee</option>
              <option value="USD" className="bg-[#0f1224]">USD — US Dollar</option>
              <option value="EUR" className="bg-[#0f1224]">EUR — Euro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Business Rules */}
      <div className="glass-card rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-bold text-textPrimary mb-5 flex items-center gap-2">
          <Percent className="w-4 h-4 text-violet-400" />
          Business Rules
        </h2>
        <div className="space-y-4">
          <FormInput
            id="settings-commission"
            label="Default Commission (%)"
            type="number"
            value={form.defaultCommissionPercent}
            onChange={handleChange('defaultCommissionPercent')}
            placeholder="10"
          />
          <FormInput
            id="settings-min-order"
            label="Minimum Order Amount (₹)"
            type="number"
            value={form.minOrderAmount}
            onChange={handleChange('minOrderAmount')}
            placeholder="50"
          />
        </div>
      </div>

      {/* Support Info */}
      <div className="glass-card rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-bold text-textPrimary mb-5 flex items-center gap-2">
          <Mail className="w-4 h-4 text-violet-400" />
          Support Contact
        </h2>
        <div className="space-y-4">
          <FormInput
            id="settings-support-email"
            label="Support Email"
            type="email"
            value={form.supportEmail}
            onChange={handleChange('supportEmail')}
            placeholder="support@laundryflow.in"
          />
          <FormInput
            id="settings-support-phone"
            label="Support Phone"
            value={form.supportPhone}
            onChange={handleChange('supportPhone')}
            placeholder="+91 98765 43210"
          />
        </div>
      </div>

      {/* Feature Flags */}
      <div className="glass-card rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-bold text-textPrimary mb-2 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-violet-400" />
          Feature Flags
        </h2>
        <ToggleRow
          label="Maintenance Mode"
          description="Temporarily disables the platform for all users except SuperAdmin."
          value={form.maintenanceMode}
          onChange={handleToggle('maintenanceMode')}
        />
        <ToggleRow
          label="Auto-Approve Laundries"
          description="New laundry registrations are automatically approved without review."
          value={form.autoApproveLaundries}
          onChange={handleToggle('autoApproveLaundries')}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          id="settings-platform-save-btn"
          onClick={handleSave}
          disabled={isPending || !isDirty}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isPending ? 'Saving…' : isDirty ? 'Save Changes' : 'No Changes'}
        </button>
      </div>
    </motion.div>
  );
};

// ── Main Settings Page ─────────────────────────────────────────
export const Settings = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Header */}
      <div className="glass-card rounded-2xl border border-white/8 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-textPrimary">Settings</h1>
            <p className="text-xs text-textSecondary">Profile, security, and platform configuration</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar Tabs */}
        <div className="lg:w-52 shrink-0">
          <div className="glass-card rounded-2xl border border-white/8 p-2 space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`settings-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                      : 'text-textSecondary hover:bg-white/5 hover:text-textPrimary border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && <ProfileTab key="profile" user={user} />}
            {activeTab === 'security' && <SecurityTab key="security" />}
            {activeTab === 'platform' && <PlatformTab key="platform" />}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
