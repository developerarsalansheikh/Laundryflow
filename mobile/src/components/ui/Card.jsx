import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

/**
 * LaundryFlow Design System - Card Component
 * Flexible surface container with elevation, glassmorphic styling, and optional press states.
 */
export const Card = ({
  children,
  variant = 'default',
  padding = 'base',
  onPress,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
  ...rest
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  // Padding mapping
  const resolvePadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return spacing.sm; // 8
      case 'md':
        return spacing.md; // 12
      case 'xl':
        return spacing.xl; // 24
      case 'base':
      case 'lg':
      default:
        return spacing.base; // 16
    }
  };

  // Variant styling
  const resolveVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.cardElevated,
          borderColor: colors.cardBorder,
          borderWidth: 1,
          ...shadows.md,
        };
      case 'glass':
        return {
          backgroundColor: colors.cardGlass,
          borderColor: colors.glassBorder,
          borderWidth: 1,
          ...shadows.glass,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.border,
          borderWidth: 1.5,
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          borderWidth: 1,
          ...shadows.sm,
        };
    }
  };

  const containerStyles = [
    styles.card,
    {
      borderRadius: radius.component.card,
      padding: resolvePadding(),
    },
    resolveVariantStyle(),
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          containerStyles,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
        ]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={containerStyles} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Card;
