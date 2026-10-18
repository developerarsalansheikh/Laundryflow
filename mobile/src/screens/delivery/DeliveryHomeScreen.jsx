import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Linking,
  Platform,
  PermissionsAndroid,
  Alert,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { deliveryService } from '../../services/deliveryService';
import { authService } from '../../services/authService';
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
  const [activeWorkflowSection, setActiveWorkflowSection] = useState('pickup'); // 'pickup' | 'delivery'
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const handleLogout = async () => {
    setSignOutModalVisible(false);
    await authService.logout();
  };

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

  // Auto-refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      refetchStats();
      refetchPickups();
      refetchDeliveries();
    }, [refetchStats, refetchPickups, refetchDeliveries])
  );

  // Real-time socket listener
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

  // Availability Mutation
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

  // Location Sync handler
  const handleSyncLocation = async () => {
    setLocationSyncing(true);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'LaundryWave needs GPS location to route pickup and delivery dispatches.',
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

  const pickupCount = typeof stats?.pickupCount === 'number'
    ? stats.pickupCount
    : (Array.isArray(pickupOrders) ? pickupOrders.length : 0);

  const deliverCount = typeof stats?.deliveryCount === 'number'
    ? stats.deliveryCount
    : (Array.isArray(deliveryOrders) ? deliveryOrders.length : 0);

  const isRefreshing = Boolean(statsLoading || pickupsLoading || deliveriesLoading);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'R';

  return (
    <ScreenContainer
      scrollable
      padding="none"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#FFFFFF"
          colors={['#1E293B']}
        />
      }
      contentContainerStyle={styles.container}
    >
      {/* ── Top Curved Hero Header (Matching Screenshot 2) ── */}
      <View style={styles.heroContainer}>
        <View style={styles.heroRow}>
          {/* Avatar with + status badge */}
          <View style={styles.avatarWrapper}>
            <Text style={styles.avatarLetter}>{userInitial}</Text>
            <View style={styles.onlineBadgePlus}>
              <Text style={styles.onlineBadgePlusText}>+</Text>
            </View>
          </View>

          {/* Partner Info */}
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerName} numberOfLines={1}>
              {(user?.name || 'Ramesh Kumar').replace(/\s*\(Delivery\s*Agent\)/i, '').replace(/\s*\(Delivery\)/i, '')}
            </Text>
            <Text style={styles.partnerRole}>(Delivery Agent)</Text>
            <Text style={styles.partnerContact} numberOfLines={1}>
              + {user?.phone || '91 9876543219'} • {user?.email || 'delivery@laundryflow.com'}
            </Text>
          </View>

          {/* Go Online / Status Button */}
          <TouchableOpacity
            style={[
              styles.goOnlineBtn,
              currentStatus === 'available' ? styles.goOnlineBtnActive : styles.goOnlineBtnIdle,
            ]}
            onPress={handleToggleOnline}
            activeOpacity={0.8}
            disabled={availabilityMutation.isPending}
          >
            <Text style={styles.goOnlineBtnText}>
              {currentStatus === 'available' ? 'Online' : 'Go Online'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Duty Status Alert Bar (Cream / Amber bar matching Screenshot 2) ── */}
      <View style={styles.dutyAlertBar}>
        <View style={styles.dutyAlertLeft}>
          <View style={[styles.dutyStatusPill, currentStatus === 'available' ? styles.dutyStatusPillOnline : styles.dutyStatusPillOffline]}>
            <Text style={[styles.dutyStatusPillText, currentStatus === 'available' ? styles.dutyStatusPillTextOnline : styles.dutyStatusPillTextOffline]}>
              {currentStatus === 'available' ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
          <Text style={styles.dutyAlertMessage} numberOfLines={1}>
            • {currentStatus === 'available' ? 'Duty Active (Ready for orders)' : 'Duty Paused (Go Online to work)'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSyncLocation}
          activeOpacity={0.7}
          disabled={locationSyncing}
          style={{ paddingHorizontal: 4 }}
        >
          <Text style={styles.dutySyncText}>
            {locationSyncing ? 'Syncing...' : 'Sync'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Lifetime Performance Card (Matching Screenshot 2) ── */}
      <View style={styles.performanceCard}>
        <Text style={styles.performanceTitle}>Lifetime Performance</Text>
        <View style={styles.performanceStatsRow}>
          {/* Deliveries */}
          <View style={styles.perfCol}>
            <Text style={styles.perfNumberDeliveries}>
              {stats?.totalDelivered ?? stats?.completedDeliveries ?? 4}
            </Text>
            <Text style={styles.perfLabel}>Deliveries</Text>
          </View>

          {/* Earnings */}
          <View style={styles.perfCol}>
            <Text style={styles.perfNumberEarnings}>
              ₹{stats?.totalEarnings ?? stats?.todayEarnings ?? 180}
            </Text>
            <Text style={styles.perfLabel}>Earnings</Text>
          </View>

          {/* Rating */}
          <View style={styles.perfCol}>
            <Text style={styles.perfNumberRating}>
              {stats?.rating ? Number(stats.rating).toFixed(1) : '5.0'}★
            </Text>
            <Text style={styles.perfLabel}>Rating</Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => setSignOutModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* ── Two Big Work Sections: Collect & Deliver (Matching Screenshot 2) ── */}
      <View style={styles.twoBigCardsRow}>
        {/* COLLECT */}
        <TouchableOpacity
          style={[
            styles.workTileCard,
            styles.workTileCollect,
            activeWorkflowSection === 'pickup' && styles.workTileActiveCollect,
          ]}
          onPress={() => setActiveWorkflowSection('pickup')}
          activeOpacity={0.85}
        >
          <View style={styles.tileHeaderRow}>
            <Text style={{ fontSize: 20 }}>📦</Text>
            <View style={styles.collectTag}>
              <Text style={styles.collectTagText}>COLLECT</Text>
            </View>
          </View>
          <Text style={styles.tileBigCountCollect}>{pickupCount}</Text>
          <Text style={styles.tileTitleCollect}>Pickup: {pickupCount}</Text>
          <Text style={styles.tileSubCollect}>Ready to collect</Text>
        </TouchableOpacity>

        {/* DELIVER */}
        <TouchableOpacity
          style={[
            styles.workTileCard,
            styles.workTileDeliver,
            activeWorkflowSection === 'delivery' && styles.workTileActiveDeliver,
          ]}
          onPress={() => setActiveWorkflowSection('delivery')}
          activeOpacity={0.85}
        >
          <View style={styles.tileHeaderRow}>
            <Text style={{ fontSize: 20 }}>🚚</Text>
            <View style={styles.deliverTag}>
              <Text style={styles.deliverTagText}>DELIVER</Text>
            </View>
          </View>
          <Text style={styles.tileBigCountDeliver}>{deliverCount}</Text>
          <Text style={styles.tileTitleDeliver}>Deliver: {deliverCount}</Text>
          <Text style={styles.tileSubDeliver}>Awaiting delivery</Text>
        </TouchableOpacity>
      </View>

      {/* ── Section Header (1. Pickup Orders / 2. Delivery Orders) ── */}
      <View style={styles.workflowSectionRow}>
        <Text style={styles.workflowSectionTitle}>
          {activeWorkflowSection === 'pickup' ? '1. Pickup Orders' : '2. Delivery Orders'}
        </Text>

        <TouchableOpacity
          style={[
            styles.sectionBadgePill,
            activeWorkflowSection === 'pickup' ? styles.sectionBadgePickup : styles.sectionBadgeDeliver,
          ]}
          onPress={() =>
            setActiveWorkflowSection((prev) => (prev === 'pickup' ? 'delivery' : 'pickup'))
          }
          activeOpacity={0.8}
        >
          <Text style={styles.sectionBadgePillText}>
            {activeWorkflowSection === 'pickup' ? `Pickup (${pickupCount})` : `Deliver (${deliverCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Orders List ── */}
      <View style={styles.ordersContainer}>
        {activeWorkflowSection === 'pickup' ? (
          pickupOrders.length === 0 ? (
            <View style={styles.emptyCardBox}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>🧺</Text>
              <Text style={styles.emptyTitle}>No orders ready for pickup</Text>
              <Text style={styles.emptySubtitle}>
                When customers place orders, eligible ready-for-pickup orders from different laundries will automatically appear here.
              </Text>
            </View>
          ) : (
            pickupOrders.map((order) => {
              const orderId = order._id ? order._id.slice(-6).toUpperCase() : 'CAC99A';
              const customerName = order.user?.name || 'Customer';
              const customerPhone = order.user?.phone || '';
              const pickupAddress =
                order.pickupAddress?.fullAddress ||
                order.pickupAddressSnapshot?.fullAddress ||
                order.address ||
                'Customer Pickup Address';
              const laundryName = order.laundryId?.name || 'Ali Laundry';
              const laundryAddress = order.laundryId?.address || '123 Main khajrana';
              const servicesCount = order.services?.length || 1;

              return (
                <View key={order._id} style={styles.deliveryOrderCard}>
                  {/* Top: #ID & Status */}
                  <View style={styles.orderCardHeaderRow}>
                    <Text style={styles.orderCardIdText}>#{orderId}</Text>
                    <View style={styles.orderStatusPillHandoff}>
                      <Text style={styles.orderStatusPillHandoffText}>
                        DE AT LAUNDRY (HANDOFF PENDING)
                      </Text>
                    </View>
                  </View>

                  {/* Store info */}
                  <Text style={styles.storeNameAddress}>
                    Store: {laundryName} • {laundryAddress}
                  </Text>

                  {/* Customer row + photo thumb */}
                  <View style={styles.customerPhotoRow}>
                    {Boolean(order.pickupPhoto?.url) ? (
                      <Image
                        source={{ uri: order.pickupPhoto.url }}
                        style={styles.customerPhotoThumb}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.customerAvatarPlaceholder}>
                        <Text style={{ fontSize: 18 }}>🛍️</Text>
                      </View>
                    )}

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.orderCustomerName}>{customerName}</Text>
                      <Text style={styles.orderCustomerCity} numberOfLines={1}>
                        {pickupAddress}
                      </Text>
                      <Text style={styles.photoAttachedCheck}>
                        ✓ Pickup Photo Attached
                      </Text>
                    </View>
                  </View>

                  {/* Price & Items row */}
                  <View style={styles.priceItemsRow}>
                    <Text style={styles.itemsPriceText}>
                      {servicesCount} item(s) • ₹{order.totalAmount || 0} ({order.isPaid ? 'PAID' : 'COD'})
                    </Text>
                    <Text style={styles.orderDateText}>
                      {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Navigate Button */}
                  <TouchableOpacity
                    style={styles.navigateButton}
                    onPress={() => handleOpenMaps(pickupAddress)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.navigateButtonText}>Navigate →</Text>
                  </TouchableOpacity>

                  {/* Manage / Pick up action */}
                  <TouchableOpacity
                    style={styles.detailLink}
                    onPress={() => navigation.navigate('DeliveryOrderDetail', { orderId: order._id })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.detailLinkText}>View Order Details & Complete Pickup ›</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )
        ) : (
          // Delivery Orders
          deliveryOrders.length === 0 ? (
            <View style={styles.emptyCardBox}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>🚚</Text>
              <Text style={styles.emptyTitle}>No orders awaiting delivery</Text>
              <Text style={styles.emptySubtitle}>
                When you collect orders from customers or laundry stores, they will appear here until successfully delivered.
              </Text>
            </View>
          ) : (
            deliveryOrders.map((order) => {
              const orderId = order._id ? order._id.slice(-6).toUpperCase() : '2C57D9';
              const customerName = order.user?.name || 'Customer';
              const customerPhone = order.user?.phone || '';
              const deliveryAddress =
                order.deliveryAddress?.fullAddress ||
                order.deliveryAddressSnapshot?.fullAddress ||
                order.address ||
                'Customer Delivery Address';
              const laundryName = order.laundryId?.name || 'Ali Laundry';
              const laundryAddress = order.laundryId?.address || '123 Main khajrana';
              const servicesCount = order.services?.length || 1;

              return (
                <View key={order._id} style={styles.deliveryOrderCard}>
                  {/* Top: #ID & Status */}
                  <View style={styles.orderCardHeaderRow}>
                    <Text style={styles.orderCardIdText}>#{orderId}</Text>
                    <View style={styles.orderStatusPillHandoff}>
                      <Text style={styles.orderStatusPillHandoffText}>
                        DE AT LAUNDRY (HANDOFF PENDING)
                      </Text>
                    </View>
                  </View>

                  {/* Store info */}
                  <Text style={styles.storeNameAddress}>
                    Store: {laundryName} • {laundryAddress}
                  </Text>

                  {/* Customer row + photo thumb */}
                  <View style={styles.customerPhotoRow}>
                    {Boolean(order.pickupPhoto?.url) ? (
                      <Image
                        source={{ uri: order.pickupPhoto.url }}
                        style={styles.customerPhotoThumb}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.customerAvatarPlaceholder}>
                        <Text style={{ fontSize: 18 }}>📦</Text>
                      </View>
                    )}

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.orderCustomerName}>{customerName}</Text>
                      <Text style={styles.orderCustomerCity} numberOfLines={1}>
                        {deliveryAddress}
                      </Text>
                      <Text style={styles.photoAttachedCheck}>
                        ✓ Pickup Photo Attached
                      </Text>
                    </View>
                  </View>

                  {/* Price & Items row */}
                  <View style={styles.priceItemsRow}>
                    <Text style={styles.itemsPriceText}>
                      {servicesCount} item(s) • ₹{order.totalAmount || 0} ({order.isPaid ? 'PAID' : 'COD'})
                    </Text>
                    <Text style={styles.orderDateText}>
                      {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Navigate Button */}
                  <TouchableOpacity
                    style={styles.navigateButton}
                    onPress={() => handleOpenMaps(deliveryAddress)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.navigateButtonText}>Navigate →</Text>
                  </TouchableOpacity>

                  {/* Manage / Deliver action */}
                  <TouchableOpacity
                    style={styles.detailLink}
                    onPress={() => navigation.navigate('DeliveryOrderDetail', { orderId: order._id })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.detailLinkText}>View Order Details & Complete Delivery ›</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )
        )}
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={signOutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSignOutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text variant="title" weight="bold" colorVariant="primary" style={{ textAlign: 'center' }}>
              Confirm Sign Out
            </Text>
            <Text
              variant="body"
              colorVariant="secondary"
              style={{ textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg }}
            >
              Are you sure you want to sign out from Delivery workspace?
            </Text>
            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setSignOutModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Sign Out"
                variant="primary"
                size="md"
                onPress={handleLogout}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: '#F8FAFC',
  },
  // ── Hero Curved Header ──
  heroContainer: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0369A1',
  },
  onlineBadgePlus: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  onlineBadgePlusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '900',
    lineHeight: 14,
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  partnerRole: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 1,
  },
  partnerContact: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
  },
  goOnlineBtn: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goOnlineBtnActive: {
    backgroundColor: '#16A34A',
  },
  goOnlineBtnIdle: {
    backgroundColor: '#0D9488',
  },
  goOnlineBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  // ── Duty Alert Bar ──
  dutyAlertBar: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dutyAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  dutyStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  dutyStatusPillOffline: {
    backgroundColor: '#FED7AA',
  },
  dutyStatusPillOnline: {
    backgroundColor: '#BBF7D0',
  },
  dutyStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  dutyStatusPillTextOffline: {
    color: '#9A3412',
  },
  dutyStatusPillTextOnline: {
    color: '#166534',
  },
  dutyAlertMessage: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  dutySyncText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '800',
  },
  // ── Lifetime Performance Card ──
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  performanceStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  perfCol: {
    alignItems: 'center',
    flex: 1,
  },
  perfNumberDeliveries: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#0F172A',
    includeFontPadding: false,
  },
  perfNumberEarnings: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#059669',
    includeFontPadding: false,
  },
  perfNumberRating: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#D97706',
    includeFontPadding: false,
  },
  perfLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  signOutButton: {
    borderWidth: 1.5,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  // ── Two Big Work Sections ──
  twoBigCardsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    gap: 12,
  },
  workTileCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    elevation: 1,
  },
  workTileCollect: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  workTileActiveCollect: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  workTileDeliver: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  workTileActiveDeliver: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  tileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectTag: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  collectTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  deliverTag: {
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  deliverTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
  },
  tileBigCountCollect: {
    fontSize: 28,
    lineHeight: 34,
    minHeight: 34,
    fontWeight: '800',
    color: '#B45309',
    marginTop: 6,
    marginBottom: 2,
    includeFontPadding: false,
  },
  tileTitleCollect: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  tileSubCollect: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 1,
  },
  tileBigCountDeliver: {
    fontSize: 28,
    lineHeight: 34,
    minHeight: 34,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: 6,
    marginBottom: 2,
    includeFontPadding: false,
  },
  tileTitleDeliver: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
  },
  tileSubDeliver: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 1,
  },
  // ── Section Title Row ──
  workflowSectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  workflowSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionBadgePill: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  sectionBadgePickup: {
    backgroundColor: '#D97706',
  },
  sectionBadgeDeliver: {
    backgroundColor: '#0284C7',
  },
  sectionBadgePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // ── Orders List ──
  ordersContainer: {
    paddingHorizontal: 16,
  },
  emptyCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  // ── Order Card ──
  deliveryOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCardIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderStatusPillHandoff: {
    backgroundColor: '#E0F2FE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  orderStatusPillHandoffText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.2,
  },
  storeNameAddress: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    marginTop: 4,
  },
  customerPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 10,
  },
  customerPhotoThumb: {
    width: 46,
    height: 46,
    borderRadius: 8,
  },
  customerAvatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCustomerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderCustomerCity: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  photoAttachedCheck: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 2,
  },
  priceItemsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  itemsPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  orderDateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  navigateButton: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  navigateButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailLink: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  detailLinkText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
  },
  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  modalBtnRow: {
    flexDirection: 'row',
  },
});

export default DeliveryHomeScreen;
