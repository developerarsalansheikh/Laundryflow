import { motion } from 'framer-motion';
import { Activity, BarChart2, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { formatIndianCurrency } from '../../utils/formatters';

// ── Custom Tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        backgroundColor: '#0B0F26',
        border: '1px solid rgba(139,92,246,0.35)',
        borderRadius: '14px',
        padding: '10px 14px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
      }}
    >
      <p style={{ color: '#8B5CF6', fontSize: '11px', fontWeight: 700, marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ color: '#F8FAFC', fontSize: '13px', fontWeight: 800 }}>
        {formatIndianCurrency(payload[0]?.value || 0)}
      </p>
      {payload[1] && (
        <p style={{ color: '#C4B5FD', fontSize: '11px', marginTop: 2 }}>
          Commission: {formatIndianCurrency(payload[1]?.value || 0)}
        </p>
      )}
    </div>
  );
};

// ── RevenueOverview ───────────────────────────────────────────────────────────

/**
 * RevenueOverview Component.
 * Displays real platform total revenue & commission from backend.
 * Shows Recharts AreaChart with CartesianGrid if history exists; polished empty state otherwise.
 */
export const RevenueOverview = ({ totalRevenue = 0, totalCommission = 0, historyData = [] }) => {
  const hasHistory = Array.isArray(historyData) && historyData.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card p-6 flex flex-col relative overflow-hidden h-full"
    >
      {/* Ambient purple glow top-left */}
      <div
        className="absolute top-0 left-0 w-48 h-48 rounded-full blur-[60px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3 border-b border-white/8 pb-4 relative">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center" aria-hidden="true">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <h2 className="text-sm font-bold text-textPrimary tracking-tight">Revenue Overview</h2>
          </div>
          <p className="text-[10px] text-textMuted font-medium uppercase tracking-wider pl-9">
            Platform Aggregate · All Time
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-[10px] text-textMuted font-semibold">
          Lifetime
        </span>
      </div>

      {/* Metric row */}
      <div className="flex items-center gap-5 mb-5 flex-wrap">
        <div>
          <span className="text-[10px] text-textMuted font-semibold uppercase tracking-wider block mb-0.5">
            Gross Revenue
          </span>
          <span className="text-2xl font-extrabold text-textPrimary tracking-tight tabular-nums">
            {formatIndianCurrency(totalRevenue)}
          </span>
        </div>
        <div className="w-px h-10 bg-white/8" aria-hidden="true" />
        <div>
          <span className="text-[10px] text-textMuted font-semibold uppercase tracking-wider block mb-0.5">
            Platform Commission
          </span>
          <span className="text-lg font-bold text-purple-300 tabular-nums">
            {formatIndianCurrency(totalCommission)}
          </span>
        </div>
        <div className="w-px h-10 bg-white/8 hidden sm:block" aria-hidden="true" />
        <div className="hidden sm:block">
          <span className="text-[10px] text-textMuted font-semibold uppercase tracking-wider block mb-0.5">
            Commission Rate
          </span>
          <span className="text-lg font-bold text-emerald-400">
            {totalRevenue > 0
              ? `${((totalCommission / totalRevenue) * 100).toFixed(1)}%`
              : '—'}
          </span>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-[200px] w-full flex flex-col justify-center items-center">
        {hasHistory ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={historyData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="commissionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="transparent"
                tick={{ fill: '#64748B', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="transparent"
                tick={{ fill: '#64748B', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => formatIndianCurrency(val)}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="commission"
                stroke="#3B82F6"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#commissionGrad)"
                dot={false}
                activeDot={{ r: 3, fill: '#3B82F6', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          /* Polished empty state — mandated by spec */
          <div className="py-8 text-center space-y-4 max-w-xs">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto relative"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}
              aria-hidden="true"
            >
              <BarChart2 className="w-7 h-7 text-purple-400" />
              <TrendingUp
                className="w-3.5 h-3.5 text-purple-300 absolute -top-1 -right-1"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-textPrimary">No Revenue History Yet</p>
              <p className="text-[11px] text-textMuted mt-1.5 leading-relaxed">
                Revenue history will appear here once enough platform transactions are recorded.
              </p>
            </div>
            {/* Current totals always visible */}
            <div className="flex justify-center gap-4 pt-1">
              <div className="text-center">
                <p className="text-base font-extrabold text-textPrimary tabular-nums">
                  {formatIndianCurrency(totalRevenue)}
                </p>
                <p className="text-[10px] text-textMuted">Total Revenue</p>
              </div>
              <div className="w-px h-8 bg-white/8" />
              <div className="text-center">
                <p className="text-base font-extrabold text-purple-300 tabular-nums">
                  {formatIndianCurrency(totalCommission)}
                </p>
                <p className="text-[10px] text-textMuted">Commission</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RevenueOverview;
