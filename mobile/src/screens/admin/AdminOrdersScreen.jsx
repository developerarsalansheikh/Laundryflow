import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { adminService } from '../../services/adminService';
import { socketService } from '../../services/socketService';

// RN-2 Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Badge from '../../components/ui/Badge';
import Divider from '../../components/ui/Divider';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'picked_up', label: 'Picked Up' },
  { id: 'at_laundry_pending_confirmation', label: 'Handoff Pending' },
  { id: 'in_progress', label: 'Processing' },
  { id: 'ready', label: 'Ready' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'returned_to_laundry', label: 'Returned' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const AdminOrdersScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [selectedStatus, setSelectedStatus] = useState(route.params?.status || 'all');
  const [isTodayOnly, setIsTodayOnly] = useState(Boolean(route.params?.todayOnly));
  const [searchQuery, setSearchQuery] = useState('');

  // Sync state dynamically if navigation params change (e.g. from Dashboard Overview card taps)
  useEffect(() => {
    if (route.params?.status !== undefined) {
      setSelectedStatus(route.params.status);
    }
    if (route.params?.todayOnly !== undefined) {
      setIsTodayOnly(Boolean(route.params.todayOnly));
    }
  }, [route.params?.status, route.params?.todayOnly, route.params?.timestamp]);

  // Fetch Orders Query (strictly scoped to current laundry)
  const {
    data: ordersResponse,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-orders', user?.laundryId || user?._id, selectedStatus],
    queryFn: () => adminService.getOrders({ status: selectedStatus, limit: 50 }),
    staleTime: 1000 * 20,
  });

  const ordersList = ordersResponse?.data || [];

  const laundryId = user?.laundryId?._id || user?.laundryId;

  // Real-time socket room subscription for Admin Orders
  useEffect(() => {
    if (!laundryId) return;

    socketService.joinRoom(`laundry:${laundryId}`);

    const unsubCreated = socketService.on('order:created', () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    });

    const unsubStatus = socketService.on('order:statusChanged', () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    });

    const unsubAssigned = socketService.on('order:assigned', () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    });

    const unsubCancelled = socketService.on('order:cancelled', () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    });

    return () => {
      unsubCreated();
      unsubStatus();
      unsubAssigned();
      unsubCancelled();
      socketService.leaveRoom(`laundry:${laundryId}`);
    };
  }, [laundryId, queryClient]);

  const isCreatedToday = (dateString) => {
    if (!dateString) return false;
    const orderDate = new Date(dateString);
    const today = new Date();
    return (
      orderDate.getFullYear() === today.getFullYear() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getDate() === today.getDate()
    );
  };

  // Filter by today's date and search query (Customer name, phone, or order ID)
  const filteredOrders = useMemo(() => {
    let list = ordersList;
    if (isTodayOnly) {
      list = list.filter((order) => isCreatedToday(order.createdAt));
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter((order) => {
      const orderId = (order._id || '').toLowerCase();
      const customerName = (order.user?.name || '').toLowerCase();
      const customerPhone = (order.user?.phone || '').toLowerCase();
      return orderId.includes(q) || customerName.includes(q) || customerPhone.includes(q);
    });
  }, [ordersList, isTodayOnly, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
      case 'pending_pickup':
      case 'placed':
        return <Badge label="Pending" variant="warning" size="sm" />;
      case 'picked_up':
        return <Badge label="Picked Up" variant="info" size="sm" />;
      case 'at_laundry_pending_confirmation':
        return <Badge label="Handoff Pending" variant="warning" size="sm" />;
      case 'received_at_laundry':
        return <Badge label="At Laundry" variant="success" size="sm" />;
      case 'in_progress':
      case 'processing':
        return <Badge label="Processing" variant="info" size="sm" />;
      case 'ready':
      case 'ready_for_delivery':
        return <Badge label="Ready" variant="success" size="sm" />;
      case 'ready_for_redelivery':
        return <Badge label="Ready Redelivery" variant="warning" size="sm" />;
      case 'out_for_delivery':
        return <Badge label="Out for Delivery" variant="warning" size="sm" />;
      case 'delivery_pending_customer_confirmation':
        return <Badge label="Confirming" variant="warning" size="sm" />;
      case 'customer_unavailable':
      case 'delivery_failed':
        return <Badge label="Unavailable" variant="error" size="sm" />;
      case 'returned_to_laundry':
        return <Badge label="Returned" variant="error" size="sm" />;
      case 'delivered':
        return <Badge label="Delivered" variant="success" size="sm" />;
      case 'cancelled':
        return <Badge label="Cancelled" variant="error" size="sm" />;
      default:
        return <Badge label={status?.replace(/_/g, ' ') || 'Unknown'} variant="neutral" size="sm" />;
    }
  };

  const renderOrderItem = ({ item }) => {
    const orderRefId = item._id?.slice(-6)?.toUpperCase() || 'ORDER';
    const customerName = item.user?.name || 'Customer';
    const totalItems = item.services?.reduce((acc, s) => acc + (s.quantity || 1), 0) || 0;
    const servicesSummary = item.services
      ?.map((s) => s.service?.name || 'Item')
      .slice(0, 2)
      .join(', ');

    const pickupDateStr = item.scheduledPickup?.date
      ? new Date(item.scheduledPickup.date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        })
      : 'Today';

    const slotLabel = item.scheduledPickup?.timeSlot?.label || '';

    return (
      <Card
        variant="elevated"
        style={[styles.orderCard, { backgroundColor: colors.surface }]}
        onPress={() => navigation.navigate('AdminOrderDetail', { orderId: item._id })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text variant="subtitle" weight="bold" colorVariant="primary">
              #{orderRefId}
            </Text>
            <Text variant="caption" colorVariant="muted" style={{ marginTop: 2 }}>
              {new Date(item.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          {getStatusBadge(item.status)}
        </View>

        <Divider style={{ marginVertical: spacing.xs }} />

        {/* Customer & Items Summary */}
        <View style={styles.customerRow}>
          <Text variant="body" weight="medium" colorVariant="primary">
            {customerName}
          </Text>
          {item.user?.phone ? (
            <Text variant="caption" colorVariant="secondary">
              📞 {item.user.phone}
            </Text>
          ) : null}
        </View>

        <Text variant="caption" colorVariant="muted" style={{ marginTop: 2 }}>
          {servicesSummary}
          {item.services?.length > 2 ? ` +${item.services.length - 2} more` : ''} ({totalItems} pcs)
        </Text>

        <View style={[styles.detailsBox, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
          <View style={styles.detailCol}>
            <Text variant="caption" colorVariant="muted">Pickup</Text>
            <Text variant="caption" weight="bold" colorVariant="primary">
              {pickupDateStr} {slotLabel ? `• ${slotLabel}` : ''}
            </Text>
          </View>

          <View style={styles.detailColRight}>
            <Text variant="caption" colorVariant="muted">Total Amount</Text>
            <Text variant="subtitle" weight="bold" colorVariant="primary">
              ₹{item.totalAmount || 0}
            </Text>
          </View>
        </View>

        <View style={styles.paymentFooter}>
          <Badge
            label={item.paymentMethod ? item.paymentMethod.toUpperCase() : 'COD'}
            variant="neutral"
            size="sm"
          />
          <Badge
            label={item.isPaid ? 'PAID' : 'UNPAID'}
            variant={item.isPaid ? 'success' : 'warning'}
            size="sm"
          />
        </View>
      </Card>
    );
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <Text variant="h2" weight="bold" colorVariant="primary">
          Orders Management
        </Text>
        <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
          {ordersResponse?.total ?? ordersList.length} total orders in system
        </Text>

        {/* Search Input */}
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search by customer name, phone or ID..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Horizontal Tabs */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tabsContainer}
          renderItem={({ item }) => {
            const isSelected = selectedStatus === item.id;
            return (
              <TouchableOpacity
                onPress={() => setSelectedStatus(item.id)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isSelected ? colors.primary : colors.borderLight,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  variant="caption"
                  weight={isSelected ? 'bold' : 'normal'}
                  style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Active Today Date Filter Chip */}
      {isTodayOnly && (
        <View style={[styles.todayBanner, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
          <Text variant="caption" weight="bold" colorVariant="primary">
            📅 Showing: Today's Orders
          </Text>
          <TouchableOpacity
            onPress={() => setIsTodayOnly(false)}
            style={[styles.clearDateBtn, { borderColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <Text variant="caption" weight="bold" style={{ color: colors.primary }}>
              ✕ Show All Dates
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Orders Content List */}
      {isLoading && !isRefetching ? (
        <View style={styles.centerContainer}>
          <Loader size="large" />
          <Text variant="body" colorVariant="secondary" style={{ marginTop: spacing.md }}>
            Loading store orders...
          </Text>
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <ErrorState
            title="Failed to load orders"
            message={error?.message || 'Could not connect to backend server.'}
            onRetry={refetch}
          />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
                queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title={
                searchQuery
                  ? 'No matching orders found'
                  : isTodayOnly
                  ? `No ${selectedStatus === 'all' ? '' : selectedStatus.replace(/_/g, ' ')} orders placed today`
                  : 'No orders in this category'
              }
              description={
                searchQuery
                  ? `No orders matching "${searchQuery}". Try a different keyword.`
                  : isTodayOnly
                  ? 'No orders were placed today matching this status. Tap below to see all dates.'
                  : 'Orders matching this status will appear here when placed.'
              }
              actionLabel={isTodayOnly ? 'Show All Dates' : undefined}
              onAction={isTodayOnly ? () => setIsTodayOnly(false) : undefined}
            />
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    marginBottom: 8,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  tabsContainer: {
    paddingVertical: 6,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  orderCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  detailsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 8,
  },
  detailCol: {
    flex: 1,
  },
  detailColRight: {
    alignItems: 'flex-end',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  clearDateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
});

export default AdminOrdersScreen;
