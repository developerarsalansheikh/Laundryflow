import { useColorScheme } from 'react-native';
import { useUIStore } from '../store/uiStore';
import { darkColors, lightColors, palette } from './colors';
import { spacing, layout } from './spacing';
import { radius, borderRadius } from './radius';
import { shadows } from './shadows';
import {
  typography,
  fontSizes,
  fontWeights,
  lineHeights,
  fontFamilies,
} from './typography';
import { darkTheme, lightTheme, themes } from './themes';

/**
 * Custom hook providing dynamic theme according to user preferences and system settings.
 * Defaults to Light theme as required by RN-4. Dark theme remains available.
 */
export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const themePreference = useUIStore((state) => state.theme);

  // Determine dark vs light mode with Light mode as default
  let isDark = false;
  if (themePreference === 'dark') {
    isDark = true;
  } else if (themePreference === 'light') {
    isDark = false;
  } else if (themePreference === 'system') {
    isDark = systemColorScheme === 'dark';
  }

  const activeTheme = isDark ? darkTheme : lightTheme;

  return {
    ...activeTheme,
    theme: activeTheme,
    isDark,
  };
};

export {
  darkColors,
  lightColors,
  palette,
  spacing,
  layout,
  radius,
  borderRadius,
  shadows,
  typography,
  fontSizes,
  fontWeights,
  lineHeights,
  fontFamilies,
  darkTheme,
  lightTheme,
  themes,
};

export default useTheme;
