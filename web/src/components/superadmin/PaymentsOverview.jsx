import { motion } from 'framer-motion';
import { CreditCard, Wallet2, DollarSign } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { formatIndianCurrency, formatIndianNumber } from '../../utils/formatters';

// ── Real backend payment method enum values ───────────────────────────────────
// paymentModels.js: method enum = ["razorpay", "cod", "upi"]
const METHOD_CONFIG = {
  razorpay: { label: 'Online (Razorpay)', color: '#8B5CF6', shortLabel: 'Online' },
  cod: { label: 'Cash on Delivery', color: '#F59E0B', shortLabel: 'COD' },
  upi: { label: 'UPI', color: '#06B6D4', shortLabel: 'UPI' },
};

// ── Custom Pie Tooltip ────────────────────────────────────────────────────────
const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div
      style={{
        backgroundColor: '#0B0F26',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '12px',
        padding: '8px 12px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
      }}
    >
      <p style={{ color: item.payload?.color, fontSize: '11px', fontWeight: 700, marginBottom: 2 }}>
        {item.name}
      </p>
      <p style={{ color: '#F8FAFC', fontSize: '12px', fontWeight: 800 }}>
        {formatIndianNumber(item.value)} transactions
      </p>
    </div>
  );
};

// ── PaymentsOverview ──────────────────────────────────────────────────────────

/**
 * PaymentsOverview Component.
 * Displays real payment method breakdown using actual backend data.
 * Backend method values: "razorpay" | "cod" | "upi"
 * Only renders donut chart when real payment method counts exist.
 * Shows elegant empty state with totalCommission if no breakdown available.
 */
export const PaymentsOverview = ({ payments = [], totalCommission = 0, isLoading = false }) => {
  // Aggregate ONLY from real payment data — no fabricated fallbacks
  const methodCounts = {};
  if (Array.isArray(payments) && payments.length > 0) {
    payments.forEach((p) => {
      if (p.method) {
        methodCounts[p.method] = (methodCounts[p.method] || 0) + 1;
      }
    });
  }

  // Build chart data only from methods that actually exist in the data
  const chartData = Object.entries(methodCounts)
    .filter(([, count]) => count > 0)
    .map(([method, count]) => ({
      name: METHOD_CONFIG[method]?.shortLabel || method,
      fullLabel: METHOD_CONFIG[method]?.label || method,
      value: count,
      color: METHOD_CONFIG[method]?.color || '#64748B',
    }))
    .sort((a, b) => b.value - a.value); // descending by count

  const hasBreakdown = chartData.length > 0;
  const totalTransactions = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card p-5 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/8 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center" aria-hidden="true">
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <h2 className="text-sm font-bold text-textPrimary">Payments</h2>
        </div>
        <span className="text-[10px] text-textMuted font-medium">Platform Revenue</span>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center min-h-[200px]">
        {isLoading ? (
          <div className="w-full space-y-3 animate-pulse">
            <div className="w-32 h-32 rounded-full bg-white/5 mx-auto" />
            <div className="space-y-2">
              <div className="h-3 bg-white/8 rounded w-3/4 mx-auto" />
              <div className="h-3 bg-white/8 rounded w-1/2 mx-auto" />
            </div>
          </div>
        ) : hasBreakdown ? (
          <div className="w-full space-y-4">
            {/* Donut Chart */}
            <div className="relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-extrabold text-textPrimary tabular-nums">
                  {formatIndianNumber(totalTransactions)}
                </span>
                <span className="text-[9px] text-textMuted uppercase tracking-wider font-semibold">
                  Total
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {chartData.map((item) => {
                const pct = totalTransactions > 0
                  ? Math.round((item.value / totalTransactions) * 100)
                  : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      />
                      <span className="text-textSecondary">{item.fullLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-textPrimary tabular-nums">
                        {formatIndianNumber(item.value)}
                      </span>
                      <span
                        className="text-[10px] font-semibold w-9 text-right tabular-nums"
                        style={{ color: item.color }}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Commission total */}
            <div className="pt-2 border-t border-white/8">
              <div className="flex items-center justify-between text-xs">
                <span className="text-textMuted font-medium">Platform Commission</span>
                <span className="font-extrabold text-emerald-400 tabular-nums">
                  {formatIndianCurrency(totalCommission)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Honest empty state when no payment method data exists */
          <div className="text-center space-y-4 py-4 w-full">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
              aria-hidden="true"
            >
              {totalCommission > 0 ? (
                <DollarSign className="w-7 h-7 text-emerald-400" />
              ) : (
                <Wallet2 className="w-7 h-7 text-emerald-400" />
              )}
            </div>

            <div>
              <p className="text-[10px] text-textMuted uppercase tracking-wider font-semibold mb-1">
                Total Commission Earned
              </p>
              <p className="text-2xl font-extrabold text-textPrimary tabular-nums">
                {formatIndianCurrency(totalCommission)}
              </p>
              <p className="text-[11px] text-textMuted mt-2 leading-relaxed max-w-[180px] mx-auto">
                Payment method breakdown will appear as live transactions are recorded.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PaymentsOverview;
