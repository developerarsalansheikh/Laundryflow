import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  RefreshControl,
  Linking,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { deliveryService } from '../../services/deliveryService';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';
import ErrorState from '../../components/ui/ErrorState';

export const DeliveryOrdersScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [agentLocation, setAgentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locating, setLocating] = useState(false);

  // ── Assigned active orders ──────────────────────────────────────────────
  const {
    data: activeOrders = [],
    isLoading: activeLoading,
    error: activeError,
    refetch: refetchActive,
  } = useQuery({
    queryKey: ['deliveryActiveOrders'],
    queryFn: () => deliveryService.getActiveOrders(),
  });

  // ── Completed orders ────────────────────────────────────────────────────
  const {
    data: completedData,
    isLoading: completedLoading,
    error: completedError,
    refetch: refetchCompleted,
  } = useQuery({
    queryKey: ['deliveryCompletedOrders'],
    queryFn: () => deliveryService.getCompletedOrders({ page: 1, limit: 50 }),
  });

  // ── Nearby unassigned orders ────────────────────────────────────────────
  const {
    data: nearbyOrders = [],
    isLoading: nearbyLoading,
    error: nearbyError,
    refetch: refetchNearby,
  } = useQuery({
    queryKey: ['deliveryNearbyOrders', agentLocation?.lat, agentLocation?.lng],
    queryFn: () =>
      deliveryService.getNearbyOrders({
        lat: agentLocation?.lat,
        lng: agentLocation?.lng,
        radiusKm: 10,
      }),
    enabled: activeTab === 'nearby',
    staleTime: 1000 * 30,
  });

  const completedOrders = completedData?.orders || [];

  // ── Screen Focus Refetch (Guarantees fresh state whenever screen opens) ───
  useFocusEffect(
    useCallback(() => {
      refetchActive();
      refetchCompleted();
      if (activeTab === 'nearby') refetchNearby();
    }, [activeTab, refetchActive, refetchCompleted, refetchNearby])
  );

  // ── Self-assign mutation ────────────────────────────────────────────────
  const selfAssignMutation = useMutation({
    mutationFn: (orderId) => deliveryService.selfAssignOrder(orderId),
    onSuccess: (res, orderId) => {
      const assignedOrder = res?.data || res;

      // 1. Immediately inject the real backend order into active orders caches
      queryClient.setQueryData(['deliveryActiveOrders'], (oldOrders = []) => {
        const filtered = Array.isArray(oldOrders) ? oldOrders.filter((o) => (o._id || o.id) !== orderId) : [];
        return [assignedOrder, ...filtered];
      });

      queryClient.setQueryData(['deliveryActiveOrders', 'pickup'], (oldPickups = []) => {
        const filtered = Array.isArray(oldPickups) ? oldPickups.filter((o) => (o._id || o.id) !== orderId) : [];
        return [assignedOrder, ...filtered];
      });

      // 2. Remove order from nearby orders list
      queryClient.setQueriesData({ queryKey: ['deliveryNearbyOrders'] }, (oldNearby) => {
        return Array.isArray(oldNearby) ? oldNearby.filter((o) => (o._id || o.id) !== orderId) : [];
      });

      // 3. Cache detail record
      queryClient.setQueryData(['deliveryOrder', orderId], assignedOrder);

      // 4. Invalidate and refetch queries in background
      queryClient.invalidateQueries({ queryKey: ['deliveryActiveOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryNearbyOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryStats'] });

      Alert.alert(
        'Order Assigned',
        'You have successfully self-assigned this order. You can now proceed with pickup.',
        [
          {
            text: 'Go to Order',
            onPress: () => navigation.navigate('DeliveryOrderDetail', { orderId }),
          },
          {
            text: 'View in Orders',
            onPress: () => setActiveTab('pickup'),
          },
          {
            text: 'OK',
            style: 'cancel',
            onPress: () => setActiveTab('pickup'),
          },
        ]
      );
    },
    onError: (err) => {
      Alert.alert(
        'Assignment Failed',
        err?.response?.data?.message || err?.message || 'Could not assign this order. It may have already been taken.'
      );
    },
  });

  // ── Get device location for nearby search ──────────────────────────────
  const requestLocation = useCallback(() => {
    setLocating(true);
    setLocationError(null);
    const geo = (typeof navigator !== 'undefined' && navigator.geolocation) ? navigator.geolocation : null;
    if (geo) {
      geo.getCurrentPosition(
        (pos) => {
          setAgentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
          queryClient.invalidateQueries({ queryKey: ['deliveryNearbyOrders'] });
        },
        (err) => {
          setLocationError('Could not get your location. Please enable GPS and try again.');
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    } else {
      setLocationError('Location service is not available on this device.');
      setLocating(false);
    }
  }, [queryClient]);

  const onRefresh = () => {
    refetchActive();
    refetchCompleted();
    if (activeTab === 'nearby') refetchNearby();
  };

  const pickupOrdersList = activeOrders.filter((o) =>
    ['pending', 'pending_pickup', 'placed', 'picked_up', 'at_laundry_pending_confirmation'].includes(o.status)
  );

  const deliveryOrdersList = activeOrders.filter((o) =>
    [
      'ready', 'ready_for_delivery', 'ready_for_redelivery',
      'out_for_delivery', 'delivery_pending_customer_confirmation',
      'customer_unavailable', 'returned_to_laundry',
    ].includes(o.status)
  );

  const tabs = [
    { key: 'all', label: `All (${activeOrders.length + completedOrders.length})` },
    { key: 'nearby', label: `📍 Nearby (${nearbyOrders.length})` },
    { key: 'pickup', label: `Pickup (${pickupOrdersList.length})` },
    { key: 'delivery', label: `Delivery (${deliveryOrdersList.length})` },
    { key: 'completed', label: `Done (${completedOrders.length})` },
  ];

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'nearby': return nearbyOrders;
      case 'pickup': return pickupOrdersList;
      case 'delivery': return deliveryOrdersList;
      case 'completed': return completedOrders;
      case 'all':
      default: return [...activeOrders, ...completedOrders];
    }
  };

  const filteredOrders = getFilteredOrders();
  const isLoading = activeLoading || (activeTab === 'completed' && completedLoading) || (activeTab === 'nearby' && nearbyLoading);
  const error = activeError || completedError || (activeTab === 'nearby' ? nearbyError : null);

  const handleOpenMaps = (addressText) => {
    if (!addressText) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(addressText)}`,
      android: `geo:0,0?q=${encodeURIComponent(addressText)}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`,
    });
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`)
    );
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending': case 'pending_pickup': case 'placed': return 'warning';
      case 'picked_up': case 'at_laundry_pending_confirmation': return 'primary';
      case 'received_at_laundry': case 'in_progress': case 'processing': return 'neutral';
      case 'ready': case 'ready_for_delivery': case 'ready_for_redelivery': return 'primary';
      case 'out_for_delivery': case 'delivery_pending_customer_confirmation': return 'secondary';
      case 'delivered': return 'success';
      case 'customer_unavailable': case 'delivery_failed': case 'returned_to_laundry': case 'cancelled': return 'error';
      default: return 'neutral';
    }
  };

  const formatStatusLabel = (status) => {
    switch (status) {
      case 'pending': case 'pending_pickup': case 'placed': return 'READY FOR PICKUP';
      case 'picked_up': return 'PICKED UP — DELIVER TO STORE';
      case 'at_laundry_pending_confirmation': return 'AT LAUNDRY (HANDOFF PENDING)';
      case 'received_at_laundry': return 'RECEIVED AT STORE';
      case 'in_progress': case 'processing': return 'IN PROCESS';
      case 'ready': case 'ready_for_delivery': return 'READY FOR DELIVERY';
      case 'ready_for_redelivery': return 'READY FOR REDELIVERY';
      case 'out_for_delivery': return 'OUT FOR DELIVERY';
      case 'delivery_pending_customer_confirmation': return 'AWAITING CONFIRMATION';
      case 'customer_unavailable': case 'delivery_failed': return 'CUSTOMER UNAVAILABLE';
      case 'returned_to_laundry': return 'RETURNED TO STORE';
      case 'delivered': return 'DELIVERED';
      case 'cancelled': return 'CANCELLED';
      default: return String(status || '').toUpperCase().replace(/_/g, ' ');
    }
  };

  // ── Nearby order card with Self-Assign button ───────────────────────────
  const renderNearbyOrderItem = ({ item }) => {
    const customerAddress =
      item?.pickupAddressSnapshot?.fullAddress ||
      item?.address ||
      'Address on file';
    const itemCount = item?.services?.reduce((sum, s) => sum + (s.quantity || 1), 0) || 1;
    const laundryName = item?.laundryId?.name || 'Laundry Partner';
    const distLabel = item.distanceKm !== null && item.distanceKm !== undefined
      ? `${item.distanceKm} km away`
      : 'Distance unknown';
    const isAssigning = selfAssignMutation.isPending && selfAssignMutation.variables === item._id;

    return (
      <Card variant="elevated" style={[styles.orderCard, { borderLeftWidth: 4, borderLeftColor: colors.primary }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text variant="bodySmall" weight="bold" colorVariant="primary">
                #{String(item._id || '').slice(-6).toUpperCase()}
              </Text>
              <Badge label="UNASSIGNED" variant="warning" size="xs" />
              <Badge label={distLabel} variant="info" size="xs" />
            </View>
            <Text variant="caption" style={{ color: colors.primary, marginTop: 2 }}>
              Store: {laundryName}
            </Text>
          </View>
          <Badge
            label={formatStatusLabel(item.status)}
            variant={getStatusBadgeVariant(item.status)}
            size="sm"
          />
        </View>

        {/* Customer & Address */}
        <View style={{ marginBottom: 10 }}>
          <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
            {item?.user?.name || 'Customer'}
          </Text>
          <Text variant="caption" colorVariant="secondary" numberOfLines={2} style={{ marginTop: 2 }}>
            📍 {customerAddress}
          </Text>
        </View>

        {/* Meta */}
        <View style={[styles.metaRow, { borderTopColor: colors.borderLight }]}>
          <Text variant="caption" colorVariant="muted">
            {itemCount} item(s) • ₹{item.totalAmount || 0} ({item.isPaid ? 'Paid' : 'COD'})
          </Text>
          <Text variant="caption" colorVariant="muted">
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Button
            title="Navigate"
            variant="outline"
            size="sm"
            style={{ flex: 1 }}
            onPress={() => handleOpenMaps(customerAddress)}
          />
          <Button
            title={isAssigning ? 'Assigning...' : '✋ Self-Assign & Pickup'}
            variant="primary"
            size="sm"
            style={{ flex: 2 }}
            disabled={isAssigning || selfAssignMutation.isPending}
            onPress={() => {
              Alert.alert(
                'Confirm Self-Assignment',
                `Assign order #${String(item._id).slice(-6).toUpperCase()} to yourself and proceed with pickup?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Assign to Me',
                    onPress: () => selfAssignMutation.mutate(item._id),
                  },
                ]
              );
            }}
          />
        </View>
      </Card>
    );
  };

  // ── Standard assigned order card ───────────────────────────────────────
  const renderOrderItem = ({ item }) => {
    if (activeTab === 'nearby') return renderNearbyOrderItem({ item });

    const customerAddress =
      item?.pickupAddress?.fullAddress ||
      item?.pickupAddress?.street ||
      item?.deliveryAddress?.fullAddress ||
      item?.deliveryAddress?.street ||
      item?.address ||
      'Address on file';
    const itemCount = item?.services?.reduce((sum, s) => sum + (s.quantity || 1), 0) || 1;
    const laundryName = item?.laundryId?.name || 'Laundry Partner';
    const laundryAddress = item?.laundryId?.address || '';
    const isPickup = item?.status === 'pending' || item?.status === 'picked_up';
    const isDelivered = item?.status === 'delivered';

    return (
      <Card
        variant="elevated"
        style={styles.orderCard}
        onPress={() => navigation.navigate('DeliveryOrderDetail', { orderId: item._id })}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text variant="bodySmall" weight="bold" colorVariant="primary">
                #{String(item._id || '').slice(-6).toUpperCase()}
              </Text>
              <Badge label={isPickup ? 'PICKUP' : isDelivered ? 'COMPLETED' : 'DELIVERY'} variant="neutral" size="xs" />
            </View>
            <Text variant="caption" style={{ color: colors.primary, marginTop: 2 }}>
              Store: {laundryName} {laundryAddress ? `• ${laundryAddress}` : ''}
            </Text>
          </View>
          <Badge
            label={formatStatusLabel(item.status)}
            variant={getStatusBadgeVariant(item.status)}
            size="sm"
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          {item?.pickupPhoto?.url && (
            <Image source={{ uri: item.pickupPhoto.url }} style={styles.orderPhotoThumbnail} resizeMode="cover" />
          )}
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
              {item?.user?.name || 'Customer'}
            </Text>
            <Text variant="caption" colorVariant="secondary" numberOfLines={2} style={{ marginTop: 2 }}>
              {customerAddress}
            </Text>
            {item?.pickupPhoto?.url && (
              <Text variant="caption" style={{ color: colors.status.success, marginTop: 2 }}>
                ✓ Pickup Photo Attached
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.metaRow, { borderTopColor: colors.borderLight }]}>
          <Text variant="caption" colorVariant="muted">
            {itemCount} item(s) • ₹{item.totalAmount || 0} ({item.isPaid ? 'Paid' : 'COD'})
          </Text>
          <Text variant="caption" colorVariant="muted">
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <Button
            title="Navigate"
            variant="outline"
            size="sm"
            style={{ flex: 1 }}
            onPress={() => handleOpenMaps(customerAddress)}
          />
          {item.status === 'pending' && (
            <Button title="Start Pickup" variant="primary" size="sm" style={{ flex: 1.3 }}
              onPress={() => navigation.navigate('DeliveryOrderDetail', { orderId: item._id })} />
          )}
          {item.status === 'ready' && (
            <Button title="Start Delivery" variant="primary" size="sm" style={{ flex: 1.3 }}
              onPress={() => navigation.navigate('DeliveryOrderDetail', { orderId: item._id })} />
          )}
          {item.status === 'out_for_delivery' && (
            <Button title="Confirm Delivery" variant="secondary" size="sm" style={{ flex: 1.3 }}
              onPress={() => navigation.navigate('DeliveryOrderDetail', { orderId: item._id })} />
          )}
          {item.status === 'delivered' && (
            <Button title="+ New Pickup" variant="primary" size="sm" style={{ flex: 1.3 }}
              onPress={() => navigation.navigate('NewPickup', { previousOrderId: item._id, order: item })} />
          )}
        </View>
      </Card>
    );
  };

  // ── Nearby tab empty state with location prompt ─────────────────────────
  const NearbyEmptyState = () => (
    <View style={styles.nearbyEmptyContainer}>
      <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>📍</Text>
      <Text variant="subtitle" weight="bold" colorVariant="primary" style={{ textAlign: 'center', marginBottom: 8 }}>
        {locationError ? 'Location Access Needed' : agentLocation ? 'No Nearby Orders' : 'Enable Location to Find Orders'}
      </Text>
      <Text variant="body" colorVariant="secondary" style={{ textAlign: 'center', marginBottom: 20 }}>
        {locationError
          ? locationError
          : agentLocation
          ? 'No unassigned pending orders found within 10 km of your location.'
          : 'Share your location to discover unassigned orders near you within 10 km.'}
      </Text>
      <Button
        title={locating ? 'Getting Location...' : '📍 Use My Current Location'}
        variant="primary"
        size="md"
        disabled={locating}
        onPress={requestLocation}
      />
      {agentLocation && (
        <Text variant="caption" colorVariant="muted" style={{ textAlign: 'center', marginTop: 12 }}>
          Searching near {agentLocation.lat.toFixed(4)}, {agentLocation.lng.toFixed(4)}
        </Text>
      )}
    </View>
  );

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={[styles.screenHeader, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View>
          <Text variant="h2" weight="bold" colorVariant="primary">
            My Orders
          </Text>
          <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
            Assigned tasks and nearby available pickups
          </Text>
        </View>
        {activeTab === 'nearby' && (
          <Pressable
            onPress={requestLocation}
            style={[styles.locateBtn, { borderColor: colors.primary }]}
            disabled={locating}
          >
            {locating
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text variant="caption" weight="bold" style={{ color: colors.primary }}>📍 Locate</Text>}
          </Pressable>
        )}
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          keyExtractor={(t) => t.key}
          contentContainerStyle={{ paddingHorizontal: 8 }}
          renderItem={({ item: tab }) => {
            const isSelected = activeTab === tab.key;
            return (
              <Pressable
                style={[
                  styles.tabButton,
                  isSelected && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}
                onPress={() => {
                  setActiveTab(tab.key);
                  if (tab.key === 'nearby' && !agentLocation) requestLocation();
                }}
              >
                <Text
                  variant="bodySmall"
                  weight={isSelected ? 'bold' : 'normal'}
                  style={{ color: isSelected ? colors.primary : colors.textSecondary }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Content */}
      {isLoading && filteredOrders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Loader size="large" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <ErrorState
            title="Failed to Load Orders"
            message={error.message || 'Unable to retrieve orders.'}
            onRetry={onRefresh}
          />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            activeTab === 'nearby' ? (
              <NearbyEmptyState />
            ) : (
              <EmptyState
                title={`No ${activeTab === 'all' ? '' : activeTab} orders`}
                message={
                  activeTab === 'pickup'
                    ? 'No pending customer pickups assigned to you right now.'
                    : activeTab === 'delivery'
                    ? 'No orders ready or out for delivery currently.'
                    : activeTab === 'completed'
                    ? 'No completed orders recorded yet.'
                    : 'No orders assigned to your route.'
                }
              />
            )
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    borderBottomWidth: 1,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  orderCard: {
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderPhotoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#0f172a',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nearbyEmptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    paddingTop: 48,
  },
});

export default DeliveryOrdersScreen;
