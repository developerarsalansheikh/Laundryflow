import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import Text from './Text';

/**
 * LaundryFlow Design System - Loader Component
 * Supports standalone spinner or full modal/screen overlay with optional message.
 */
export const Loader = ({
  size = 'small',
  color,
  message,
  overlay = false,
  style,
  messageStyle,
  accessibilityLabel = 'Loading...',
  testID,
}) => {
  const { colors, spacing, radius } = useTheme();

  // Resolve safe ActivityIndicator size and dimensions to prevent Fabric/Yoga native measure crash
  let resolvedSize = 'small';
  let indicatorDimensions = { width: 20, height: 20 };

  if (typeof size === 'number' && !isNaN(size) && size > 0) {
    resolvedSize = size >= 36 ? 'large' : 'small';
    indicatorDimensions = { width: size, height: size };
  } else {
    switch (String(size).toLowerCase()) {
      case 'lg':
      case 'large':
        resolvedSize = 'large';
        indicatorDimensions = { width: 36, height: 36 };
        break;
      case 'md':
      case 'medium':
        resolvedSize = 'small';
        indicatorDimensions = { width: 28, height: 28 };
        break;
      case 'sm':
      case 'small':
      default:
        resolvedSize = 'small';
        indicatorDimensions = { width: 20, height: 20 };
        break;
    }
  }

  const indicatorColor = color || colors?.primary || '#2563EB';

  const content = (
    <View
      style={[
        styles.container,
        overlay && styles.overlayBox,
        overlay && {
          backgroundColor: colors?.surfaceElevated || '#FFFFFF',
          borderColor: colors?.cardBorder || '#E2E8F0',
          borderRadius: radius?.component?.card || 12,
          padding: spacing?.xl || 20,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={message || accessibilityLabel}
      testID={testID}
    >
      <ActivityIndicator
        size={resolvedSize}
        color={indicatorColor}
        style={indicatorDimensions}
      />
      {Boolean(message) && (
        <Text
          variant="bodySmall"
          colorVariant="secondary"
          align="center"
          style={[styles.message, { marginTop: spacing?.md || 12 }, messageStyle]}
        >
          {message}
        </Text>
      )}
    </View>
  );

  if (overlay) {
    return (
      <View
        style={[styles.overlayContainer, { backgroundColor: colors?.overlayStrong || 'rgba(0, 0, 0, 0.6)' }]}
        accessibilityViewIsModal
      >
        {content}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overlayBox: {
    minWidth: 140,
    maxWidth: '80%',
    borderWidth: 1,
    elevation: 8,
  },
  message: {
    marginTop: 8,
  },
});

export default Loader;
