import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import Text from './Text';

/**
 * LaundryFlow Design System - Header Component
 * Accessible navigation header with title, subtitle, back action, and right slot.
 */
export const Header = ({
  title,
  subtitle,
  leftAction,
  leftElement,
  rightAction,
  rightElement,
  onBackPress,
  showBack = false,
  bordered = false,
  transparent = false,
  centered = false,
  style,
  testID,
}) => {
  const { colors, spacing, layout, typography } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          minHeight: layout.headerHeight,
          paddingHorizontal: spacing.base,
          backgroundColor: transparent ? 'transparent' : colors.surface,
          borderBottomColor: colors.border,
          borderBottomWidth: bordered ? 1 : 0,
        },
        style,
      ]}
      accessibilityRole="header"
    >
      <View style={styles.leftContainer}>
        {showBack && onBackPress ? (
          <Pressable
            onPress={onBackPress}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[styles.backButton, { minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget }]}
          >
            <Text variant="title" colorVariant="primary" style={styles.backArrow}>
              ←
            </Text>
          </Pressable>
        ) : (
          leftAction || leftElement
        )}
      </View>

      <View style={[styles.titleContainer, centered && styles.titleCentered]}>
        {Boolean(title) && (
          <Text
            variant="title"
            weight="semibold"
            numberOfLines={1}
            align={centered ? 'center' : 'left'}
          >
            {title}
          </Text>
        )}
        {Boolean(subtitle) && (
          <Text
            variant="caption"
            colorVariant="secondary"
            numberOfLines={1}
            align={centered ? 'center' : 'left'}
            style={{ marginTop: 2 }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightContainer}>
        {rightAction || rightElement}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  leftContainer: {
    minWidth: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  titleCentered: {
    alignItems: 'center',
  },
  rightContainer: {
    minWidth: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 22,
    lineHeight: 26,
  },
});

export default Header;
