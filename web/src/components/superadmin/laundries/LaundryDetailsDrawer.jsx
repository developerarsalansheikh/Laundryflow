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
              className="w-screen max-w-md bg-white border-l border-[#E7E2D8] shadow-2xl flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#E7E2D8] flex items-center justify-between bg-[#FAF8F5]">
                <div className="flex items-center gap-3">
                  {laundry.logo ? (
                    <img
                      src={laundry.logo}
                      alt={laundry.name}
                      className="w-11 h-11 rounded-xl object-cover border border-[#E7E2D8] shadow-2xs"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-stone-100 border border-[#DDD5C7] flex items-center justify-center text-stone-800 font-bold text-lg font-oswald">
                      {laundry.name ? laundry.name.charAt(0).toUpperCase() : <Store className="w-5 h-5" />}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 font-oswald tracking-tight">{laundry.name}</h2>
                    <p className="text-xs text-stone-500 flex items-center gap-1 font-erode">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      {laundry.city}, {laundry.state}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 border border-[#DDD5C7] flex items-center justify-center text-stone-600 hover:text-stone-900 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-stone-200">
                {/* Status & Subscription */}
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E7E2D8] space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-medium">Platform Status</span>
                    <LaundryStatusBadge status={laundry.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E7E2D8]">
                    <span className="text-stone-600 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-stone-700" />
                      Subscription Plan
                    </span>
                    <span className="font-semibold capitalize text-stone-900 font-erode">
                      {laundry.subscriptionStatus || 'Trial'}
                    </span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-oswald mb-2.5">
                    Business Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-[#E7E2D8] shadow-2xs">
                      <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-stone-600" />
                        <span>Total Orders</span>
                      </div>
                      <p className="text-base font-bold text-stone-900 tabular-nums font-erode">
                        {formatIndianNumber(laundry.totalOrders || 0)}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#E7E2D8] shadow-2xs">
                      <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Total Revenue</span>
                      </div>
                      <p className="text-base font-bold text-stone-900 tabular-nums font-erode">
                        {formatIndianCurrency(laundry.totalRevenue || 0)}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#E7E2D8] shadow-2xs">
                      <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1">
                        <Percent className="w-3.5 h-3.5 text-stone-600" />
                        <span>Commission</span>
                      </div>
                      <p className="text-base font-bold text-stone-900 tabular-nums font-erode">
                        {laundry.commissionPercent !== undefined ? `${laundry.commissionPercent}%` : '10%'}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#E7E2D8] shadow-2xs">
                      <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1">
                        <Navigation className="w-3.5 h-3.5 text-stone-600" />
                        <span>Delivery Radius</span>
                      </div>
                      <p className="text-base font-bold text-stone-900 font-erode">
                        {laundry.serviceRadius || 10} km
                      </p>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-oswald mb-2.5">
                    Owner Details
                  </h3>
                  <div className="bg-white p-4 rounded-xl border border-[#E7E2D8] space-y-2.5 text-xs shadow-2xs">
                    <div className="flex items-center gap-2.5 text-stone-700">
                      <User className="w-4 h-4 text-stone-600 flex-shrink-0" />
                      <span className="font-semibold text-stone-900 font-erode">{owner.name || 'Unassigned'}</span>
                    </div>

                    {owner.email && (
                      <div className="flex items-center gap-2.5 text-stone-500">
                        <Mail className="w-4 h-4 text-stone-400 flex-shrink-0" />
                        <a href={`mailto:${owner.email}`} className="hover:text-stone-900 transition-colors font-erode">
                          {owner.email}
                        </a>
                      </div>
                    )}

                    {owner.phone && (
                      <div className="flex items-center gap-2.5 text-stone-500">
                        <Phone className="w-4 h-4 text-stone-400 flex-shrink-0" />
                        <a href={`tel:${owner.phone}`} className="hover:text-stone-900 transition-colors font-erode">
                          {owner.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location & Address */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-oswald mb-2.5">
                    Location & Contact
                  </h3>
                  <div className="bg-white p-4 rounded-xl border border-[#E7E2D8] space-y-2.5 text-xs shadow-2xs">
                    <div className="flex items-start gap-2.5 text-stone-700">
                      <MapPin className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-stone-900 font-erode">{laundry.address}</p>
                        <p className="text-stone-500 mt-0.5 font-erode">
                          {laundry.city}, {laundry.state} - {laundry.pincode}
                        </p>
                      </div>
                    </div>

                    {laundry.phone && (
                      <div className="flex items-center gap-2.5 text-stone-500 pt-2 border-t border-[#E7E2D8]">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-erode">{laundry.phone}</span>
                      </div>
                    )}

                    {laundry.email && (
                      <div className="flex items-center gap-2.5 text-stone-500">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-erode">{laundry.email}</span>
                      </div>
                    )}

                    {coordinates[0] !== 0 && (
                      <div className="text-[11px] text-stone-400 pt-1 font-mono">
                        GPS: [{coordinates[1]?.toFixed(4)}, {coordinates[0]?.toFixed(4)}]
                      </div>
                    )}
                  </div>
                </div>

                {/* Working Hours */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-oswald mb-2.5">
                    Operational Hours
                  </h3>
                  <div className="bg-white p-4 rounded-xl border border-[#E7E2D8] space-y-2 text-xs shadow-2xs">
                    <div className="flex items-center justify-between text-stone-700">
                      <span className="flex items-center gap-1.5 text-stone-500">
                        <Clock className="w-3.5 h-3.5 text-stone-500" />
                        Daily Hours
                      </span>
                      <span className="font-mono font-semibold text-stone-900">
                        {laundry.openTime || '09:00'} - {laundry.closeTime || '21:00'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-stone-700 pt-2 border-t border-[#E7E2D8]">
                      <span className="flex items-center gap-1.5 text-stone-500">
                        <Calendar className="w-3.5 h-3.5 text-stone-500" />
                        Working Days
                      </span>
                      <span className="text-[11px] font-medium text-stone-900 font-erode">
                        {workingDays}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#E7E2D8] bg-[#FAF8F5]">
                <button
                  onClick={onClose}
                  className="btn-secondary w-full py-2.5 rounded-full font-oswald uppercase tracking-wider text-xs cursor-pointer shadow-2xs hover:bg-stone-100"
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
