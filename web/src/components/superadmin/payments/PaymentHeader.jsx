import { DollarSign } from 'lucide-react';

/**
 * PaymentHeader Component
 */
export const PaymentHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
          <DollarSign className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-textPrimary tracking-tight">Payments & Financials</h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-0.5 max-w-xl">
            Monitor platform-wide transaction volume, commission splits, and payment status logs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentHeader;
