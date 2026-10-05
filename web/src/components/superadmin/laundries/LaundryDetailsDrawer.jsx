import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Calendar,
  Percent,
  TrendingUp,
  ShoppingBag,
  Navigation,
  Sparkles,
} from 'lucide-react';
import LaundryStatusBadge from './LaundryStatusBadge';
import { formatIndianCurrency, formatIndianNumber } from '../../../utils/formatters';

/**
 * LaundryDetailsDrawer Component
 * Side drawer for displaying comprehensive laundry information.
 */
export const LaundryDetailsDrawer = ({ laundry, isOpen, onClose }) => {
  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !laundry) return null;

  const owner = laundry.owner || {};
  const coordinates = laundry.location?.coordinates || [0, 0];
  const workingDays = Array.isArray(laundry.workingDays)
    ? laundry.workingDays.join(', ')
    : 'Monday - Saturday';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-[#090D1E] border-l border-white/10 shadow-2xl flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/8 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  {laundry.logo ? (
                    <img
                      src={laundry.logo}
                      alt={laundry.name}
                      className="w-11 h-11 rounded-xl object-cover border border-white/10 shadow-lg"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-lg">
                      {laundry.name ? laundry.name.charAt(0).toUpperCase() : <Store className="w-5 h-5" />}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-textPrimary">{laundry.name}</h2>
                    <p className="text-xs text-textMuted flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-textMuted" />
                      {laundry.city}, {laundry.state}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-textMuted hover:text-textPrimary transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/10">
                {/* Status & Subscription */}
                <div className="glass-card p-4 rounded-xl border border-white/8 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-textMuted font-medium">Platform Status</span>
                    <LaundryStatusBadge status={laundry.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                    <span className="text-textMuted font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Subscription Plan
                    </span>
                    <span className="font-semibold capitalize text-purple-300">
                      {laundry.subscriptionStatus || 'Trial'}
                    </span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted mb-2.5">
                    Business Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-card p-3 rounded-xl border border-white/8">
                      <div className="flex items-center gap-1.5 text-textMuted text-xs mb-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                        <span>Total Orders</span>
                      </div>
                      <p className="text-base font-bold text-textPrimary tabular-nums">
                        {formatIndianNumber(laundry.totalOrders || 0)}
                      </p>
                    </div>

                    <div className="glass-card p-3 rounded-xl border border-white/8">
                      <div className="flex items-center gap-1.5 text-textMuted text-xs mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Total Revenue</span>
                      </div>
                      <p className="text-base font-bold text-textPrimary tabular-nums">
                        {formatIndianCurrency(laundry.totalRevenue || 0)}
                      </p>
                    </div>

                    <div className="glass-card p-3 rounded-xl border border-white/8">
                      <div className="flex items-center gap-1.5 text-textMuted text-xs mb-1">
                        <Percent className="w-3.5 h-3.5 text-purple-400" />
                        <span>Commission</span>
                      </div>
                      <p className="text-base font-bold text-purple-300 tabular-nums">
                        {laundry.commissionPercent !== undefined ? `${laundry.commissionPercent}%` : '10%'}
                      </p>
                    </div>

                    <div className="glass-card p-3 rounded-xl border border-white/8">
                      <div className="flex items-center gap-1.5 text-textMuted text-xs mb-1">
                        <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Delivery Radius</span>
                      </div>
                      <p className="text-base font-bold text-textPrimary">
                        {laundry.serviceRadius || 10} km
                      </p>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted mb-2.5">
                    Owner Details
                  </h3>
                  <div className="glass-card p-4 rounded-xl border border-white/8 space-y-2.5 text-xs">
                    <div className="flex items-center gap-2.5 text-textSecondary">
                      <User className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span className="font-semibold text-textPrimary">{owner.name || 'Unassigned'}</span>
                    </div>

                    {owner.email && (
                      <div className="flex items-center gap-2.5 text-textMuted">
                        <Mail className="w-4 h-4 text-textMuted flex-shrink-0" />
                        <a href={`mailto:${owner.email}`} className="hover:text-purple-300 transition-colors">
                          {owner.email}
                        </a>
                      </div>
                    )}

                    {owner.phone && (
                      <div className="flex items-center gap-2.5 text-textMuted">
                        <Phone className="w-4 h-4 text-textMuted flex-shrink-0" />
                        <a href={`tel:${owner.phone}`} className="hover:text-purple-300 transition-colors">
                          {owner.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location & Address */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted mb-2.5">
                    Location & Contact
                  </h3>
                  <div className="glass-card p-4 rounded-xl border border-white/8 space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5 text-textSecondary">
                      <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-textPrimary">{laundry.address}</p>
                        <p className="text-textMuted mt-0.5">
                          {laundry.city}, {laundry.state} - {laundry.pincode}
                        </p>
                      </div>
                    </div>

                    {laundry.phone && (
                      <div className="flex items-center gap-2.5 text-textMuted pt-2 border-t border-white/5">
                        <Phone className="w-3.5 h-3.5 text-textMuted" />
                        <span>{laundry.phone}</span>
                      </div>
                    )}

                    {laundry.email && (
                      <div className="flex items-center gap-2.5 text-textMuted">
                        <Mail className="w-3.5 h-3.5 text-textMuted" />
                        <span>{laundry.email}</span>
                      </div>
                    )}

                    {coordinates[0] !== 0 && (
                      <div className="text-[11px] text-textMuted pt-1 font-mono">
                        GPS: [{coordinates[1]?.toFixed(4)}, {coordinates[0]?.toFixed(4)}]
                      </div>
                    )}
                  </div>
                </div>

                {/* Working Hours */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted mb-2.5">
                    Operational Hours
                  </h3>
                  <div className="glass-card p-4 rounded-xl border border-white/8 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-textSecondary">
                      <span className="flex items-center gap-1.5 text-textMuted">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Daily Hours
                      </span>
                      <span className="font-mono font-semibold text-textPrimary">
                        {laundry.openTime || '09:00'} - {laundry.closeTime || '21:00'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-textSecondary pt-2 border-t border-white/5">
                      <span className="flex items-center gap-1.5 text-textMuted">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        Working Days
                      </span>
                      <span className="text-[11px] font-medium text-textPrimary">
                        {workingDays}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-white/8 bg-white/[0.02]">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-textPrimary text-xs font-semibold transition-all cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LaundryDetailsDrawer;
