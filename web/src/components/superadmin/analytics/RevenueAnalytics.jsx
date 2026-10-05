import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatIndianCurrency } from '../../../utils/formatters';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a] border border-white/10 p-3 rounded-xl shadow-xl text-xs space-y-1">
        <p className="font-semibold text-textPrimary mb-1">{label}</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-textPrimary tabular-nums">
              {formatIndianCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * RevenueAnalytics — Recharts AreaChart showing 6-month monthly revenue & commission trends.
 */
export const RevenueAnalytics = ({ monthlyTrends = [] }) => {
  const chartData = monthlyTrends.map((item) => {
    const monthIndex = (item._id?.month || 1) - 1;
    const year = item._id?.year || '';
    const monthName = MONTH_NAMES[monthIndex] || `M${item._id?.month}`;
    return {
      name: `${monthName} ${year}`,
      Revenue: item.totalRevenue || 0,
      Commission: item.totalCommission || 0,
      Orders: item.totalOrders || 0,
    };
  });

  return (
    <div className="glass-card rounded-2xl border border-white/8 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-textPrimary">Revenue & Commission Trends</h3>
            <p className="text-[11px] text-textMuted">6-Month aggregated financial growth</p>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-xs text-textMuted">
          No monthly revenue data available yet.
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="Revenue"
                stroke="#7C3AED"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="Commission"
                stroke="#22C55E"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCommission)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RevenueAnalytics;
