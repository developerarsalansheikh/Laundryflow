import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Linking,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme';
import Card from './Card';
import Text from './Text';
import Badge from './Badge';
import Button from './Button';
import Divider from './Divider';

/**
 * Haversine formula to calculate distance in km between two lat/lng coordinates
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};

/**
 * Production-ready live delivery tracker map component.
 * Visualizes driver position, destination, ETA, and provides 1-tap Google Maps external navigation.
 */
export const LiveTrackingMap = ({
  orderId,
  driverLocation,
  destinationAddress,
  destinationCoords,
  deliveryPartner,
  orderStatus,
}) => {
  const { colors, spacing, borderRadius } = useTheme();
  const [secondsAgo, setSecondsAgo] = useState(0);

  const driverLat = driverLocation?.latitude || driverLocation?.lat;
  const driverLng = driverLocation?.longitude || driverLocation?.lng;
  const driverHeading = driverLocation?.heading;
  const driverSpeed = driverLocation?.speed;
  const driverAccuracy = driverLocation?.accuracy;
  const lastUpdatedTime = driverLocation?.timestamp;

  // Calculate distance between driver and customer
  const distanceKm =
    driverLat && driverLng && destinationCoords?.lat && destinationCoords?.lng
      ? calculateDistanceKm(driverLat, driverLng, destinationCoords.lat, destinationCoords.lng)
      : null;

  // Estimate ETA based on average city speed of ~25 km/h
  const estimatedMins = distanceKm ? Math.max(2, Math.round((distanceKm / 25) * 60)) : null;

  // Update relative timestamp counter
  useEffect(() => {
    if (!lastUpdatedTime) return;
    const interval = setInterval(() => {
      const diffSec = Math.round((Date.now() - new Date(lastUpdatedTime).getTime()) / 1000);
      setSecondsAgo(Math.max(0, diffSec));
    }, 2000);
    return () => clearInterval(interval);
  }, [lastUpdatedTime]);

  const handleOpenExternalMaps = () => {
    const destinationQuery = destinationCoords?.lat && destinationCoords?.lng
      ? `${destinationCoords.lat},${destinationCoords.lng}`
      : encodeURIComponent(destinationAddress || 'Customer Location');

    let url;
    if (driverLat && driverLng) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${driverLat},${driverLng}&destination=${destinationQuery}&travelmode=driving`;
    } else {
      url = Platform.select({
        ios: `maps:0,0?q=${destinationQuery}`,
        android: `geo:0,0?q=${destinationQuery}`,
        default: `https://www.google.com/maps/search/?api=1&query=${destinationQuery}`,
      });
    }

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${destinationQuery}`);
    });
  };

  const handleCallDriver = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const isDriverOffline = deliveryPartner?.availabilityStatus === 'offline' || deliveryPartner?.isAvailable === false;

  let trackingState = 'Live';
  let stateBadge = { label: 'LIVE GPS ACTIVE', variant: 'success' };
  let statusColor = colors.status.success;

  if (isDriverOffline) {
    trackingState = 'Offline';
    stateBadge = { label: 'DRIVER OFFLINE', variant: 'neutral' };
    statusColor = colors.textMuted || '#94A3B8';
  } else if (!hasGpsCoordinates) {
    trackingState = 'Offline';
    stateBadge = { label: 'GPS UNAVAILABLE', variant: 'warning' };
    statusColor = colors.status.warning;
  } else if (secondsAgo > 60) {
    trackingState = 'Stale';
    stateBadge = { label: 'STALE LOCATION', variant: 'warning' };
    statusColor = colors.status.warning;
  } else if (secondsAgo <= 5) {
    trackingState = 'Updating';
    stateBadge = { label: 'UPDATING', variant: 'info' };
    statusColor = colors.status.info;
  }

  return (
    <Card variant="elevated" style={styles.card}>
      {/* Header with Live indicator */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithPulse}>
          <View
            style={[
              styles.pulseDot,
              { backgroundColor: statusColor },
            ]}
          />
          <Text variant="title" weight="bold" colorVariant="primary">
            Live Delivery Tracking
          </Text>
        </View>

        <Badge
          label={stateBadge.label}
          variant={stateBadge.variant}
          size="sm"
        />
      </View>

      <Text variant="caption" colorVariant="muted" style={{ marginBottom: spacing.sm }}>
        {trackingState === 'Offline'
          ? (hasGpsCoordinates
              ? `Driver offline — showing last known location (${secondsAgo > 60 ? Math.round(secondsAgo / 60) + 'm ago' : secondsAgo + 's ago'})`
              : 'Delivery partner location is currently unavailable.')
          : trackingState === 'Stale'
          ? `Last GPS fix was ${Math.round(secondsAgo / 60)} minutes ago (retaining last known location)`
          : secondsAgo < 5
          ? 'Location updated just now'
          : `Updated ${secondsAgo}s ago`}
      </Text>

      {/* Visual Tracking Canvas Foundation */}
      <View
        style={[
          styles.mapCanvas,
          {
            backgroundColor: colors.surfaceSecondary || '#F8FAFC',
            borderColor: colors.borderLight,
          },
        ]}
      >
        {trackingState === 'Stale' && (
          <View style={{ backgroundColor: colors.status.warning + '15', borderColor: colors.status.warning, borderWidth: 1, borderRadius: 6, padding: 6, marginBottom: 8 }}>
            <Text variant="caption" weight="semibold" style={{ color: colors.status.warning }}>
              ⚠️ Driver GPS signal is stale. Retaining last verified location.
            </Text>
          </View>
        )}
        {trackingState === 'Offline' && isDriverOffline && (
          <View style={{ backgroundColor: '#F1F5F9', borderColor: '#CBD5E1', borderWidth: 1, borderRadius: 6, padding: 6, marginBottom: 8 }}>
            <Text variant="caption" weight="semibold" colorVariant="secondary">
              ℹ️ Delivery partner is currently offline. Showing last reported position.
            </Text>
          </View>
        )}
        {/* Route Line Foundation */}
        <View style={styles.routeContainer}>
          <View style={[styles.routePoint, { backgroundColor: colors.primary }]}>
            <Text style={styles.routePointText}>🛵</Text>
          </View>
          <View style={[styles.connectingLine, { borderColor: colors.primary }]} />
          <View style={[styles.routePoint, { backgroundColor: colors.status.success }]}>
            <Text style={styles.routePointText}>📍</Text>
          </View>
        </View>

        {/* Route Labels */}
        <View style={styles.routeLabelsRow}>
          <View style={styles.labelCol}>
            <Text variant="caption" weight="bold" colorVariant="primary">
              Delivery Partner
            </Text>
            <Text variant="caption" colorVariant="secondary">
              {driverLat && driverLng
                ? `${driverLat.toFixed(4)}, ${driverLng.toFixed(4)}`
                : 'Connecting GPS...'}
            </Text>
          </View>

          <View style={[styles.labelCol, { alignItems: 'flex-end' }]}>
            <Text variant="caption" weight="bold" colorVariant="primary">
              Destination
            </Text>
            <Text variant="caption" colorVariant="secondary" numberOfLines={1} style={{ maxWidth: 160 }}>
              {destinationAddress || 'Your Delivery Address'}
            </Text>
          </View>
        </View>

        {/* Metrics Bar: ETA + Distance */}
        {Boolean(distanceKm || estimatedMins) && (
          <View style={[styles.metricsBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            {Boolean(distanceKm) && (
              <View style={styles.metricItem}>
                <Text variant="caption" colorVariant="muted">DISTANCE</Text>
                <Text variant="bodySmall" weight="bold" colorVariant="primary">
                  {distanceKm} km
                </Text>
              </View>
            )}
            {Boolean(estimatedMins) && (
              <View style={styles.metricItem}>
                <Text variant="caption" colorVariant="muted">ESTIMATED TIME</Text>
                <Text variant="bodySmall" weight="bold" style={{ color: colors.primary }}>
                  ~{estimatedMins} mins
                </Text>
              </View>
            )}
            {Boolean(driverSpeed) && (
              <View style={styles.metricItem}>
                <Text variant="caption" colorVariant="muted">SPEED</Text>
                <Text variant="bodySmall" weight="semibold" colorVariant="secondary">
                  {Math.round(driverSpeed)} km/h
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Driver Information Bar */}
      {Boolean(deliveryPartner) && (
        <View style={[styles.driverBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={styles.driverAvatar}>
            <Text style={{ fontSize: 20 }}>🛵</Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text variant="bodyMedium" weight="bold" colorVariant="primary">
              {deliveryPartner.name || 'Assigned Driver'}
            </Text>
            <Text variant="caption" colorVariant="secondary">
              {deliveryPartner.phone ? `+91 ${deliveryPartner.phone}` : 'Verified Partner'}
            </Text>
          </View>

          {Boolean(deliveryPartner.phone) && (
            <Button
              title="Call Driver"
              variant="outline"
              size="sm"
              onPress={() => handleCallDriver(deliveryPartner.phone)}
            />
          )}
        </View>
      )}

      {/* Action: Open in External Maps */}
      <View style={{ marginTop: spacing.sm }}>
        <Button
          title="🗺️ Open in Google Maps"
          variant="secondary"
          size="md"
          fullWidth
          onPress={handleOpenExternalMaps}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleWithPulse: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  mapCanvas: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 12,
  },
  routePoint: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routePointText: {
    fontSize: 18,
  },
  connectingLine: {
    flex: 1,
    height: 2,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginHorizontal: 8,
  },
  routeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  labelCol: {
    flex: 1,
  },
  metricsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  metricItem: {
    alignItems: 'center',
  },
  driverBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LiveTrackingMap;
