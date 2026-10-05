/**
 * Centralized LaundryFlow Design System Tokens
 * Exposes JavaScript constants for colors, typography scales, spacing, border radii, shadows, icon sizes, and status badge configurations.
 */
export const DESIGN_TOKENS = Object.freeze({
  COLORS: {
    BACKGROUND: {
      PRIMARY: '#070A17',
      SECONDARY: '#0A0F22',
      SIDEBAR: '#080C1D',
    },
    SURFACE: {
      CARD: 'rgba(255, 255, 255, 0.045)',
      CARD_HOVER: 'rgba(255, 255, 255, 0.065)',
      PANEL: 'rgba(255, 255, 255, 0.03)',
    },
    BORDER: {
      SUBTLE: 'rgba(255, 255, 255, 0.08)',
      STRONG: 'rgba(255, 255, 255, 0.12)',
      PURPLE: 'rgba(124, 58, 237, 0.3)',
    },
    BRAND: {
      PURPLE: '#7C3AED',
      PURPLE_LIGHT: '#8B5CF6',
      INDIGO: '#6366F1',
      BLUE: '#2563EB',
      CYAN: '#06B6D4',
    },
    STATUS: {
      SUCCESS: '#22C55E',
      WARNING: '#F59E0B',
      DANGER: '#EF4444',
      INFO: '#3B82F6',
    },
    TEXT: {
      PRIMARY: '#F8FAFC',
      SECONDARY: '#94A3B8',
      MUTED: '#64748B',
    },
  },

  TYPOGRAPHY: {
    FONT_FAMILY: 'Plus Jakarta Sans, sans-serif',
    SCALE: {
      DISPLAY: { fontSize: '3rem', lineHeight: '1.1', fontWeight: '800' },
      H1: { fontSize: '2.25rem', lineHeight: '1.2', fontWeight: '700' },
      H2: { fontSize: '1.5rem', lineHeight: '1.3', fontWeight: '700' },
      H3: { fontSize: '1.125rem', lineHeight: '1.4', fontWeight: '600' },
      H4: { fontSize: '1rem', lineHeight: '1.5', fontWeight: '600' },
      BODY: { fontSize: '0.875rem', lineHeight: '1.5', fontWeight: '400' },
      BODY_SMALL: { fontSize: '0.75rem', lineHeight: '1.5', fontWeight: '400' },
      CAPTION: { fontSize: '0.75rem', lineHeight: '1.4', fontWeight: '500' },
      METRIC: { fontSize: '2rem', lineHeight: '1.1', fontWeight: '800' },
      METRIC_LARGE: { fontSize: '2.5rem', lineHeight: '1.1', fontWeight: '800' },
    },
  },

  SPACING: Object.freeze([4, 8, 12, 16, 20, 24, 32, 40, 48, 64]),

  RADIUS: {
    SM: '6px',
    MD: '10px',
    LG: '16px',
    XL: '20px',
    '2XL': '24px',
    FULL: '9999px',
  },

  SHADOWS: {
    SM: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    CARD: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    CARD_HOVER: '0 12px 40px 0 rgba(0, 0, 0, 0.45)',
    FLOATING: '0 20px 50px 0 rgba(0, 0, 0, 0.55)',
    GLOW_PURPLE: '0 0 25px -5px rgba(124, 58, 237, 0.4)',
    GLOW_BLUE: '0 0 25px -5px rgba(37, 99, 235, 0.4)',
  },

  ICON_SIZES: Object.freeze({
    XS: 14,
    SM: 16,
    MD: 18,
    LG: 20,
    XL: 24,
    '2XL': 28,
    '3XL': 32,
  }),

  BREAKPOINTS: Object.freeze({
    MOBILE: '320px',
    TABLET: '768px',
    LAPTOP: '1024px',
    DESKTOP: '1280px',
    LARGE_DESKTOP: '1440px',
  }),
});

export default DESIGN_TOKENS;
