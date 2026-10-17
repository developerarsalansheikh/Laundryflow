import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CreditCard } from 'lucide-react';
import { formatIndianCurrency } from '../../../utils/formatters';

const METHOD_LABELS = {
  razorpay: 'Razorpay Online',
  cod: 'Cash on Delivery (COD)',
  upi: 'UPI Transfer',
};

const METHOD_COLORS = {
  razorpay: '#7C3AED',
  cod: '#06B6D4',
  upi: '#22C55E',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1 text-white">
        <p className="font-semibold text-slate-100">{data.name}</p>
        <p className="text-slate-300">
          Transactions: <span className="font-bold text-white">{data.count}</span>
        </p>
        <p className="text-slate-300">
          Total Value: <span className="font-bold text-emerald-400">{formatIndianCurrency(data.totalAmount)}</span>
        </p>
      </div>
    );
  }
  return null;
};

/**
 * PaymentAnalytics — Recharts PieChart/Donut chart for payment method breakdown.
 */
export const PaymentAnalytics = ({ paymentMethodBreakdown = [] }) => {
  const chartData = paymentMethodBreakdown.map((item) => ({
    name: METHOD_LABELS[item._id] || String(item._id).toUpperCase(),
    count: item.count || 0,
    totalAmount: item.totalAmount || 0,
    color: METHOD_COLORS[item._id] || '#64748b',
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-2xs">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
          <CreditCard className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Payment Method Distribution</h3>
          <p className="text-[11px] text-slate-500">Transaction volume split by payment gateway & mode</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          No payment method breakdown available.
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`pie-cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.1)" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PaymentAnalytics;
