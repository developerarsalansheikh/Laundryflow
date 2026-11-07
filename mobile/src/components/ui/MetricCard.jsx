import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import Text from './Text';
import Icon from './Icon';

/**
 * MetricCard
 * Sleek KPI metric card matching FreshFold / LaundryWave mockups.
 * e.g., Icon container, Value (18), Title (Today's Pickups), and action link.
 */
export const MetricCard = ({
  title,
  value,
  subtitle,
  iconName = 'calendar',
  iconColor = '#0066FF',
  iconBg = '#EFF6FF',
  onPress,
  style,
}) => {
  const { colors, radius, shadows } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: '#FFFFFF',
          borderColor: '#EDF2F7',
          borderRadius: radius.component.card || 16,
        },
        shadows.sm,
        style,
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
        <Icon name={iconName} size={18} color={iconColor} />
      </View>

      <Text variant="caption" colorVariant="secondary" style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <Text variant="h2" weight="bold" style={styles.value}>
        {value}
      </Text>

      {Boolean(subtitle) && (
        <Text variant="caption" style={[styles.subtitle, { color: colors.primary || '#0066FF' }]}>
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    alignItems: 'flex-start',
    minWidth: 96,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    marginBottom: 2,
    fontWeight: '500',
  },
  value: {
    fontSize: 20,
    lineHeight: 26,
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default MetricCard;
