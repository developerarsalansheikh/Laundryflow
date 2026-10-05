import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import Text from './Text';
import Button from './Button';

/**
 * LaundryFlow Design System - ErrorState Component
 * High-visibility error feedback view with retry action.
 */
export const ErrorState = ({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  retryAction,
  retryLabel = 'Try Again',
  icon,
  style,
  testID,
}) => {
  const { colors, spacing, radius } = useTheme();
  const handleRetry = onRetry || retryAction;

  const errorMessage =
    message ||
    (typeof error === 'string'
      ? error
      : error?.message || 'An unexpected error occurred. Please try again.');

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          padding: spacing.xxl,
        },
        style,
      ]}
      accessibilityRole="alert"
    >
      {icon ? (
        <View style={[styles.iconWrapper, { marginBottom: spacing.lg }]}>
          {icon}
        </View>
      ) : (
        <View
          style={[
            styles.errorIconCircle,
            {
              backgroundColor: colors.status.dangerLight,
              borderColor: colors.status.dangerBorder,
              borderRadius: radius.full,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text variant="h2" colorVariant="error">
            !
          </Text>
        </View>
      )}

      <Text
        variant="title"
        weight="semibold"
        align="center"
        style={{ marginBottom: spacing.xs }}
      >
        {title}
      </Text>

      <Text
        variant="bodySmall"
        colorVariant="secondary"
        align="center"
        style={{ maxWidth: 300, marginBottom: onRetry ? spacing.xl : 0 }}
      >
        {errorMessage}
      </Text>

      {Boolean(handleRetry) && (
        <Button
          title={retryLabel}
          onPress={handleRetry}
          variant="secondary"
          size="md"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ErrorState;
