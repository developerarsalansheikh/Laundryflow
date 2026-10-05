import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

/**
 * LaundryFlow Design System - Divider Component
 * Clean horizontal or vertical separator with theme-driven tokens.
 */
export const Divider = ({
  orientation = 'horizontal',
  spacing: spacingProp = 'md',
  color,
  thickness = 1,
  style,
  testID,
}) => {
  const { colors, spacing } = useTheme();

  const isHorizontal = orientation === 'horizontal';

  // Spacing margin mapping
  const resolveMargin = () => {
    switch (spacingProp) {
      case 'none':
        return 0;
      case 'xs':
        return spacing.xs;
      case 'sm':
        return spacing.sm;
      case 'lg':
        return spacing.lg;
      case 'xl':
        return spacing.xl;
      case 'md':
      default:
        return spacing.md;
    }
  };

  const marginVal = resolveMargin();
  const dividerColor = color || colors.border;

  const orientationStyle = isHorizontal
    ? {
        height: thickness,
        width: '100%',
        backgroundColor: dividerColor,
        marginVertical: marginVal,
      }
    : {
        width: thickness,
        height: '100%',
        backgroundColor: dividerColor,
        marginHorizontal: marginVal,
      };

  return <View testID={testID} style={[orientationStyle, style]} />;
};

export default Divider;
