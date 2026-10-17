import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { MapPin } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl shadow-xl text-xs text-white">
        <p className="font-semibold text-slate-100">{data.city}</p>
        <p className="text-slate-300 mt-0.5">
          Laundries: <span className="font-bold text-teal-400">{data.count}</span>
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
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-2xs">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
          <MapPin className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">City Distribution</h3>
          <p className="text-[11px] text-slate-500">Geographic density of laundry partners by city</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          No city distribution data available.
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="city"
                stroke="#94A3B8"
                fontSize={10}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#0D9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CityDistributionAnalytics;
