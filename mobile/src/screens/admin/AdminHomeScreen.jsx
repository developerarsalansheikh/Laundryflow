import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { adminService } from '../../services/adminService';
import { authService } from '../../services/authService';

// RN-2 UI Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Divider from '../../components/ui/Divider';
import Loader from '../../components/ui/Loader';
import ErrorState from '../../components/ui/ErrorState';

export const AdminHomeScreen = () => {
  const { colors, spacing, radius, shadows } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // Fetch Dashboard Stats & Recent Orders
  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-dashboard', user?.laundryId || user?._id],
    queryFn: adminService.getDashboard,
    staleTime: 1000 * 30, // 30 seconds
  });

  const stats = dashboardData?.stats || {};
  const recentOrders = dashboardData?.recentOrders || [];

  const todayDeliveries = dashboardData?.todayDeliveries || [];
  const todayPickups = dashboardData?.todayPickups || [];

  const [activeOperationalTab, setActiveOperationalTab] = useState('deliveries'); // 'deliveries' | 'pickups'
  const [selectedPhotoOrder, setSelectedPhotoOrder] = useState(null);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const handleLogout = async () => {
    setSignOutModalVisible(false);
    await authService.logout();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge label="Pending" variant="warning" size="sm" />;
      case 'picked_up':
        return <Badge label="Picked Up" variant="info" size="sm" />;
      case 'in_progress':
        return <Badge label="Processing" variant="info" size="sm" />;
      case 'ready':
        return <Badge label="Ready" variant="success" size="sm" />;
      case 'out_for_delivery':
        return <Badge label="Out for Delivery" variant="warning" size="sm" />;
      case 'delivered':
        return <Badge label="Delivered" variant="success" size="sm" />;
      case 'cancelled':
        return <Badge label="Cancelled" variant="error" size="sm" />;
      default:
        return <Badge label={status || 'Unknown'} variant="neutral" size="sm" />;
    }
  };

  if (isLoading && !isRefetching) {
    return (
      <ScreenContainer style={styles.centerContainer}>
        <Loader size="large" />
        <Text variant="body" colorVariant="secondary" style={{ marginTop: spacing.md }}>
          Loading store operations...
        </Text>
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer style={styles.centerContainer}>
        <ErrorState
          title="Could not load dashboard"
          message={error?.message || 'Failed to fetch operational data.'}
          onRetry={refetch}
        />
      </ScreenContainer>
    );
  }

  const attentionOrdersCount = (stats.pendingOrders || 0) + (stats.inProgressOrders || 0);

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Top Header Bar */}
        <View
          style={[
            styles.headerBar,
            { backgroundColor: colors.surface, borderBottomColor: colors.borderLight },
          ]}
        >
          <View style={styles.headerTitleArea}>
            <View style={styles.storeBadgeRow}>
              <Badge label="STORE ACTIVE" variant="success" size="sm" />
              <Text variant="caption" colorVariant="muted" style={{ marginLeft: spacing.xs }}>
                Realtime Sync
              </Text>
            </View>
            <Text variant="h2" weight="bold" colorVariant="primary" style={{ marginTop: 2 }}>
              {user?.name || 'Store Owner'}
            </Text>
            <Text variant="caption" colorVariant="secondary">
              {user?.email || 'admin@laundryflow.com'}
            </Text>
          </View>

          <Button
            title="Sign Out"
            variant="outline"
            size="sm"
            onPress={() => setSignOutModalVisible(true)}
            style={styles.signOutBtn}
          />
        </View>

        <View style={styles.body}>
          {/* Attention Banner (if pending orders exist) */}
          {attentionOrdersCount > 0 && (
            <Card
              variant="flat"
              style={[
                styles.attentionCard,
                { backgroundColor: colors.status.warningBackground || '#FEF3C7', borderColor: colors.status.warning || '#D97706' },
              ]}
            >
              <View style={styles.attentionRow}>
                <Text style={styles.attentionIcon}>⚡</Text>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text variant="subtitle" weight="bold" style={{ color: colors.status.warning || '#B45309' }}>
                    {attentionOrdersCount} Order{attentionOrdersCount > 1 ? 's' : ''} Require Attention
                  </Text>
                  <Text variant="caption" style={{ color: colors.status.warning || '#92400E', marginTop: 2 }}>
                    {stats.pendingOrders || 0} pending pickup & {stats.inProgressOrders || 0} in processing.
                  </Text>
                </View>
                <Button
                  title="View"
                  size="sm"
                  variant="primary"
                  onPress={() => navigation.navigate('Orders', { status: 'pending' })}
                  style={{ minWidth: 64 }}
                />
              </View>
            </Card>
          )}

          {/* Operational Metrics Grid */}
          <Text variant="title" weight="bold" colorVariant="primary" style={{ marginBottom: spacing.sm }}>
            Today's Overview
          </Text>

          <View style={styles.metricsGrid}>
            <Card
              variant="elevated"
              style={[styles.metricCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Orders', { status: 'all', todayOnly: true, timestamp: Date.now() })}
            >
              <Text variant="caption" colorVariant="secondary">Total Orders</Text>
              <Text variant="h2" weight="bold" colorVariant="primary" style={{ marginVertical: spacing.xs }}>
                {stats.todayTotalOrders ?? stats.totalOrders ?? 0}
              </Text>
              <Text variant="caption" colorVariant="muted">Today's total volume</Text>
            </Card>

            <Card
              variant="elevated"
              style={[styles.metricCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Orders', { status: 'pending', todayOnly: true, timestamp: Date.now() })}
            >
              <Text variant="caption" colorVariant="secondary">Pending Pickup</Text>
              <Text variant="h2" weight="bold" style={{ color: colors.status.warning || '#D97706', marginVertical: spacing.xs }}>
                {stats.todayPendingOrders ?? stats.pendingOrders ?? 0}
              </Text>
              <Text variant="caption" colorVariant="muted">Awaiting pickup</Text>
            </Card>

            <Card
              variant="elevated"
              style={[styles.metricCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Orders', { status: 'in_progress', todayOnly: true, timestamp: Date.now() })}
            >
              <Text variant="caption" colorVariant="secondary">Processing</Text>
              <Text variant="h2" weight="bold" style={{ color: colors.primary, marginVertical: spacing.xs }}>
                {stats.todayInProgressOrders ?? stats.inProgressOrders ?? 0}
              </Text>
              <Text variant="caption" colorVariant="muted">In wash / iron</Text>
            </Card>

            <Card
              variant="elevated"
              style={[styles.metricCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Orders', { status: 'ready', todayOnly: true, timestamp: Date.now() })}
            >
              <Text variant="caption" colorVariant="secondary">Ready</Text>
              <Text variant="h2" weight="bold" style={{ color: '#0284C7', marginVertical: spacing.xs }}>
                {stats.todayReadyOrders ?? stats.readyOrders ?? 0}
              </Text>
              <Text variant="caption" colorVariant="muted">Ready for pickup</Text>
            </Card>

            <Card
              variant="elevated"
              style={[styles.metricCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Orders', { status: 'out_for_delivery', todayOnly: true, timestamp: Date.now() })}
            >
              <Text variant="caption" colorVariant="secondary">Out for Delivery</Text>
              <Text variant="h2" weight="bold" style={{ color: '#D97706', marginVertical: spacing.xs }}>
                {stats.todayOutForDeliveryOrders ?? stats.outForDeliveryOrders ?? 0}
              </Text>
              <Text variant="caption" colorVariant="muted">En route to customer</Text>
            </Card>

            <Card
              variant="elevated"
              style={[styles.metricCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Orders', { status: 'delivered', todayOnly: true, timestamp: Date.now() })}
            >
              <Text variant="caption" colorVariant="secondary">Delivered</Text>
              <Text variant="h2" weight="bold" style={{ color: colors.status.success || '#16A34A', marginVertical: spacing.xs }}>
                {stats.todayDeliveredOrders ?? stats.deliveredOrders ?? 0}
              </Text>
              <Text variant="caption" colorVariant="muted">Completed today</Text>
            </Card>

            <Card
              variant="elevated"
              style={[styles.metricCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Orders', { status: 'cancelled', todayOnly: true, timestamp: Date.now() })}
            >
              <Text variant="caption" colorVariant="secondary">Cancelled</Text>
              <Text variant="h2" weight="bold" style={{ color: colors.status.error || '#EF4444', marginVertical: spacing.xs }}>
                {stats.todayCancelledOrders ?? stats.cancelledOrders ?? 0}
              </Text>
              <Text variant="caption" colorVariant="muted">Cancelled today</Text>
            </Card>
          </View>

          {/* Revenue & Services Summary */}
          <Card variant="elevated" style={[styles.revenueCard, { backgroundColor: colors.surface }]}>
            <View style={styles.revenueHeader}>
              <View>
                <Text variant="caption" colorVariant="secondary">Net Laundry Revenue</Text>
                <Text variant="h2" weight="bold" style={{ color: colors.status.success || '#16A34A', marginTop: 4 }}>
                  ₹{(stats.totalRevenue ?? 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="caption" colorVariant="secondary">Active Catalog</Text>
                <Text variant="subtitle" weight="bold" colorVariant="primary" style={{ marginTop: 4 }}>
                  {stats.totalServices ?? 0} Services
                </Text>
              </View>
            </View>
          </Card>

          {/* Quick Action Shortcuts */}
          <Text variant="title" weight="bold" colorVariant="primary" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
            Quick Operations
          </Text>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => navigation.navigate('AdminAddEditService')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionIcon}>➕</Text>
              <Text variant="caption" weight="bold" colorVariant="primary">Add Service</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => navigation.navigate('Orders')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionIcon}>📦</Text>
              <Text variant="caption" weight="bold" colorVariant="primary">Manage Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => navigation.navigate('Delivery')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionIcon}>🛵</Text>
              <Text variant="caption" weight="bold" colorVariant="primary">Delivery Team</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => navigation.navigate('AdminTimeSlots')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionIcon}>🕒</Text>
              <Text variant="caption" weight="bold" colorVariant="primary">Time Slots</Text>
            </TouchableOpacity>
          </View>

          {/* Today's Operational Work Orders: Deliveries & Pickups */}
          <View style={styles.operationalSectionHeader}>
            <View>
              <Text variant="title" weight="bold" colorVariant="primary">
                Today's Action Required
              </Text>
              <Text variant="caption" colorVariant="secondary">
                Orders to deliver & collect today, including pending backlog
              </Text>
            </View>
          </View>

          {/* Operational Tab Switcher */}
          <View style={[styles.operationalTabBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <TouchableOpacity
              style={[
                styles.operationalTabBtn,
                activeOperationalTab === 'deliveries' && { backgroundColor: '#E0F2FE', borderColor: '#0284C7' },
              ]}
              onPress={() => setActiveOperationalTab('deliveries')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16, marginRight: 6 }}>🚚</Text>
              <Text
                variant="buttonSmall"
                weight={activeOperationalTab === 'deliveries' ? 'bold' : 'normal'}
                style={{ color: activeOperationalTab === 'deliveries' ? '#0369A1' : colors.textSecondary }}
              >
                To Deliver ({todayDeliveries.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.operationalTabBtn,
                activeOperationalTab === 'pickups' && { backgroundColor: '#FEF3C7', borderColor: '#D97706' },
              ]}
              onPress={() => setActiveOperationalTab('pickups')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16, marginRight: 6 }}>📦</Text>
              <Text
                variant="buttonSmall"
                weight={activeOperationalTab === 'pickups' ? 'bold' : 'normal'}
                style={{ color: activeOperationalTab === 'pickups' ? '#B45309' : colors.textSecondary }}
              >
                To Collect ({todayPickups.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Orders List for selected operational tab */}
          {activeOperationalTab === 'deliveries' ? (
            todayDeliveries.length === 0 ? (
              <Card variant="flat" style={[styles.emptyOperationalCard, { backgroundColor: colors.surface }]}>
                <Text style={{ fontSize: 28, marginBottom: 6 }}>🎉</Text>
                <Text variant="bodyMedium" weight="semibold" colorVariant="primary" align="center">
                  No orders pending delivery today
                </Text>
                <Text variant="caption" colorVariant="muted" align="center" style={{ marginTop: 2 }}>
                  All orders due for delivery today have been completed or none are scheduled.
                </Text>
              </Card>
            ) : (
              todayDeliveries.map((order) => {
                const customerName = order.user?.name || 'Customer';
                const customerPhone = order.user?.phone || '';
                const orderId = order._id?.slice(-6)?.toUpperCase() || 'ORDER';
                const address =
                  order.deliveryAddress?.fullAddress ||
                  order.deliveryAddressSnapshot?.fullAddress ||
                  order.address ||
                  'Customer delivery address';

                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                const orderScheduleDate = order.scheduledDelivery || order.estimatedDelivery;
                const isOverdue = orderScheduleDate && new Date(orderScheduleDate) < startOfToday;

                return (
                  <Card
                    key={order._id}
                    variant="elevated"
                    style={[
                      styles.operationalCard,
                      {
                        backgroundColor: colors.surface,
                        borderLeftWidth: 4,
                        borderLeftColor: isOverdue ? '#EF4444' : '#0284C7',
                      },
                    ]}
                    onPress={() => navigation.navigate('AdminOrderDetail', { orderId: order._id })}
                  >
                    <View style={styles.operationalCardTop}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text variant="subtitle" weight="bold" colorVariant="primary">
                            #{orderId}
                          </Text>
                          {isOverdue ? (
                            <Badge label="OVERDUE (FROM EARLIER)" variant="error" size="xs" />
                          ) : (
                            <Badge label="DELIVER TODAY" variant="primary" size="xs" />
                          )}
                        </View>
                        <Text variant="bodySmall" weight="bold" colorVariant="primary" style={{ marginTop: 2 }}>
                          {customerName}
                          {Boolean(customerPhone) && ` • ${customerPhone}`}
                        </Text>
                      </View>
                      {getStatusBadge(order.status)}
                    </View>

                    <Text variant="caption" colorVariant="secondary" numberOfLines={2} style={{ marginTop: 6 }}>
                      📍 {address}
                    </Text>

                    {/* Driver & Photo Row */}
                    <View style={styles.operationalMetaRow}>
                      <View style={{ flex: 1 }}>
                        <Text variant="caption" colorVariant="muted">
                          Driver: {order.deliveryPartner?.name || 'Not yet dispatched'}
                        </Text>
                        <Text variant="caption" colorVariant="muted">
                          Bill: ₹{order.totalAmount || 0} ({order.isPaid ? 'PAID' : 'COD'})
                        </Text>
                      </View>

                      {Boolean(order.pickupPhoto?.url) && (
                        <TouchableOpacity
                          style={styles.photoThumbButton}
                          onPress={() => setSelectedPhotoOrder(order)}
                          activeOpacity={0.8}
                        >
                          <Image
                            source={{ uri: order.pickupPhoto.url }}
                            style={styles.photoThumbImage}
                            resizeMode="cover"
                          />
                          <View style={styles.photoThumbBadge}>
                            <Text style={{ fontSize: 9, color: '#FFFFFF', fontWeight: 'bold' }}>📸 PHOTO</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.operationalActionsRow}>
                      {Boolean(customerPhone) && (
                        <TouchableOpacity
                          style={[styles.smallActionBtn, { borderColor: colors.borderLight }]}
                          onPress={() => Linking.openURL(`tel:${customerPhone}`).catch(() => {})}
                        >
                          <Text style={{ fontSize: 12 }}>📞 Call</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.smallActionBtn, { borderColor: '#0284C7', backgroundColor: '#F0F9FF' }]}
                        onPress={() => navigation.navigate('AdminOrderDetail', { orderId: order._id })}
                      >
                        <Text style={{ fontSize: 12, color: '#0284C7', fontWeight: 'bold' }}>Manage Order →</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })
            )
          ) : (
            // Pickups
            todayPickups.length === 0 ? (
              <Card variant="flat" style={[styles.emptyOperationalCard, { backgroundColor: colors.surface }]}>
                <Text style={{ fontSize: 28, marginBottom: 6 }}>🎉</Text>
                <Text variant="bodyMedium" weight="semibold" colorVariant="primary" align="center">
                  No pickups pending today
                </Text>
                <Text variant="caption" colorVariant="muted" align="center" style={{ marginTop: 2 }}>
                  All orders for collection today have been collected or none are scheduled.
                </Text>
              </Card>
            ) : (
              todayPickups.map((order) => {
                const customerName = order.user?.name || 'Customer';
                const customerPhone = order.user?.phone || '';
                const orderId = order._id?.slice(-6)?.toUpperCase() || 'ORDER';
                const address =
                  order.pickupAddress?.fullAddress ||
                  order.pickupAddressSnapshot?.fullAddress ||
                  order.address ||
                  'Customer pickup address';

                const timeSlotLabel = order.scheduledPickup?.timeSlot?.label || '';

                return (
                  <Card
                    key={order._id}
                    variant="elevated"
                    style={[
                      styles.operationalCard,
                      {
                        backgroundColor: colors.surface,
                        borderLeftWidth: 4,
                        borderLeftColor: '#D97706',
                      },
                    ]}
                    onPress={() => navigation.navigate('AdminOrderDetail', { orderId: order._id })}
                  >
                    <View style={styles.operationalCardTop}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text variant="subtitle" weight="bold" colorVariant="primary">
                            #{orderId}
                          </Text>
                          <Badge label="COLLECT FROM CUSTOMER" variant="warning" size="xs" />
                        </View>
                        <Text variant="bodySmall" weight="bold" colorVariant="primary" style={{ marginTop: 2 }}>
                          {customerName}
                          {Boolean(customerPhone) && ` • ${customerPhone}`}
                        </Text>
                      </View>
                      {getStatusBadge(order.status)}
                    </View>

                    <Text variant="caption" colorVariant="secondary" numberOfLines={2} style={{ marginTop: 6 }}>
                      📍 {address}
                    </Text>

                    <View style={styles.operationalMetaRow}>
                      <View style={{ flex: 1 }}>
                        <Text variant="caption" colorVariant="muted">
                          Slot: {timeSlotLabel || 'Today'}
                        </Text>
                        <Text variant="caption" colorVariant="muted">
                          Driver: {order.deliveryPartner?.name || 'Awaiting assignment'}
                        </Text>
                      </View>

                      {Boolean(order.pickupPhoto?.url) && (
                        <TouchableOpacity
                          style={styles.photoThumbButton}
                          onPress={() => setSelectedPhotoOrder(order)}
                          activeOpacity={0.8}
                        >
                          <Image
                            source={{ uri: order.pickupPhoto.url }}
                            style={styles.photoThumbImage}
                            resizeMode="cover"
                          />
                          <View style={styles.photoThumbBadge}>
                            <Text style={{ fontSize: 9, color: '#FFFFFF', fontWeight: 'bold' }}>📸 PHOTO</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.operationalActionsRow}>
                      {Boolean(customerPhone) && (
                        <TouchableOpacity
                          style={[styles.smallActionBtn, { borderColor: colors.borderLight }]}
                          onPress={() => Linking.openURL(`tel:${customerPhone}`).catch(() => {})}
                        >
                          <Text style={{ fontSize: 12 }}>📞 Call</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.smallActionBtn, { borderColor: '#D97706', backgroundColor: '#FFFBEB' }]}
                        onPress={() => navigation.navigate('AdminOrderDetail', { orderId: order._id })}
                      >
                        <Text style={{ fontSize: 12, color: '#B45309', fontWeight: 'bold' }}>Dispatch / Manage →</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })
            )
          )}

          {/* Recent Orders List */}
          <View style={styles.recentOrdersHeader}>
            <Text variant="title" weight="bold" colorVariant="primary">
              Recent Orders
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')} activeOpacity={0.7}>
              <Text variant="caption" weight="bold" style={{ color: colors.primary }}>
                View All →
              </Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <Card variant="flat" style={[styles.emptyOrdersCard, { backgroundColor: colors.surface }]}>
              <Text variant="body" colorVariant="muted" align="center">
                No orders placed yet. New orders will appear here automatically.
              </Text>
            </Card>
          ) : (
            recentOrders.map((order) => {
              const customerName = order.user?.name || 'Customer';
              const itemsCount = order.services?.length || 0;
              const orderId = order._id?.slice(-6)?.toUpperCase() || 'ORDER';

              return (
                <Card
                  key={order._id}
                  variant="elevated"
                  style={[styles.orderItemCard, { backgroundColor: colors.surface }]}
                  onPress={() => navigation.navigate('AdminOrderDetail', { orderId: order._id })}
                >
                  <View style={styles.orderItemTop}>
                    <View>
                      <Text variant="subtitle" weight="bold" colorVariant="primary">
                        #{orderId}
                      </Text>
                      <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
                        {customerName} • {itemsCount} service{itemsCount > 1 ? 's' : ''}
                      </Text>
                    </View>
                    {getStatusBadge(order.status)}
                  </View>

                  <Divider style={{ marginVertical: spacing.xs }} />

                  <View style={styles.orderItemBottom}>
                    <Text variant="caption" colorVariant="muted">
                      {order.scheduledPickup?.date
                        ? new Date(order.scheduledPickup.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'Today'}
                      {order.scheduledPickup?.timeSlot?.label
                        ? ` (${order.scheduledPickup.timeSlot.label})`
                        : ''}
                    </Text>

                    <Text variant="subtitle" weight="bold" colorVariant="primary">
                      ₹{order.totalAmount || 0}
                    </Text>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={signOutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSignOutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text variant="h3" weight="bold" colorVariant="primary" style={{ textAlign: 'center' }}>
              Sign out?
            </Text>
            <Text
              variant="body"
              colorVariant="secondary"
              style={{ textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg }}
            >
              Are you sure you want to sign out?
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

      {/* Pickup Photo Identification Modal for Laundry Admin */}
      <Modal
        visible={Boolean(selectedPhotoOrder)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhotoOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.photoModalCard, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text variant="title" weight="bold" colorVariant="primary">
                  Order #{selectedPhotoOrder?._id?.slice(-6)?.toUpperCase()}
                </Text>
                <Text variant="caption" colorVariant="secondary">
                  Customer Pickup Bag Photo
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPhotoOrder(null)} style={{ padding: 6 }}>
                <Text style={{ fontSize: 20, color: colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>

            {Boolean(selectedPhotoOrder?.pickupPhoto?.url) && (
              <Image
                source={{ uri: selectedPhotoOrder.pickupPhoto.url }}
                style={styles.fullModalPhoto}
                resizeMode="contain"
              />
            )}

            <View style={{ marginTop: 12, gap: 4 }}>
              <Text variant="caption" colorVariant="secondary">
                Customer: <Text weight="bold">{selectedPhotoOrder?.user?.name || 'Customer'}</Text>
              </Text>
              <Text variant="caption" colorVariant="secondary">
                Delivery Agent: <Text weight="bold">{selectedPhotoOrder?.deliveryPartner?.name || 'Assigned Partner'}</Text>
              </Text>
              {Boolean(selectedPhotoOrder?.pickupPhoto?.uploadedAt) && (
                <Text variant="caption" colorVariant="muted">
                  Captured at: {new Date(selectedPhotoOrder.pickupPhoto.uploadedAt).toLocaleString()}
                </Text>
              )}
            </View>

            <Button
              title="Close"
              variant="outline"
              size="md"
              fullWidth
              onPress={() => setSelectedPhotoOrder(null)}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleArea: {
    flex: 1,
    paddingRight: 12,
  },
  storeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  signOutBtn: {
    paddingHorizontal: 12,
  },
  body: {
    padding: 16,
  },
  attentionCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attentionIcon: {
    fontSize: 22,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  revenueCard: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionBtn: {
    width: '23%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  recentOrdersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyOrdersCard: {
    padding: 24,
    borderRadius: 10,
  },
  orderItemCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  orderItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalBtnRow: {
    flexDirection: 'row',
  },
  operationalSectionHeader: {
    marginBottom: 10,
    marginTop: 8,
  },
  operationalTabBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    gap: 6,
  },
  operationalTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emptyOperationalCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  operationalCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  operationalCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  operationalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  photoThumbButton: {
    width: 58,
    height: 58,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#0284C7',
    position: 'relative',
    marginLeft: 10,
  },
  photoThumbImage: {
    width: '100%',
    height: '100%',
  },
  photoThumbBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(2, 132, 199, 0.85)',
    paddingVertical: 1,
    alignItems: 'center',
  },
  operationalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  smallActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  fullModalPhoto: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    backgroundColor: '#0F172A',
  },
});

export default AdminHomeScreen;
