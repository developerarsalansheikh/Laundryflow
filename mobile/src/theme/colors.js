/**
 * LaundryFlow Design System - Color Palette & Theme Definitions
 * High contrast, dark navy / deep purple SaaS mobile UI palette.
 * Gradients are strictly avoided in favor of solid surface contrasts & fine alpha borders.
 */

export const palette = Object.freeze({
  primary: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7', // Signature Fresh Sky Cyan Blue from Logo
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  accentOrange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    500: '#FF7A00', // Signature Warm Orange from Logo
    600: '#EA580C',
  },
  navy: {
    950: '#060911',
    900: '#090D16', // Deep Dark Navy background
    850: '#0F172A', // Slate navy surface
    800: '#141E33', // Elevated navy card surface
    750: '#1A253E',
    700: '#233050',
    600: '#334155',
    500: '#475569',
    400: '#64748B',
    300: '#94A3B8',
    200: '#CBD5E1',
    100: '#E2E8F0',
    50: '#F8FAFC',
  },
  status: {
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.14)',
    successBorder: 'rgba(16, 185, 129, 0.32)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.14)',
    warningBorder: 'rgba(245, 158, 11, 0.32)',
    danger: '#EF4444',
    dangerLight: 'rgba(239, 68, 68, 0.14)',
    dangerBorder: 'rgba(239, 68, 68, 0.32)',
    error: '#EF4444',
    errorLight: 'rgba(239, 68, 68, 0.14)',
    errorBorder: 'rgba(239, 68, 68, 0.32)',
    info: '#3B82F6',
    infoLight: 'rgba(59, 130, 246, 0.14)',
    infoBorder: 'rgba(59, 130, 246, 0.32)',
  },
  accent: {
    cyan: '#06B6D4',
    sky: '#0EA5E9',
    indigo: '#6366F1',
    emerald: '#10B981',
    amber: '#F59E0B',
    rose: '#F43F5E',
  },
});

export const darkColors = Object.freeze({
  // Base backgrounds & surfaces
  background: palette.navy[900], // #090D16
  backgroundElevated: palette.navy[850], // #0F172A
  surface: palette.navy[850], // #0F172A
  surfaceElevated: palette.navy[800], // #141E33
  surfaceHighlight: palette.navy[750], // #1A253E
  surfaceGlass: 'rgba(20, 30, 51, 0.78)',

  // Cards
  card: palette.navy[800], // #141E33
  cardElevated: palette.navy[750], // #1A253E
  cardGlass: 'rgba(20, 30, 51, 0.82)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassBorderSubtle: 'rgba(255, 255, 255, 0.05)',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDisabled: '#475569',
  textInverse: '#090D16',

  // Borders & Dividers
  border: '#1E293B',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  borderFocus: palette.primary[500], // #8B5CF6

  // Primary Brand
  primary: palette.primary[600], // #7C3AED
  primaryHover: palette.primary[700],
  primaryActive: palette.primary[800],
  primaryLight: 'rgba(124, 58, 237, 0.18)',
  onPrimary: '#FFFFFF',

  // Secondary
  secondary: palette.navy[700],
  secondaryHover: palette.navy[600],
  onSecondary: '#F8FAFC',

  // Overlays
  overlay: 'rgba(6, 9, 17, 0.75)',
  overlayStrong: 'rgba(6, 9, 17, 0.88)',

  // Status mappings
  status: palette.status,
});

export const lightColors = Object.freeze({
  // Base backgrounds & surfaces
  background: '#F8FAFC',
  backgroundElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  surfaceHighlight: '#E2E8F0',
  surfaceGlass: 'rgba(255, 255, 255, 0.88)',

  // Cards
  card: '#FFFFFF',
  cardElevated: '#F8FAFC',
  cardGlass: 'rgba(255, 255, 255, 0.92)',
  cardBorder: 'rgba(15, 23, 42, 0.08)',
  glassBorder: 'rgba(15, 23, 42, 0.10)',
  glassBorderSubtle: 'rgba(15, 23, 42, 0.04)',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textDisabled: '#CBD5E1',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: 'rgba(15, 23, 42, 0.06)',
  borderFocus: palette.primary[600], // #7C3AED

  // Primary Brand
  primary: palette.primary[600], // #7C3AED
  primaryHover: palette.primary[700],
  primaryActive: palette.primary[800],
  primaryLight: palette.primary[100], // #EDE9FE
  onPrimary: '#FFFFFF',

  // Secondary
  secondary: '#E2E8F0',
  secondaryHover: '#CBD5E1',
  onSecondary: '#0F172A',

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.45)',
  overlayStrong: 'rgba(15, 23, 42, 0.65)',

  // Status mappings
  status: palette.status,
});

export default {
  palette,
  darkColors,
  lightColors,
};
