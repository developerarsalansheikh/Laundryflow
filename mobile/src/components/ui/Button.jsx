import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  View,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme';
import Text from './Text';

/**
 * LaundryFlow Design System - Button Component
 * Production-grade button with touch target compliance, loading state, variants, and icons.
 */
export const Button = ({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
  ...rest
}) => {
  const { colors, spacing, radius, layout, typography } = useTheme();

  const isInteractive = !disabled && !loading;

  // Size configurations
  const sizeConfigMap = {
    sm: {
      minHeight: layout.buttonHeightSm, // 36
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.component.buttonSm,
      textVariant: 'buttonSmall',
    },
    md: {
      minHeight: layout.buttonHeight, // 48
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
      borderRadius: radius.component.button,
      textVariant: 'button',
    },
    lg: {
      minHeight: layout.buttonHeightLg, // 54
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.component.buttonLg,
      textVariant: 'button',
    },
  };
  const sizeStyles = sizeConfigMap[size] || sizeConfigMap.md;

  // Variant configurations
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.secondary,
            borderWidth: 0,
          },
          textColor: colors.onSecondary,
          spinnerColor: colors.onSecondary,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.primary,
          },
          textColor: colors.primary,
          spinnerColor: colors.primary,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          textColor: colors.primary,
          spinnerColor: colors.primary,
        };
      case 'danger':
        return {
          container: {
            backgroundColor: colors.status.danger,
            borderWidth: 0,
          },
          textColor: '#FFFFFF',
          spinnerColor: '#FFFFFF',
        };
      case 'surface':
        return {
          container: {
            backgroundColor: colors.surfaceElevated,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          },
          textColor: colors.textPrimary,
          spinnerColor: colors.textPrimary,
        };
      case 'primary':
      default:
        return {
          container: {
            backgroundColor: colors.primary,
            borderWidth: 0,
          },
          textColor: colors.onPrimary,
          spinnerColor: colors.onPrimary,
        };
    }
  };

  const currentVariant = getVariantStyles();

  const labelText = title || (typeof children === 'string' ? children : '');

  return (
    <Pressable
      testID={testID}
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || labelText}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: !isInteractive,
        busy: loading,
      }}
      style={({ pressed }) => [
        styles.base,
        sizeStyles,
        currentVariant.container,
        fullWidth && styles.fullWidth,
        pressed && isInteractive && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={currentVariant.spinnerColor || colors?.onPrimary || '#FFFFFF'}
          style={[styles.spinner, { width: 20, height: 20 }]}
        />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

          {title ? (
            <Text
              variant={sizeStyles.textVariant}
              style={[
                styles.text,
                { color: currentVariant.textColor },
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : (
            children
          )}

          {rightIcon && (
            <View style={styles.rightIconContainer}>{rightIcon}</View>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
  },
  spinner: {
    paddingVertical: 2,
  },
  pressed: {
    opacity: 0.84,
  },
  disabled: {
    opacity: 0.45,
  },
});

export default Button;
