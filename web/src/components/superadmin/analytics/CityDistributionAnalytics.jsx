import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { MapPin } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0f172a] border border-white/10 p-2.5 rounded-xl shadow-xl text-xs">
        <p className="font-semibold text-textPrimary">{data.city}</p>
        <p className="text-textSecondary mt-0.5">
          Laundries: <span className="font-bold text-cyan-400">{data.count}</span>
        </p>
      </div>
    );
  }
  return null;
};

/**
 * CityDistributionAnalytics — Recharts BarChart for city geographic distribution.
 */
export const CityDistributionAnalytics = ({ cityDistribution = [] }) => {
  const chartData = cityDistribution.map((item) => ({
    city: item._id || 'Unknown',
    count: item.count || 0,
  }));

  return (
    <div className="glass-card rounded-2xl border border-white/8 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-teal-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-textPrimary">City Distribution</h3>
          <p className="text-[11px] text-textMuted">Geographic density of laundry partners by city</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-xs text-textMuted">
          No city distribution data available.
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="city"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#06B6D4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CityDistributionAnalytics;
