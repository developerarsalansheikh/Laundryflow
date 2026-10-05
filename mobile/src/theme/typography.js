/**
 * LaundryFlow Design System - Typography Tokens & Presets
 * Clean, modern typography hierarchy optimized for Android and iOS devices.
 */

import { Platform } from 'react-native';

const SANS_SERIF_WEB =
  "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const fontFamilies = Object.freeze({
  regular: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    web: SANS_SERIF_WEB,
    default: 'sans-serif',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    web: SANS_SERIF_WEB,
    default: 'sans-serif',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    web: SANS_SERIF_WEB,
    default: 'sans-serif',
  }),
});

export const fontSizes = Object.freeze({
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  xxl: 28,
  xxxl: 34,
});

export const fontWeights = Object.freeze({
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
});

export const lineHeights = Object.freeze({
  xs: 16,
  sm: 18,
  base: 22,
  md: 24,
  lg: 26,
  xl: 28,
  xxl: 36,
  xxxl: 42,
});

export const typography = Object.freeze({
  h1: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.xxxl,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.xxl,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.xl,
  },
  title: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.lg,
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.base,
  },
  bodyMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.base,
  },
  bodySmall: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm,
  },
  button: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.base,
  },
  buttonSmall: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.sm,
  },
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm,
  },
  overline: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  small: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.xs,
  },
});

export default {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  typography,
};
