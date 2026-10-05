import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import Text from './Text';

/**
 * LaundryFlow Design System - Badge Component
 * Compact status badge/tag with high contrast, accessible labeling, and status variants.
 */
export const Badge = ({
  label,
  children,
  variant = 'primary',
  size = 'md',
  icon,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}) => {
  const { colors, spacing, radius } = useTheme();

  // Variant styles: background + text color + border
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: colors.status.successLight,
          borderColor: colors.status.successBorder,
          textColor: colors.status.success,
        };
      case 'warning':
        return {
          backgroundColor: colors.status.warningLight,
          borderColor: colors.status.warningBorder,
          textColor: colors.status.warning,
        };
      case 'error':
      case 'danger':
        return {
          backgroundColor: colors.status.dangerLight,
          borderColor: colors.status.dangerBorder,
          textColor: colors.status.danger,
        };
      case 'info':
        return {
          backgroundColor: colors.status.infoLight,
          borderColor: colors.status.infoBorder,
          textColor: colors.status.info,
        };
      case 'secondary':
        return {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.cardBorder,
          textColor: colors.textSecondary,
        };
      case 'neutral':
        return {
          backgroundColor: 'rgba(148, 163, 184, 0.12)',
          borderColor: 'rgba(148, 163, 184, 0.25)',
          textColor: colors.textSecondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary,
          textColor: colors.primary,
        };
      case 'primary':
      default:
        return {
          backgroundColor: colors.primaryLight,
          borderColor: 'rgba(124, 58, 237, 0.35)',
          textColor: colors.primary,
        };
    }
  };

  const isSmall = size === 'sm';
  const currentVariant = getVariantStyles();
  const textContent = label || (typeof children === 'string' ? children : '');

  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        {
          borderRadius: radius.component.badge,
          paddingHorizontal: isSmall ? spacing.sm : spacing.md,
          paddingVertical: isSmall ? 2 : spacing.xxs,
          backgroundColor: currentVariant.backgroundColor,
          borderColor: currentVariant.borderColor,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || textContent}
    >
      {icon && <View style={[styles.iconContainer, { marginRight: spacing.xs }]}>{icon}</View>}

      {label ? (
        <Text
          variant={isSmall ? 'small' : 'caption'}
          weight="semibold"
          style={[
            styles.text,
            { color: currentVariant.textColor },
            textStyle,
          ]}
        >
          {label}
        </Text>
      ) : (
        children
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    letterSpacing: 0.2,
  },
});

export default Badge;
