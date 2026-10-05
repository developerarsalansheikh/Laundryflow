import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

/**
 * LaundryFlow Design System - Text Component
 * Centralized typography component that conforms to typography tokens and theme colors.
 */
export const Text = ({
  variant = 'body',
  color,
  colorVariant = 'primary',
  align,
  weight,
  numberOfLines,
  ellipsizeMode,
  style,
  children,
  testID,
  accessibilityRole = 'text',
  accessibilityLabel,
  ...rest
}) => {
  const { typography, colors, fontWeights } = useTheme();

  // Resolve semantic color variants
  const resolveColor = () => {
    if (color) return color;

    switch (colorVariant) {
      case 'secondary':
        return colors.textSecondary;
      case 'muted':
        return colors.textMuted;
      case 'disabled':
        return colors.textDisabled;
      case 'inverse':
        return colors.textInverse;
      case 'brand':
        return colors.primary;
      case 'success':
        return colors.status.success;
      case 'warning':
        return colors.status.warning;
      case 'error':
      case 'danger':
        return colors.status.danger;
      case 'info':
        return colors.status.info;
      case 'primary':
      default:
        return colors.textPrimary;
    }
  };

  const baseStyle = typography[variant] || typography.body;
  const resolvedColor = resolveColor();

  const customStyle = [
    baseStyle,
    { color: resolvedColor },
    align ? { textAlign: align } : null,
    weight && fontWeights[weight] ? { fontWeight: fontWeights[weight] } : null,
    style,
  ];

  return (
    <RNText
      testID={testID}
      style={customStyle}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      {...rest}
    >
      {children}
    </RNText>
  );
};

export default Text;
