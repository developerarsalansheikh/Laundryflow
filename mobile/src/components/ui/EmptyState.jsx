import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useTheme } from '../../theme';
import Text from './Text';
import Button from './Button';

/**
 * LaundryFlow Design System - EmptyState Component
 * Clean presentation for empty screens, search lists, and zero data states.
 */
export const EmptyState = ({
  title = 'No items found',
  description,
  message,
  icon,
  image,
  imageStyle,
  actionLabel,
  onActionPress,
  onAction,
  style,
  testID,
}) => {
  const { colors, spacing, radius } = useTheme();

  const resolvedDescription = description || message || 'There is currently no data available to display.';
  const handleAction = onActionPress || onAction;

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
      accessibilityRole="text"
    >
      {image ? (
        <View style={[styles.imageWrapper, { marginBottom: spacing.lg }]}>
          <Image
            source={typeof image === 'string' ? { uri: image } : image}
            style={[styles.defaultImage, imageStyle]}
            resizeMode="contain"
          />
        </View>
      ) : icon ? (
        <View style={[styles.iconWrapper, { marginBottom: spacing.lg }]}>
          {icon}
        </View>
      ) : (
        <View
          style={[
            styles.defaultIconCircle,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.cardBorder,
              borderRadius: radius.full,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text variant="h2" colorVariant="muted">
            ∅
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

      {Boolean(resolvedDescription) && (
        <Text
          variant="bodySmall"
          colorVariant="secondary"
          align="center"
          style={{ maxWidth: 280, marginBottom: actionLabel ? spacing.xl : 0 }}
        >
          {resolvedDescription}
        </Text>
      )}

      {Boolean(actionLabel) && Boolean(handleAction) && (
        <Button
          title={actionLabel}
          onPress={handleAction}
          variant="primary"
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
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultImage: {
    width: 140,
    height: 140,
    borderRadius: 16,
  },
  defaultIconCircle: {
    width: 72,
    height: 72,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default EmptyState;
