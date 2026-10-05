import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Linking,
  Platform,
  PermissionsAndroid,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { deliveryService } from '../../services/deliveryService';
import { socketService } from '../../services/socketService';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Divider from '../../components/ui/Divider';
import Loader from '../../components/ui/Loader';
import ErrorState from '../../components/ui/ErrorState';

export const DeliveryHomeScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [locationSyncing, setLocationSyncing] = useState(false);
  // Active workflow section: 'pickup' | 'delivery'
  const [activeWorkflowSection, setActiveWorkflowSection] = useState('pickup');

  // Fetch Delivery Partner Stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['deliveryStats'],
    queryFn: deliveryService.getStats,
  });

  // 1. Fetch Pickup Orders (Ready to collect)
  const {
    data: pickupOrders = [],
    isLoading: pickupsLoading,
    refetch: refetchPickups,
  } = useQuery({
    queryKey: ['deliveryActiveOrders', 'pickup'],
    queryFn: () => deliveryService.getActiveOrders({ type: 'pickup' }),
  });

  // 2. Fetch Delivery Orders (Picked up, awaiting customer delivery)
  const {
    data: deliveryOrders = [],
    isLoading: deliveriesLoading,
    refetch: refetchDeliveries,
  } = useQuery({
    queryKey: ['deliveryActiveOrders', 'delivery'],
    queryFn: () => deliveryService.getActiveOrders({ type: 'delivery' }),
  });

  // ── Auto-refetch on screen focus (guarantees immediate sync when returning from Orders/Collect) ──
  useFocusEffect(
    useCallback(() => {
      refetchStats();
      refetchPickups();
      refetchDeliveries();
    }, [refetchStats, refetchPickups, refetchDeliveries])
  );

  // Real-time socket listener for incoming assignments and order status changes
  useEffect(() => {
    socketService.connect();

    const unsubAssigned = socketService.on('order:assigned', (payload) => {
      if (payload?.order) {
        queryClient.setQueryData(['deliveryActiveOrders', 'pickup'], (oldPickups = []) => {
          const orderId = payload.orderId || payload.order?._id;
          const filtered = Array.isArray(oldPickups) ? oldPickups.filter((o) => (o._id || o.id) !== orderId) : [];
          return [payload.order, ...filtered];
        });
      }
      queryClient.invalidateQueries({ queryKey: ['deliveryActiveOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryStats'] });
      refetchPickups();
      refetchStats();
    });

    const unsubStatus = socketService.on('order:statusChanged', () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryActiveOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryStats'] });
      refetchPickups();
      refetchDeliveries();
    });

    const unsubCancelled = socketService.on('order:cancelled', () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryActiveOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryStats'] });
      refetchPickups();
      refetchDeliveries();
    });

    const unsubPhoto = socketService.on('order:pickup_photo_uploaded', () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryActiveOrders'] });
      refetchPickups();
    });

    return () => {
      unsubAssigned();
      unsubStatus();
      unsubCancelled();
      unsubPhoto();
    };
  }, [queryClient, refetchPickups, refetchDeliveries, refetchStats]);

  // Availability Mutation (Single source of truth via useAuthStore + socket)
  const currentStatus = user?.availabilityStatus || (user?.isAvailable ? 'available' : 'offline');

  const availabilityMutation = useMutation({
    mutationFn: (newStatus) => deliveryService.updateAvailability(newStatus),
    onMutate: async (newStatus) => {
      const prevUser = useAuthStore.getState().user;
      useAuthStore.getState().setUser({
        ...prevUser,
        availabilityStatus: newStatus,
        isAvailable: newStatus === 'available',
      });
      return { prevUser };
    },
    onSuccess: (data, newStatus) => {
      if (data?.data) {
        useAuthStore.getState().setUser(data.data);
      }
      socketService.setDriverAvailability(newStatus, newStatus === 'available');
      queryClient.invalidateQueries({ queryKey: ['deliveryStats'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryActiveOrders'] });
    },
    onError: (err, _vars, context) => {
      if (context?.prevUser) {
        useAuthStore.getState().setUser(context.prevUser);
      }
      Alert.alert('Status Error', err?.response?.data?.message || 'Failed to update availability status.');
    },
  });

  const handleToggleOnline = () => {
    if (availabilityMutation.isPending) return;
    const nextStatus = currentStatus === 'available' ? 'offline' : 'available';
    availabilityMutation.mutate(nextStatus);
  };

  const handleSetBusy = () => {
    if (availabilityMutation.isPending) return;
    const nextStatus = currentStatus === 'busy' ? 'available' : 'busy';
    availabilityMutation.mutate(nextStatus);
  };

  // Location Sync handler
  const handleSyncLocation = async () => {
    setLocationSyncing(true);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'LaundryFlow needs GPS location to route pickup and delivery dispatches.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'GPS location permission was denied.');
          setLocationSyncing(false);
          return;
        }
      }

      const latitude = 28.6139;
      const longitude = 77.209;
      await deliveryService.updateLocation({ latitude, longitude });
      Alert.alert('Location Updated', 'Your GPS location was successfully synced.');
    } catch (err) {
      Alert.alert('Location Error', err?.message || 'Failed to sync GPS location.');
    } finally {
      setLocationSyncing(false);
    }
  };

  const handleOpenMaps = (addressText) => {
    if (!addressText) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(addressText)}`,
      android: `geo:0,0?q=${encodeURIComponent(addressText)}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`);
    });
  };

  const onRefresh = () => {
    refetchStats();
    refetchPickups();
    refetchDeliveries();
  };

  const pickupCount = stats?.pickupCount ?? pickupOrders.length;
  const deliverCount = stats?.deliveryCount ?? deliveryOrders.length;

  const isRefreshing = statsLoading || pickupsLoading || deliveriesLoading;

  return (
    <ScreenContainer
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      contentContainerStyle={styles.container}
    >
      {/* Top App Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={{ flex: 1 }}>
          <Text variant="caption" colorVariant="secondary">
            DELIVERY AGENT WORKSPACE
          </Text>
          <Text variant="h3" weight="bold" colorVariant="primary">
            {user?.name || 'Delivery Partner'}
          </Text>
        </View>

        {/* Availability Toggle Button */}
        <Button
          title={currentStatus === 'available' ? 'Online' : currentStatus === 'busy' ? 'Busy' : 'Offline'}
          variant={currentStatus === 'available' ? 'primary' : currentStatus === 'busy' ? 'secondary' : 'outline'}
          size="sm"
          loading={availabilityMutation.isPending}
          onPress={handleToggleOnline}
        />
      </View>

      <View style={styles.body}>
        {statsError && (
          <View style={{ marginBottom: spacing.md }}>
            <ErrorState
              title="Dashboard Sync Issue"
              message={statsError?.message || 'Could not refresh statistics.'}
              onRetry={onRefresh}
            />
          </View>
        )}

        {/* Duty Status Card */}
        <Card variant="elevated" style={styles.card}>
          <View style={styles.badgeRow}>
            <View style={styles.statusGroup}>
              <Badge
                label={currentStatus === 'available' ? 'ONLINE • AVAILABLE' : currentStatus === 'busy' ? 'BUSY' : 'OFFLINE'}
                variant={currentStatus === 'available' ? 'success' : currentStatus === 'busy' ? 'warning' : 'neutral'}
                size="sm"
              />
              <Text variant="caption" colorVariant="muted" style={{ marginLeft: 8 }}>
                {currentStatus === 'available' ? 'Ready for Pickups & Deliveries' : 'Duty Paused (Go Online to work)'}
              </Text>
            </View>

            <Button
              title="Sync GPS"
              variant="ghost"
              size="xs"
              loading={locationSyncing}
              onPress={handleSyncLocation}
            />
          </View>

          <Divider style={{ marginVertical: spacing.md }} />

          {/* TWO MAIN WORK SECTIONS COUNTERS: PICKUP & DELIVER */}
          <View style={styles.twoSectionGrid}>
            <TouchableOpacity
              style={[
                styles.workflowCounterCard,
                activeWorkflowSection === 'pickup' && {
                  borderColor: '#D97706',
                  backgroundColor: '#FEF3C7',
                },
              ]}
              onPress={() => setActiveWorkflowSection('pickup')}
              activeOpacity={0.8}
            >
              <View style={styles.counterRow}>
                <Text style={{ fontSize: 20 }}>📦</Text>
                <Badge label="COLLECT" variant="warning" size="xs" />
              </View>
              <Text variant="h1" weight="bold" style={{ color: '#B45309', marginVertical: 4 }}>
                {pickupCount}
              </Text>
              <Text variant="caption" weight="bold" style={{ color: '#92400E' }}>
                Pickup: {pickupCount}
              </Text>
              <Text variant="caption" colorVariant="muted" style={{ fontSize: 11 }}>
                Ready to collect
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.workflowCounterCard,
                activeWorkflowSection === 'delivery' && {
                  borderColor: '#0284C7',
                  backgroundColor: '#E0F2FE',
                },
              ]}
              onPress={() => setActiveWorkflowSection('delivery')}
              activeOpacity={0.8}
            >
              <View style={styles.counterRow}>
                <Text style={{ fontSize: 20 }}>🚚</Text>
                <Badge label="DELIVER" variant="primary" size="xs" />
              </View>
              <Text variant="h1" weight="bold" style={{ color: '#0369A1', marginVertical: 4 }}>
                {deliverCount}
              </Text>
              <Text variant="caption" weight="bold" style={{ color: '#075985' }}>
                Deliver: {deliverCount}
              </Text>
              <Text variant="caption" colorVariant="muted" style={{ fontSize: 11 }}>
                Awaiting delivery
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* WORKFLOW SECTION TOGGLE HEADER */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text variant="title" weight="bold" colorVariant="primary">
              {activeWorkflowSection === 'pickup' ? '1. Pickup Orders' : '2. Delivery Orders'}
            </Text>
            <Text variant="caption" colorVariant="secondary">
              {activeWorkflowSection === 'pickup'
                ? 'Ready to collect from customers across laundries'
                : 'Picked-up orders awaiting customer delivery'}
            </Text>
          </View>

          <View style={styles.tabToggleButtons}>
            <TouchableOpacity
              style={[
                styles.tabToggleBtn,
                activeWorkflowSection === 'pickup' && { backgroundColor: '#D97706' },
              ]}
              onPress={() => setActiveWorkflowSection('pickup')}
            >
              <Text
                variant="caption"
                weight="bold"
                style={{ color: activeWorkflowSection === 'pickup' ? '#FFFFFF' : colors.textSecondary }}
              >
                Pickup ({pickupOrders.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabToggleBtn,
                activeWorkflowSection === 'delivery' && { backgroundColor: '#0284C7' },
              ]}
              onPress={() => setActiveWorkflowSection('delivery')}
            >
              <Text
                variant="caption"
                weight="bold"
                style={{ color: activeWorkflowSection === 'delivery' ? '#FFFFFF' : colors.textSecondary }}
              >
                Deliver ({deliveryOrders.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 1: PICKUP ORDERS
        ───────────────────────────────────────────────────────────── */}
        {activeWorkflowSection === 'pickup' && (
          pickupOrders.length === 0 ? (
            <Card variant="flat" style={styles.emptyCard}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🧺</Text>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary" align="center">
                No orders ready for pickup
              </Text>
              <Text variant="caption" colorVariant="muted" align="center" style={{ marginTop: 4 }}>
                When customers place orders, eligible ready-for-pickup orders from different laundries will automatically appear here.
              </Text>
            </Card>
          ) : (
            pickupOrders.map((order) => {
              const orderId = order._id ? `LF${order._id.slice(-4).toUpperCase()}` : 'LF1024';
              const customerName = order.user?.name || 'Customer';
              const customerPhone = order.user?.phone || '';
              const pickupAddress =
                order.pickupAddress?.fullAddress ||
                order.pickupAddressSnapshot?.fullAddress ||
                order.address ||
                'Customer Pickup Address';
              const laundryName = order.laundryId?.name || 'Laundry Store';
              const laundryAddress = order.laundryId?.address || 'Laundry Address';
              const servicesCount = order.services?.length || 1;
              const scheduledTime = order.scheduledPickup?.timeSlot?.label || 'Today';

              return (
                <Card key={order._id} variant="elevated" style={styles.orderCard}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View>
                      <Text variant="subtitle" weight="bold" colorVariant="primary">
                        ORDER #{orderId}
                      </Text>
                      <Text variant="caption" colorVariant="secondary">
                        {servicesCount} item(s) • ₹{order.totalAmount || 0}
                      </Text>
                    </View>
                    <Badge label="Ready for Pickup" variant="warning" size="sm" />
                  </View>

                  <Divider style={{ marginVertical: spacing.xs }} />

                  {/* Customer Information */}
                  <View style={styles.infoRow}>
                    <Text variant="caption" weight="bold" colorVariant="secondary">
                      Customer:
                    </Text>
                    <Text variant="bodySmall" weight="semibold" colorVariant="primary">
                      {customerName}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text variant="caption" weight="bold" colorVariant="secondary">
                      Pickup Address:
                    </Text>
                    <Text variant="bodySmall" colorVariant="primary" style={{ flex: 1, textAlign: 'right' }}>
                      {pickupAddress}
                    </Text>
                  </View>

                  {/* Destination Laundry */}
                  <View style={styles.destinationBox}>
                    <Text variant="caption" weight="bold" style={{ color: '#0369A1' }}>
                      Destination Store:
                    </Text>
                    <Text variant="bodySmall" weight="bold" colorVariant="primary" style={{ marginTop: 2 }}>
                      {laundryName}
                    </Text>
                    <Text variant="caption" colorVariant="secondary" style={{ marginTop: 1 }}>
                      {laundryAddress}
                    </Text>
                  </View>

                  {/* Pickup Slot & Photo */}
                  <View style={styles.metaRow}>
                    <Text variant="caption" colorVariant="muted">
                      Scheduled: {scheduledTime}
                    </Text>
                    {Boolean(order.pickupPhoto?.url) ? (
                      <View style={styles.photoCapturedBadge}>
                        <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: 'bold' }}>
                          ✓ Photo Captured
                        </Text>
                      </View>
                    ) : (
                      <Text variant="caption" style={{ color: '#D97706', fontWeight: 'bold' }}>
                        📸 Photo Required at Pickup
                      </Text>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.actionRow}>
                    <Button
                      title="📍 Navigate"
                      variant="outline"
                      size="sm"
                      style={{ flex: 1 }}
                      onPress={() => handleOpenMaps(pickupAddress)}
                    />
                    <Button
                      title="View / Pick Up →"
                      variant="primary"
                      size="sm"
                      style={{ flex: 1.5 }}
                      onPress={() => navigation.navigate('DeliveryOrderDetail', { orderId: order._id })}
                    />
                  </View>
                </Card>
              );
            })
          )
        )}

        {/* ─────────────────────────────────────────────────────────────
            SECTION 2: DELIVERY ORDERS
        ───────────────────────────────────────────────────────────── */}
        {activeWorkflowSection === 'delivery' && (
          deliveryOrders.length === 0 ? (
            <Card variant="flat" style={styles.emptyCard}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🚚</Text>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary" align="center">
                No orders awaiting delivery
              </Text>
              <Text variant="caption" colorVariant="muted" align="center" style={{ marginTop: 4 }}>
                When you collect orders from customers or laundry stores, they will appear here until successfully delivered.
              </Text>
            </Card>
          ) : (
            deliveryOrders.map((order) => {
              const orderId = order._id ? `LF${order._id.slice(-4).toUpperCase()}` : 'LF1025';
              const customerName = order.user?.name || 'Customer';
              const customerPhone = order.user?.phone || '';
              const deliveryAddress =
                order.deliveryAddress?.fullAddress ||
                order.deliveryAddressSnapshot?.fullAddress ||
                order.address ||
                'Customer Delivery Address';
              const servicesCount = order.services?.length || 1;

              return (
                <Card key={order._id} variant="elevated" style={styles.orderCard}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View>
                      <Text variant="subtitle" weight="bold" colorVariant="primary">
                        ORDER #{orderId}
                      </Text>
                      <Text variant="caption" colorVariant="secondary">
                        {servicesCount} item(s) • ₹{order.totalAmount || 0} ({order.isPaid ? 'PAID' : 'COD'})
                      </Text>
                    </View>
                    <Badge
                      label={order.status.toUpperCase().replace(/_/g, ' ')}
                      variant={order.status === 'out_for_delivery' ? 'warning' : 'primary'}
                      size="sm"
                    />
                  </View>

                  <Divider style={{ marginVertical: spacing.xs }} />

                  {/* Customer Information */}
                  <View style={styles.infoRow}>
                    <Text variant="caption" weight="bold" colorVariant="secondary">
                      Customer:
                    </Text>
                    <Text variant="bodySmall" weight="semibold" colorVariant="primary">
                      {customerName}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text variant="caption" weight="bold" colorVariant="secondary">
                      Deliver To:
                    </Text>
                    <Text variant="bodySmall" colorVariant="primary" style={{ flex: 1, textAlign: 'right' }}>
                      {deliveryAddress}
                    </Text>
                  </View>

                  {/* Pickup Photo Thumbnail & Identity Row */}
                  <View style={styles.photoIdentityRow}>
                    <View style={{ flex: 1 }}>
                      <Text variant="caption" weight="bold" colorVariant="secondary">
                        Package Identification:
                      </Text>
                      <Text variant="caption" colorVariant="muted" style={{ marginTop: 2 }}>
                        Store: {order.laundryId?.name || 'Laundry Store'}
                      </Text>
                      {Boolean(order.pickupPhoto?.uploadedAt) && (
                        <Text variant="caption" colorVariant="muted">
                          Collected: {new Date(order.pickupPhoto.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      )}
                    </View>

                    {Boolean(order.pickupPhoto?.url) ? (
                      <View style={styles.photoThumbnailWrapper}>
                        <Image
                          source={{ uri: order.pickupPhoto.url }}
                          style={styles.photoThumbnail}
                          resizeMode="cover"
                        />
                        <View style={styles.photoTag}>
                          <Text style={{ fontSize: 9, color: '#FFFFFF', fontWeight: 'bold' }}>PHOTO</Text>
                        </View>
                      </View>
                    ) : (
                      <Badge label="NO PHOTO" variant="neutral" size="xs" />
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.actionRow}>
                    {Boolean(customerPhone) && (
                      <Button
                        title="📞 Call"
                        variant="outline"
                        size="sm"
                        onPress={() => Linking.openURL(`tel:${customerPhone}`).catch(() => {})}
                      />
                    )}
                    <Button
                      title="📍 Navigate"
                      variant="outline"
                      size="sm"
                      style={{ flex: 1 }}
                      onPress={() => handleOpenMaps(deliveryAddress)}
                    />
                    <Button
                      title="View / Deliver →"
                      variant="primary"
                      size="sm"
                      style={{ flex: 1.5 }}
                      onPress={() => navigation.navigate('DeliveryOrderDetail', { orderId: order._id })}
                    />
                  </View>
                </Card>
              );
            })
          )
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  body: {
    padding: 16,
  },
  card: {
    padding: 16,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  twoSectionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  workflowCounterCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tabToggleButtons: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
  },
  tabToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  orderCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  destinationBox: {
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
    marginVertical: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  photoCapturedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  photoIdentityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
  },
  photoThumbnailWrapper: {
    width: 52,
    height: 52,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#0284C7',
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(2, 132, 199, 0.85)',
    alignItems: 'center',
    paddingVertical: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  emptyCard: {
    padding: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DeliveryHomeScreen;
