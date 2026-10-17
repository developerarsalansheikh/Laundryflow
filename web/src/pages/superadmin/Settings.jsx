import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
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
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3.5 border-b border-slate-100 last:border-0">
    <span className="text-xs font-semibold text-slate-500 w-40 shrink-0">{label}</span>
    {children || <span className="text-sm text-slate-900 font-medium">{value || '—'}</span>}
  </div>
);

// ── Input Component ────────────────────────────────────────────
const FormInput = ({ id, label, value, onChange, type = 'text', placeholder, disabled, rightIcon }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-semibold text-slate-700">
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
        className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs pr-10"
      />
      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightIcon}</div>
      )}
    </div>
  </div>
);

// ── Toggle Row ─────────────────────────────────────────────────
const ToggleRow = ({ label, description, value, onChange, disabled }) => (
  <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-0">
    <div>
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className="shrink-0 disabled:opacity-50 transition-all cursor-pointer"
    >
      {value ? (
        <ToggleRight className="w-9 h-9 text-blue-600" />
      ) : (
        <ToggleLeft className="w-9 h-9 text-slate-300" />
      )}
    </button>
  </div>
);

// ── Profile Tab ────────────────────────────────────────────────
const ProfileTab = ({ user }) => (
  <motion.div variants={TAB_VARIANTS} initial="hidden" animate="visible" className="space-y-5">
    {/* Avatar + name card */}
    <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
      <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-xs">
        {user?.name?.charAt(0)?.toUpperCase() || 'S'}
      </div>
      <div>
        <p className="text-base font-bold text-slate-900">{user?.name || 'Super Admin'}</p>
        <span className="inline-block mt-0.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full capitalize">
          {user?.role || 'Super Admin'}
        </span>
      </div>
    </div>

    {/* Profile fields */}
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-5 py-2">
      <FieldRow label="Full Name" value={user?.name || 'Super Admin'} />
      <FieldRow label="Email Address" value={user?.email || 'admin@laundryflow.in'} />
      <FieldRow label="Phone Number" value={user?.phone || '—'} />
      <FieldRow label="Role" value={(user?.role || 'superadmin').toUpperCase()} />
      <FieldRow label="Account ID">
        <span className="text-xs font-mono text-slate-500">{user?._id || 'USR-SA-PRIMARY'}</span>
      </FieldRow>
    </div>

    <div className="bg-amber-50/80 rounded-2xl border border-amber-200/80 p-4">
      <p className="text-xs text-amber-800 flex items-start gap-2 leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        To update administrative credentials, contact the platform owner or modify verified database records.
        Direct frontend editing is protected for platform security.
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
    <motion.div variants={TAB_VARIANTS} initial="hidden" animate="visible" className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Change Password</h2>
        </div>

        {success && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
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
              <button type="button" onClick={() => setShowCurrent((s) => !s)} className="text-slate-400 hover:text-slate-600 transition-colors">
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
              <button type="button" onClick={() => setShowNew((s) => !s)} className="text-slate-400 hover:text-slate-600 transition-colors">
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
              <button type="button" onClick={() => setShowConfirm((s) => !s)} className="text-slate-400 hover:text-slate-600 transition-colors">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              id="settings-change-password-btn"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
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
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          Session Security
        </h2>
        <div className="space-y-1.5 text-xs text-slate-500">
          <p>• JWT-based authentication with encrypted refresh token rotation</p>
          <p>• Administrative session auto-refresh on platform navigation</p>
          <p>• Rate limiting enforced on all authentication operations</p>
          <p>• Full audit trail captured for super-administrative actions</p>
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
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-500" />
        <p className="text-sm font-semibold text-slate-900">Unable to load platform settings</p>
      </div>
    );
  }

  return (
    <motion.div variants={TAB_VARIANTS} initial="hidden" animate="visible" className="space-y-5">
      {/* General */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600" />
          General Platform Identity
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
            <label htmlFor="settings-currency" className="text-xs font-semibold text-slate-700">
              Default Currency
            </label>
            <select
              id="settings-currency"
              value={form.currency}
              onChange={handleChange('currency')}
              className="px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="INR">INR — Indian Rupee (₹)</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Business Rules */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Percent className="w-4 h-4 text-blue-600" />
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
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-600" />
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
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
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
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
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
  const [searchParams, setSearchParams] = useSearchParams();

  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || 'profile');

  useEffect(() => {
    if (urlTab && ['profile', 'security', 'platform'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Settings</h1>
            <p className="text-xs text-slate-500">Profile, security, and platform configuration</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-2 space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`settings-tab-${tab.id}`}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-500" />}
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
