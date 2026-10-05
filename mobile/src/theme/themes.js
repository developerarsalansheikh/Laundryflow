/**
 * LaundryFlow Design System - Theme Definitions
 * Provides fully compiled Dark (primary) and Light theme objects with centralized tokens.
 */

import { darkColors, lightColors, palette } from './colors';
import { typography, fontSizes, fontWeights, lineHeights, fontFamilies } from './typography';
import { spacing, layout } from './spacing';
import { radius, borderRadius } from './radius';
import { shadows } from './shadows';

export const darkTheme = Object.freeze({
  isDark: true,
  name: 'dark',
  colors: darkColors,
  palette,
  typography,
  fontSizes,
  fontWeights,
  lineHeights,
  fontFamilies,
  spacing,
  layout,
  radius,
  borderRadius,
  shadows,
  glass: {
    card: {
      backgroundColor: darkColors.cardGlass,
      borderColor: darkColors.glassBorder,
      borderWidth: 1,
      borderRadius: radius.component.card,
    },
    surface: {
      backgroundColor: darkColors.surfaceGlass,
      borderColor: darkColors.glassBorderSubtle,
      borderWidth: 1,
    },
    border: darkColors.glassBorder,
    borderSubtle: darkColors.glassBorderSubtle,
  },
});

export const lightTheme = Object.freeze({
  isDark: false,
  name: 'light',
  colors: lightColors,
  palette,
  typography,
  fontSizes,
  fontWeights,
  lineHeights,
  fontFamilies,
  spacing,
  layout,
  radius,
  borderRadius,
  shadows,
  glass: {
    card: {
      backgroundColor: lightColors.cardGlass,
      borderColor: lightColors.glassBorder,
      borderWidth: 1,
      borderRadius: radius.component.card,
    },
    surface: {
      backgroundColor: lightColors.surfaceGlass,
      borderColor: lightColors.glassBorderSubtle,
      borderWidth: 1,
    },
    border: lightColors.glassBorder,
    borderSubtle: lightColors.glassBorderSubtle,
  },
});

export const themes = Object.freeze({
  dark: darkTheme,
  light: lightTheme,
});

export default themes;
