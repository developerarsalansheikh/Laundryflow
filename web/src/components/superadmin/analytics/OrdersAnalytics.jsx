import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ShoppingBag } from 'lucide-react';

const STATUS_LABELS = {
  pending: 'Pending',
  picked_up: 'Picked Up',
  in_progress: 'In Progress',
  ready: 'Ready',
  out_for_delivery: 'Out For Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  pending: '#f59e0b',
  picked_up: '#3b82f6',
  in_progress: '#8b5cf6',
  ready: '#06b6d4',
  out_for_delivery: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#f43f5e',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0f172a] border border-white/10 p-2.5 rounded-xl shadow-xl text-xs">
        <p className="font-semibold text-textPrimary">{data.name}</p>
        <p className="text-textSecondary mt-0.5">
          Orders: <span className="font-bold text-textPrimary">{data.count}</span>
        </p>
      </div>
    );
  }
  return null;
};

/**
 * OrdersAnalytics — Recharts BarChart displaying order breakdown per status.
 */
export const OrdersAnalytics = ({ orderStatusBreakdown = [] }) => {
  const chartData = orderStatusBreakdown.map((item) => ({
    status: item._id,
    name: STATUS_LABELS[item._id] || item._id,
    count: item.count || 0,
    color: STATUS_COLORS[item._id] || '#64748b',
  }));

  return (
    <div className="glass-card rounded-2xl border border-white/8 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
          <ShoppingBag className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-textPrimary">Order Status Distribution</h3>
          <p className="text-[11px] text-textMuted">Order count broken down by lifecycle status</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-xs text-textMuted">
          No order breakdown data available.
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default OrdersAnalytics;
