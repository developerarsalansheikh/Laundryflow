/**
 * LaundryFlow Design System - Spacing Scale & Layout Tokens
 * 4-point incremental spacing system for consistent rhythm and alignment.
 */

export const spacing = Object.freeze({
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
});

export const layout = Object.freeze({
  screenPadding: spacing.base, // 16
  gutter: spacing.md, // 12
  headerHeight: 56,
  tabBarHeight: 60,
  minTouchTarget: 48, // Accessibility minimum touch target standard (48x48dp)
  inputHeight: 48,
  inputHeightSm: 40,
  buttonHeight: 48,
  buttonHeightSm: 36,
  buttonHeightLg: 54,
  cardPadding: spacing.base,
  modalPadding: spacing.xl,
});

export default {
  spacing,
  layout,
};
