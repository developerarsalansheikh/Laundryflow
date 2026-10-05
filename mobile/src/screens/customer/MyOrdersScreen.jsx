import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { customerService } from '../../services/customerService';
import { OfflineCache } from '../../utils/offlineCache';
import { useAuthStore } from '../../store/authStore';

// RN-2 Design System Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

const STATUS_VARIANTS = {
  pending: { label: 'Order Placed', variant: 'warning' },
  pending_pickup: { label: 'Pickup Scheduled', variant: 'warning' },
  placed: { label: 'Order Placed', variant: 'warning' },
  picked_up: { label: 'Picked Up', variant: 'info' },
  at_laundry_pending_confirmation: { label: 'At Store (Handoff Pending)', variant: 'info' },
  received_at_laundry: { label: 'Received at Laundry', variant: 'info' },
  in_progress: { label: 'In Wash & Process', variant: 'info' },
  processing: { label: 'In Wash & Process', variant: 'info' },
  ready: { label: 'Ready for Delivery', variant: 'primary' },
  ready_for_delivery: { label: 'Ready for Delivery', variant: 'primary' },
  ready_for_redelivery: { label: 'Ready for Redelivery', variant: 'primary' },
  out_for_delivery: { label: 'Out for Delivery', variant: 'primary' },
  delivery_pending_customer_confirmation: { label: 'Arrived! Please Confirm', variant: 'warning' },
  customer_unavailable: { label: 'Customer Unavailable', variant: 'danger' },
  delivery_failed: { label: 'Delivery Attempt Failed', variant: 'danger' },
  returned_to_laundry: { label: 'Returned to Store', variant: 'warning' },
  delivered: { label: 'Delivered', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};

const ACTIVE_STATUSES = [
  'pending',
  'pending_pickup',
  'placed',
  'picked_up',
  'at_laundry_pending_confirmation',
  'received_at_laundry',
  'in_progress',
  'processing',
  'ready',
  'ready_for_delivery',
  'ready_for_redelivery',
  'out_for_delivery',
  'delivery_pending_customer_confirmation',
  'customer_unavailable',
  'delivery_failed',
  'returned_to_laundry',
];

export const MyOrdersScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'past'

  // Query: My Orders (strictly scoped to authenticated user)
  const {
    data: ordersData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['myOrders', user?._id],
    queryFn: customerService.getMyOrders,
  });

  const orders = useMemo(() => {
    let list = [];
    if (Array.isArray(ordersData?.data)) list = ordersData.data;
    else if (Array.isArray(ordersData)) list = ordersData;

    const cacheKey = `customer_my_orders_${user?._id || 'guest'}`;

    if (ordersData !== undefined) {
      // Server returned authoritative response — save to user-specific cache and return
      OfflineCache.set(cacheKey, list);
      return list;
    }

    // Only if network failed/offline, check user-specific cache
    const cached = OfflineCache.get(cacheKey);
    if (Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    return [];
  }, [ordersData, user?._id]);

  // Split into Active vs Past
  const activeOrders = useMemo(() => {
    return orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  }, [orders]);

  const pastOrders = useMemo(() => {
    return orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));
  }, [orders]);

  const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders;

  const handleOpenOrder = (order) => {
    navigation.navigate('OrderDetail', { orderId: order._id || order.id });
  };

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: colors.background }}>
      <Header
        title="My Orders"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'active' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            variant="bodyMedium"
            weight={activeTab === 'active' ? 'bold' : 'normal'}
            style={{ color: activeTab === 'active' ? colors.primary : colors.textSecondary }}
          >
            Active Orders ({activeOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'past' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            variant="bodyMedium"
            weight={activeTab === 'past' ? 'bold' : 'normal'}
            style={{ color: activeTab === 'past' ? colors.primary : colors.textSecondary }}
          >
            Past Bookings ({pastOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 30 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading && (
          <View style={styles.loaderArea}>
            <Loader size="small" message="Loading your bookings..." />
          </View>
        )}

        {isError && !isLoading && (
          <ErrorState
            title="Failed to load orders"
            message={error?.message || 'Could not connect to the orders service.'}
            retryAction={refetch}
          />
        )}

        {!isLoading && !isError && displayedOrders.length === 0 && (
          <EmptyState
            title={activeTab === 'active' ? 'No active orders' : 'No past bookings'}
            message={
              activeTab === 'active'
                ? 'You do not have any orders in progress right now.'
                : 'Your completed and past bookings will appear here.'
            }
            actionLabel="Order Laundry"
            onAction={() => navigation.navigate('CustomerHome')}
          />
        )}

        {!isLoading && displayedOrders.length > 0 && (
          <View style={styles.orderList}>
            {displayedOrders.map((order) => {
              const statusCfg = STATUS_VARIANTS[order.status] || { label: order.status, variant: 'neutral' };
              const dateStr = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recent';

              const storeName = order.laundryId?.name || 'Laundry Store';
              const itemsCount = Array.isArray(order.services)
                ? order.services.reduce((sum, s) => sum + (s.quantity || 1), 0)
                : 0;

              return (
                <TouchableOpacity
                  key={order._id}
                  activeOpacity={0.8}
                  onPress={() => handleOpenOrder(order)}
                >
                  <Card variant="elevated" style={styles.orderCard}>
                    {/* Header: Store and Status */}
                    <View style={styles.cardTopRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text variant="bodyLarge" weight="bold" colorVariant="primary" numberOfLines={1}>
                          🏬 {storeName}
                        </Text>
                        <Text variant="caption" colorVariant="muted" style={{ marginTop: 2 }}>
                          Order #{order._id.slice(-8).toUpperCase()} • {dateStr}
                        </Text>
                      </View>
                      <Badge label={statusCfg.label} variant={statusCfg.variant} size="sm" />
                    </View>

                    {/* Services summary preview */}
                    <View style={styles.servicesPreview}>
                      <Text variant="caption" colorVariant="secondary">
                        {itemsCount} item{itemsCount > 1 ? 's' : ''}:{' '}
                        {order.services?.slice(0, 2).map((s) => s.service?.name || 'Service').join(', ')}
                        {order.services?.length > 2 ? ' ...' : ''}
                      </Text>
                    </View>

                    {/* Footer: Price & CTA */}
                    <View style={[styles.cardFooter, { borderTopColor: colors.borderLight }]}>
                      <View>
                        <Text variant="caption" colorVariant="muted">
                          TOTAL PAID / PAYABLE
                        </Text>
                        <Text variant="bodyLarge" weight="bold" style={{ color: colors.primary }}>
                          ₹{order.totalAmount}
                        </Text>
                      </View>

                      <Text variant="bodySmall" weight="bold" style={{ color: colors.primary }}>
                        View Details →
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  scrollContent: {
    padding: 16,
  },
  loaderArea: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  orderList: {
    gap: 12,
  },
  orderCard: {
    padding: 14,
    borderRadius: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  servicesPreview: {
    marginTop: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
});

export default MyOrdersScreen;
