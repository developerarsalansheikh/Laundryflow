import { motion } from 'framer-motion';
import { CreditCard, ShoppingBag, Users, Store } from 'lucide-react';
import { formatIndianCurrency, formatIndianNumber } from '../../utils/formatters';

// ── Sparkline SVG shapes — each is unique to its metric type ──────────────────

/** Revenue sparkline — rising trend with sharp uptick */
const RevenueSpark = () => (
  <svg className="w-24 h-9 overflow-visible" viewBox="0 0 100 40" aria-hidden="true">
    <defs>
      <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.45} />
        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
      </linearGradient>
    </defs>
    <path d="M0 35 L15 28 L30 30 L45 18 L60 22 L75 10 L90 13 L100 4 L100 40 L0 40 Z" fill="url(#grad-rev)" />
    <path d="M0 35 L15 28 L30 30 L45 18 L60 22 L75 10 L90 13 L100 4" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="100" cy="4" r="3" fill="#8B5CF6" />
  </svg>
);

/** Orders sparkline — steady high volume with plateau */
const OrdersSpark = () => (
  <svg className="w-24 h-9 overflow-visible" viewBox="0 0 100 40" aria-hidden="true">
    <defs>
      <linearGradient id="grad-ord" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.45} />
        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
      </linearGradient>
    </defs>
    <path d="M0 28 L20 22 L35 25 L50 14 L65 17 L80 10 L100 8 L100 40 L0 40 Z" fill="url(#grad-ord)" />
    <path d="M0 28 L20 22 L35 25 L50 14 L65 17 L80 10 L100 8" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="100" cy="8" r="3" fill="#3B82F6" />
  </svg>
);

/** Customers sparkline — slower growth with dip then recovery */
const CustomersSpark = () => (
  <svg className="w-24 h-9 overflow-visible" viewBox="0 0 100 40" aria-hidden="true">
    <defs>
      <linearGradient id="grad-usr" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.45} />
        <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
      </linearGradient>
    </defs>
    <path d="M0 30 L15 26 L30 30 L45 26 L60 20 L75 22 L90 15 L100 10 L100 40 L0 40 Z" fill="url(#grad-usr)" />
    <path d="M0 30 L15 26 L30 30 L45 26 L60 20 L75 22 L90 15 L100 10" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="100" cy="10" r="3" fill="#06B6D4" />
  </svg>
);

/** Laundries sparkline — step-wise onboarding growth */
const LaundriesSpark = () => (
  <svg className="w-24 h-9 overflow-visible" viewBox="0 0 100 40" aria-hidden="true">
    <defs>
      <linearGradient id="grad-lnd" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.45} />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
      </linearGradient>
    </defs>
    <path d="M0 34 L20 34 L20 26 L40 26 L40 20 L60 20 L60 14 L80 14 L80 8 L100 8 L100 40 L0 40 Z" fill="url(#grad-lnd)" />
    <path d="M0 34 L20 34 L20 26 L40 26 L40 20 L60 20 L60 14 L80 14 L80 8 L100 8" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="100" cy="8" r="3" fill="#F59E0B" />
  </svg>
);

// ── Animation variants ─────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
};

// ── StatCard ──────────────────────────────────────────────────────────────────

/**
 * Individual Stat Card — icon, title, formatted value, sparkline trend.
 */
export const StatCard = ({ icon: Icon, title, subTitle, value, SparkComponent, color }) => {
  return (
    <motion.div
      variants={cardVariants}
      className="glass-card p-5 relative overflow-hidden group hover:border-purple-500/30 transition-colors duration-300"
    >
      {/* Subtle background glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[inherit]"
        style={{
          background: `radial-gradient(ellipse at 80% 20%, ${color}12 0%, transparent 60%)`,
        }}
      />

      {/* Top row: icon + title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner flex-shrink-0"
            style={{
              backgroundColor: `${color}1A`,
              border: `1px solid ${color}33`,
              color,
            }}
            aria-hidden="true"
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-textSecondary block leading-tight">{title}</span>
            {subTitle && (
              <span className="text-[10px] font-medium text-textMuted leading-tight block mt-0.5">
                {subTitle}
              </span>
            )}
          </div>
        </div>

        {/* No comparison data from backend — show honest dash */}
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/8 text-textMuted"
          title="Historical comparison not available"
        >
          —
        </span>
      </div>

      {/* Bottom row: value + sparkline */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl sm:text-3xl font-extrabold text-textPrimary tracking-tight tabular-nums">
            {value}
          </p>
          <p className="text-[10px] text-textMuted mt-1 font-medium">Platform total</p>
        </div>
        <div className="pb-1 flex-shrink-0">
          <SparkComponent />
        </div>
      </div>
    </motion.div>
  );
};

// ── StatsGrid ─────────────────────────────────────────────────────────────────

/**
 * Responsive 4-column stats grid for Super Admin Dashboard.
 * Receives real backend stats object. All values formatted in Indian system.
 */
export const StatsGrid = ({ stats = {} }) => {
  const {
    totalRevenue = 0,
    totalOrders = 0,
    totalUsers = 0,
    totalLaundries = 0,
    activeLaundries = 0,
    pendingLaundries = 0,
  } = stats;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5"
    >
      {/* 1. Total Revenue */}
      <StatCard
        icon={CreditCard}
        title="Total Revenue"
        subTitle="Platform Gross (Paid Orders)"
        value={formatIndianCurrency(totalRevenue)}
        SparkComponent={RevenueSpark}
        color="#8B5CF6"
      />

      {/* 2. Total Orders */}
      <StatCard
        icon={ShoppingBag}
        title="Total Orders"
        subTitle="All-time Platform Orders"
        value={formatIndianNumber(totalOrders)}
        SparkComponent={OrdersSpark}
        color="#3B82F6"
      />

      {/* 3. Total Customers */}
      <StatCard
        icon={Users}
        title="Total Customers"
        subTitle="Registered User Accounts"
        value={formatIndianNumber(totalUsers)}
        SparkComponent={CustomersSpark}
        color="#06B6D4"
      />

      {/* 4. Total Laundries */}
      <StatCard
        icon={Store}
        title="Total Laundries"
        subTitle={`${formatIndianNumber(activeLaundries)} Active · ${formatIndianNumber(pendingLaundries)} Pending`}
        value={formatIndianNumber(totalLaundries)}
        SparkComponent={LaundriesSpark}
        color="#F59E0B"
      />
    </motion.div>
  );
};

export default StatsGrid;
