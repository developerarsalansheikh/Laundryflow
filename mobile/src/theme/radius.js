/**
 * LaundryFlow Design System - Radius Tokens
 * Standardized border radius tokens and semantic component presets.
 */

export const radius = Object.freeze({
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,

  // Semantic component presets
  component: {
    button: 12,
    buttonSm: 8,
    buttonLg: 14,
    card: 16,
    badge: 9999,
    input: 12,
    modal: 20,
    sheet: 24,
    avatar: 9999,
  },
});

// Alias for backwards compatibility with earlier RN-1 imports
export const borderRadius = radius;

export default radius;
