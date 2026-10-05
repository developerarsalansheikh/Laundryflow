import { motion } from 'framer-motion';
import { Sparkles, BrainCircuit, Zap } from 'lucide-react';

// ── Animation variants ────────────────────────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

/**
 * BusinessInsights Component.
 * Displays real platform AI insights if provided by backend.
 * Backend currently does NOT provide AI insights endpoint.
 * Shows clearly-labeled coming-soon placeholder as mandated by Phase 6 spec.
 * Do NOT call external AI APIs or fabricate business claims.
 */
export const BusinessInsights = ({ insights = [] }) => {
  const hasInsights = Array.isArray(insights) && insights.length > 0;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.22 }}
      className="glass-card p-5 flex flex-col h-full relative overflow-hidden"
      style={{ borderColor: 'rgba(139,92,246,0.2)' }}
    >
      {/* Ambient glow decoration */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/8 pb-3 relative">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center" aria-hidden="true">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          </div>
          <h2 className="text-sm font-bold text-textPrimary">AI Insights</h2>
        </div>
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{
            color: '#C4B5FD',
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.25)',
          }}
        >
          AI Model
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {hasInsights ? (
          <div className="space-y-2.5">
            {insights.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl text-xs text-textSecondary leading-relaxed"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(139,92,246,0.15)',
                }}
              >
                <div className="flex items-start gap-2">
                  <Zap className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>{item.text}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Strictly mandated placeholder — no fabricated insights */
          <div className="py-6 text-center space-y-4 px-3 flex flex-col items-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.1) 100%)',
                border: '1px solid rgba(139,92,246,0.25)',
              }}
              aria-hidden="true"
            >
              <BrainCircuit className="w-7 h-7 text-purple-400" />
            </div>

            <div>
              <p className="text-xs font-bold text-textPrimary">AI Insights Coming Soon</p>
              <p className="text-[11px] text-textMuted mt-1.5 leading-relaxed">
                AI insights will appear when enough platform data is available.
              </p>
            </div>

            {/* Visual hint — upcoming feature indicators */}
            <div className="w-full space-y-2 pt-1">
              {['Revenue Trends', 'Churn Risk Analysis', 'Growth Opportunities'].map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(139,92,246,0.4)' }}
                    aria-hidden="true"
                  />
                  <span className="text-[10px] text-textMuted">{label}</span>
                  <div className="ml-auto">
                    <span
                      className="text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        color: '#8B5CF6',
                        background: 'rgba(139,92,246,0.1)',
                      }}
                    >
                      Soon
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BusinessInsights;
