/**
 * Reusable ambient background system matching LaundryFlow Super Admin design direction.
 * Clean, dark navy base (#06081A), vivid purple + blue radial glows, aurora wave gradient,
 * subtle dot grid overlay, and edge vignette.
 */
export const AppBackground = ({ children }) => {
  return (
    <div
      className="relative min-h-screen w-full text-textPrimary overflow-hidden"
      style={{ backgroundColor: '#06081A' }}
    >
      {/* Fixed Ambient Background Layers */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Base gradient — dark navy to deep indigo */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #06081A 0%, #0A0B22 40%, #0B0B28 70%, #06081A 100%)',
          }}
        />

        {/* Large Purple Glow — Top Center */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[800px] h-[600px] rounded-full blur-[120px] opacity-55 animate-glow-pulse"
          style={{
            background:
              'radial-gradient(circle, rgba(111, 40, 220, 0.75) 0%, rgba(99, 60, 200, 0.3) 40%, transparent 70%)',
          }}
        />

        {/* Top Right Ambient Purple Glow */}
        <div
          className="absolute top-10 right-10 w-[500px] h-[500px] rounded-full blur-[110px] opacity-45 animate-glow-pulse"
          style={{
            background:
              'radial-gradient(circle, rgba(124, 58, 237, 0.7) 0%, rgba(79, 70, 229, 0.3) 50%, transparent 80%)',
          }}
        />

        {/* Vivid Blue Glow — Bottom Left */}
        <div
          className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full blur-[110px] opacity-50 animate-glow-pulse"
          style={{
            background:
              'radial-gradient(circle, rgba(37, 99, 235, 0.7) 0%, rgba(59, 80, 200, 0.3) 40%, transparent 70%)',
          }}
        />

        {/* Secondary Purple Glow — Bottom Right */}
        <div
          className="absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 animate-glow-pulse"
          style={{
            background:
              'radial-gradient(circle, rgba(124, 58, 237, 0.6) 0%, transparent 65%)',
          }}
        />

        {/* Cyan accent glow — Mid Right */}
        <div
          className="absolute top-1/3 -right-16 w-[300px] h-[300px] rounded-full blur-[90px] opacity-25"
          style={{
            background:
              'radial-gradient(circle, rgba(6, 182, 212, 0.55) 0%, transparent 65%)',
          }}
        />

        {/* Aurora overlay wave */}
        <div
          className="absolute inset-0 opacity-30 animate-aurora"
          style={{
            background:
              'radial-gradient(ellipse at 30% -10%, rgba(111, 40, 220, 0.28) 0%, transparent 55%), ' +
              'radial-gradient(ellipse at 75% 110%, rgba(37, 99, 235, 0.22) 0%, transparent 55%)',
          }}
        />

        {/* Subtle dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Faint vignette around edges */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 60%, rgba(4, 5, 16, 0.65) 100%)',
          }}
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default AppBackground;
