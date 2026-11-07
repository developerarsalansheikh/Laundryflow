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
    500: '#0B63E5', // LaundryWave Signature Blue
    600: '#0284C7', // Harmonized Logo Sky/Wave Blue (previously electric #0066FF)
    700: '#2D485E', // Logo Mineral Slate Wave (previously harsh #0052CC)
    800: '#223647', // Logo Deep Tailored Slate (previously harsh #0E2954)
    900: '#1A2936', // Logo Harmonized Dark Slate (previously pitch black #0A192F)
  },
  wave: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF', // Wave Mint Teal from Logo
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
  },
  accentOrange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    500: '#FF6B6B', // Soft Coral/Salmon from logo & alerts
    600: '#EA580C',
  },
  navy: {
    950: '#0B1520',
    900: '#1A2936', // Soft Slate Navy (previously pitch dark #0A192F)
    850: '#223647', // Logo Deep Tailored Slate (previously #0E2954)
    800: '#2D485E', // Logo Mineral Slate Wave
    750: '#36546D',
    700: '#2A4365',
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
    successLight: '#ECFDF5',
    successBorder: '#A7F3D0',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    warningBorder: '#FDE68A',
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
    dangerBorder: '#FECACA',
    error: '#EF4444',
    errorLight: '#FEF2F2',
    errorBorder: '#FECACA',
    info: '#0066FF',
    infoLight: '#EFF6FF',
    infoBorder: '#BFDBFE',
  },
  accent: {
    cyan: '#06B6D4',
    teal: '#14B8A6',
    waveMint: '#2DD4BF',
    sky: '#0284C7',
    indigo: '#0E2954',
    emerald: '#10B981',
    amber: '#F59E0B',
    coral: '#FF6B6B',
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

  // Brand Highlights
  brandNavy: palette.navy[850], // #0E2954
  brandTeal: palette.wave[500], // #14B8A6
  brandMint: palette.wave[400], // #2DD4BF
  bottomNavBg: palette.navy[900], // #0A192F
  iceBlue: palette.primary[100], // #E0F2FE

  // Cards
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  cardGlass: 'rgba(255, 255, 255, 0.95)',
  cardBorder: '#EDF2F7',
  glassBorder: 'rgba(14, 41, 84, 0.08)',
  glassBorderSubtle: 'rgba(14, 41, 84, 0.04)',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textDisabled: '#CBD5E1',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: palette.primary[600],

  // Primary Brand (Royal Sky Blue from buttons & cards)
  primary: palette.primary[600], // #0066FF
  primaryHover: palette.primary[700],
  primaryActive: palette.primary[800],
  primaryLight: '#EFF6FF',
  onPrimary: '#FFFFFF',

  // Secondary
  secondary: '#F1F5F9',
  secondaryHover: '#E2E8F0',
  onSecondary: '#0F172A',

  // Overlays
  overlay: 'rgba(10, 25, 47, 0.55)',
  overlayStrong: 'rgba(10, 25, 47, 0.75)',

  // Status mappings
  status: palette.status,
});

export default {
  palette,
  darkColors,
  lightColors,
};
