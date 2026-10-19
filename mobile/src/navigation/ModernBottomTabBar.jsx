import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import Text from '../components/ui/Text';
import Icon from '../components/ui/Icon';

/**
 * ModernBottomTabBar — High-aesthetic, responsive bottom navigation bar
 * Designed specifically for LaundryFlow Admin & Delivery Partner workflows.
 * Features rounded icon containers, responsive small-screen spacing,
 * generous touch targets, and full accessibility.
 */
export const ModernBottomTabBar = ({ state, descriptors, navigation, tabIcons = {} }) => {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Responsive sizing for compact Android screens (e.g. 320–360dp width)
  const isSmallScreen = width < 375;
  const numTabs = state.routes.length;
  const isFiveTab = numTabs >= 5;

  const containerPaddingBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 8);

  return (
    <View
      style={[
        styles.barContainer,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          paddingBottom: containerPaddingBottom,
          paddingTop: 6,
        },
      ]}
    >
      <View style={styles.tabsRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Resolve icon for route
          const iconConfig = tabIcons[route.name] || { name: 'grid' };
          const iconName = iconConfig.name;
          const activeColor = colors.primary || '#2563EB';
          const inactiveColor = colors.textMuted || '#94A3B8';
          const activeBg = colors.primaryLight || 'rgba(37, 99, 235, 0.12)';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || `${label} Tab`}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={[
                styles.tabButton,
                {
                  paddingHorizontal: isSmallScreen ? 2 : 4,
                },
              ]}
            >
              {/* Active Tab Accent Indicator */}
              <View
                style={[
                  styles.activeIndicator,
                  {
                    backgroundColor: isFocused ? activeColor : 'transparent',
                    width: isFocused ? (isSmallScreen ? 16 : 24) : 0,
                  },
                ]}
              />

              {/* Rounded Icon Pill Container */}
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isFocused ? activeBg : 'transparent',
                    width: isSmallScreen && isFiveTab ? 38 : 44,
                    height: 28,
                  },
                ]}
              >
                <Icon
                  name={iconName}
                  size={isSmallScreen && isFiveTab ? 18 : 20}
                  color={isFocused ? activeColor : inactiveColor}
                  strokeWidth={isFocused ? 2.3 : 1.8}
                />
              </View>

              {/* Label */}
              <Text
                variant="caption"
                numberOfLines={1}
                weight={isFocused ? 'bold' : 'normal'}
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? activeColor : inactiveColor,
                    fontSize: isSmallScreen && isFiveTab ? 9.5 : 11,
                    marginTop: 2,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    position: 'relative',
  },
  activeIndicator: {
    height: 3,
    borderRadius: 2,
    position: 'absolute',
    top: -6,
  },
  iconContainer: {
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    textAlign: 'center',
  },
});

export default ModernBottomTabBar;
