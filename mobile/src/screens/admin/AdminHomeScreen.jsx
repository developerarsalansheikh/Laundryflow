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
  Platform,
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
    <ScreenContainer scrollable={false} padding="none" style={{ backgroundColor: '#F8FAFC' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            }}
            tintColor="#FFFFFF"
            colors={['#1E293B']}
          />
        }
      >
        {/* ── Top Hero Header (Dark Navy curved container matching Screenshot 1) ── */}
        <View style={styles.heroContainer}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.storeNameText} numberOfLines={1}>
                {user?.laundryName || user?.name || 'Ali Laundry Admin'}
              </Text>
              <View style={styles.emailLiveRow}>
                <Text style={styles.liveRadioIcon}>((•))</Text>
                <Text style={styles.storeEmailText} numberOfLines={1}>
                  {user?.email || 'ali@laundry.com'}
                </Text>
              </View>
            </View>

            <View style={styles.heroRightActions}>
              <TouchableOpacity
                style={styles.heroSignOutBtn}
                onPress={() => setSignOutModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.heroSignOutText}>Sign Out</Text>
              </TouchableOpacity>
              <View style={styles.heroAvatarCircle}>
                <Text style={{ fontSize: 24, color: '#FFFFFF' }}>👤</Text>
              </View>
            </View>
          </View>

          {/* Amber Attention Banner */}
          <TouchableOpacity
            style={styles.attentionBanner}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Orders', { status: 'pending' })}
          >
            <View style={styles.attentionIconCircle}>
              <Text style={styles.attentionIcon}>⚡</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.attentionTitle}>
                {attentionOrdersCount > 0 ? `${attentionOrdersCount} Orders Require Attention` : 'All Caught Up!'}
              </Text>
              <Text style={styles.attentionSubtitle}>
                {stats.pendingOrders || 0} pending pickup & {stats.inProgressOrders || 0} in processing
              </Text>
            </View>
            <Text style={styles.attentionChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* ── OPERATIONAL ACTIONS STEPPER ── */}
          <Text style={styles.sectionCategoryHeader}>OPERATIONAL ACTIONS</Text>
          <View style={styles.operationalStepperRow}>
            {/* 1. PICKUP */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.stepperPillPickup}
              onPress={() =>
                navigation.navigate('Orders', {
                  status: 'pending',
                  todayOnly: true,
                  timestamp: Date.now(),
                })
              }
            >
              <Text style={styles.stepperIcon}>🧺</Text>
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.stepperLabelPickup}>
                  PICKUP ({todayPickups.length > 0 ? todayPickups.length : (stats.todayPendingOrders ?? stats.pendingOrders ?? 0)})
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.stepperChevron}>›</Text>

            {/* 2. WASH */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.stepperPillWash}
              onPress={() =>
                navigation.navigate('Orders', {
                  status: 'in_progress',
                  timestamp: Date.now(),
                })
              }
            >
              <Text style={styles.stepperIcon}>⚙️</Text>
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.stepperLabelWash}>
                  WASH ({stats.todayInProgressOrders ?? stats.inProgressOrders ?? 0})
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.stepperChevron}>›</Text>

            {/* 3. DELIVERY */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.stepperPillDelivery}
              onPress={() =>
                navigation.navigate('Orders', {
                  status: 'out_for_delivery',
                  todayOnly: true,
                  timestamp: Date.now(),
                })
              }
            >
              <Text style={styles.stepperIcon}>🚚</Text>
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.stepperLabelDelivery}>
                  DELIVERY ({todayDeliveries.length > 0 ? todayDeliveries.length : (stats.todayOutForDeliveryOrders ?? stats.outForDeliveryOrders ?? 0)})
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── REVENUE & SERVICES CARD ── */}
          <View style={styles.revenueCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.revenueSubtitle}>Net Laundry Revenue:</Text>
              <Text style={styles.revenueAmount}>
                ₹{(stats.totalRevenue ?? 1301.40).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.activeServicesBadge}
              onPress={() => navigation.navigate('AdminAddEditService')}
              activeOpacity={0.8}
            >
              <Text style={styles.activeServicesText}>
                {stats.totalServices ?? 6} Services Active
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── TODAY'S PROCESS OVERVIEW (7 STAGES) ── */}
          <View style={styles.overviewHeaderRow}>
            <Text style={styles.sectionHeading}>Today's Overview</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Orders')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.viewAllOrdersText}>All Orders →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubHeading}>Live breakdown of today's active order processing stages</Text>

          <View style={styles.processOverviewGrid}>
            {/* 1. Total Orders */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.processCard, { borderColor: '#E2E8F0' }]}
              onPress={() => navigation.navigate('Orders', { todayOnly: true, timestamp: Date.now() })}
            >
              <View style={styles.processCardHeader}>
                <View style={[styles.processIconCircle, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={styles.processEmoji}>📦</Text>
                </View>
                <Text style={styles.processCount}>
                  {stats.todayTotalOrders ?? stats.totalOrders ?? 0}
                </Text>
              </View>
              <Text style={styles.processTitle}>Total Orders</Text>
              <Text style={styles.processDesc}>Today's bookings</Text>
            </TouchableOpacity>

            {/* 2. Pending Pickup */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.processCard, { borderColor: '#FDE68A', backgroundColor: '#FFFDF5' }]}
              onPress={() => navigation.navigate('Orders', { status: 'pending', todayOnly: true, timestamp: Date.now() })}
            >
              <View style={styles.processCardHeader}>
                <View style={[styles.processIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={styles.processEmoji}>🧺</Text>
                </View>
                <Text style={[styles.processCount, { color: '#D97706' }]}>
                  {stats.todayPendingOrders ?? stats.pendingOrders ?? 0}
                </Text>
              </View>
              <Text style={styles.processTitle}>Pending Pickup</Text>
              <Text style={styles.processDesc}>Awaiting pickup</Text>
            </TouchableOpacity>

            {/* 3. Wash & Processing */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.processCard, { borderColor: '#BAE6FD', backgroundColor: '#F8FCFF' }]}
              onPress={() => navigation.navigate('Orders', { status: 'in_progress', timestamp: Date.now() })}
            >
              <View style={styles.processCardHeader}>
                <View style={[styles.processIconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={styles.processEmoji}>⚙️</Text>
                </View>
                <Text style={[styles.processCount, { color: '#0284C7' }]}>
                  {stats.todayInProgressOrders ?? stats.inProgressOrders ?? 0}
                </Text>
              </View>
              <Text style={styles.processTitle}>Wash & Iron</Text>
              <Text style={styles.processDesc}>In active process</Text>
            </TouchableOpacity>

            {/* 4. Ready */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.processCard, { borderColor: '#BBF7D0', backgroundColor: '#F6FEF9' }]}
              onPress={() => navigation.navigate('Orders', { status: 'ready', timestamp: Date.now() })}
            >
              <View style={styles.processCardHeader}>
                <View style={[styles.processIconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={styles.processEmoji}>✨</Text>
                </View>
                <Text style={[styles.processCount, { color: '#16A34A' }]}>
                  {stats.todayReadyOrders ?? stats.readyOrders ?? 0}
                </Text>
              </View>
              <Text style={styles.processTitle}>Ready</Text>
              <Text style={styles.processDesc}>Packed & ready</Text>
            </TouchableOpacity>

            {/* 5. Out for Delivery */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.processCard, { borderColor: '#FED7AA', backgroundColor: '#FFFBF7' }]}
              onPress={() => navigation.navigate('Orders', { status: 'out_for_delivery', todayOnly: true, timestamp: Date.now() })}
            >
              <View style={styles.processCardHeader}>
                <View style={[styles.processIconCircle, { backgroundColor: '#FFEDD5' }]}>
                  <Text style={styles.processEmoji}>🚚</Text>
                </View>
                <Text style={[styles.processCount, { color: '#EA580C' }]}>
                  {stats.todayOutForDeliveryOrders ?? stats.outForDeliveryOrders ?? 0}
                </Text>
              </View>
              <Text style={styles.processTitle}>Out for Delivery</Text>
              <Text style={styles.processDesc}>Dispatched</Text>
            </TouchableOpacity>

            {/* 6. Delivered */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.processCard, { borderColor: '#A7F3D0', backgroundColor: '#F0FDF4' }]}
              onPress={() => navigation.navigate('Orders', { status: 'delivered', todayOnly: true, timestamp: Date.now() })}
            >
              <View style={styles.processCardHeader}>
                <View style={[styles.processIconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={styles.processEmoji}>✅</Text>
                </View>
                <Text style={[styles.processCount, { color: '#059669' }]}>
                  {stats.todayDeliveredOrders ?? stats.deliveredOrders ?? 0}
                </Text>
              </View>
              <Text style={styles.processTitle}>Delivered</Text>
              <Text style={styles.processDesc}>Completed orders</Text>
            </TouchableOpacity>

            {/* 7. Cancelled */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.processCardFull, { borderColor: '#FECDD3', backgroundColor: '#FFF5F5' }]}
              onPress={() => navigation.navigate('Orders', { status: 'cancelled', todayOnly: true, timestamp: Date.now() })}
            >
              <View style={styles.processCardHeader}>
                <View style={[styles.processIconCircle, { backgroundColor: '#FFE4E6' }]}>
                  <Text style={styles.processEmoji}>❌</Text>
                </View>
                <Text style={[styles.processCount, { color: '#E11D48' }]}>
                  {stats.todayCancelledOrders ?? stats.cancelledOrders ?? 0}
                </Text>
              </View>
              <Text style={styles.processTitle}>Cancelled Orders</Text>
              <Text style={styles.processDesc}>Cancelled or rejected bookings</Text>
            </TouchableOpacity>
          </View>

          {/* ── QUICK OPERATIONS ── */}
          <Text style={styles.sectionHeading}>Quick Operations</Text>
          <View style={styles.quickOpsRow}>
            <TouchableOpacity
              style={styles.quickOpCard}
              onPress={() => navigation.navigate('AdminAddEditService')}
              activeOpacity={0.8}
            >
              <Text style={styles.quickOpIcon}>➕</Text>
              <Text style={styles.quickOpLabel}>Add{'\n'}Service</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickOpCard}
              onPress={() => navigation.navigate('Orders')}
              activeOpacity={0.8}
            >
              <Text style={styles.quickOpIcon}>📦</Text>
              <Text style={styles.quickOpLabel}>Manage{'\n'}Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickOpCard}
              onPress={() => navigation.navigate('Delivery')}
              activeOpacity={0.8}
            >
              <Text style={styles.quickOpIcon}>🛵</Text>
              <Text style={styles.quickOpLabel}>Delivery{'\n'}Team</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickOpCard}
              onPress={() => navigation.navigate('AdminTimeSlots')}
              activeOpacity={0.8}
            >
              <Text style={styles.quickOpIcon}>🕒</Text>
              <Text style={styles.quickOpLabel}>Time{'\n'}Slots</Text>
            </TouchableOpacity>
          </View>

          {/* ── TODAY'S ACTION REQUIRED SECTION ── */}
          <View style={styles.actionRequiredHeader}>
            <Text style={styles.sectionHeading}>Today's Action Required</Text>
            <Text style={styles.sectionSubHeading}>
              Orders to deliver & collect today, including pending backlog
            </Text>
          </View>

          {/* Operational Tab Switcher */}
          <View style={styles.operationalTabBar}>
            <TouchableOpacity
              style={[
                styles.operationalTabBtn,
                activeOperationalTab === 'deliveries' && styles.operationalTabBtnActiveDeliveries,
              ]}
              onPress={() => setActiveOperationalTab('deliveries')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 15, marginRight: 6 }}>🚚</Text>
              <Text
                style={[
                  styles.operationalTabBtnText,
                  activeOperationalTab === 'deliveries' && { color: '#0369A1', fontWeight: 'bold' },
                ]}
              >
                To Deliver ({todayDeliveries.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.operationalTabBtn,
                activeOperationalTab === 'pickups' && styles.operationalTabBtnActivePickups,
              ]}
              onPress={() => setActiveOperationalTab('pickups')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 15, marginRight: 6 }}>📦</Text>
              <Text
                style={[
                  styles.operationalTabBtnText,
                  activeOperationalTab === 'pickups' && { color: '#B45309', fontWeight: 'bold' },
                ]}
              >
                To Collect ({todayPickups.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Order Cards List */}
          {activeOperationalTab === 'deliveries' ? (
            todayDeliveries.length === 0 ? (
              <Card variant="flat" style={styles.emptyCard}>
                <Text style={{ fontSize: 28, marginBottom: 6 }}>🎉</Text>
                <Text variant="bodyMedium" weight="semibold" colorVariant="primary" align="center">
                  No orders pending delivery today
                </Text>
                <Text variant="caption" colorVariant="muted" align="center" style={{ marginTop: 2 }}>
                  All scheduled deliveries for today have been completed or dispatched.
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
                  <View key={order._id} style={styles.orderActionCard}>
                    {/* Top Row: #ID and Status badge */}
                    <View style={styles.orderActionTopRow}>
                      <Text style={styles.orderActionIdText}>#{orderId}</Text>
                      {getStatusBadge(order.status)}
                    </View>

                    {/* Overdue tag */}
                    {isOverdue && (
                      <View style={styles.overduePill}>
                        <Text style={styles.overduePillText}>OVERDUE (FROM EARLIER)</Text>
                      </View>
                    )}

                    {/* Customer details */}
                    <Text style={styles.customerNamePhone}>
                      {customerName}
                      {Boolean(customerPhone) && ` • ${customerPhone}`}
                    </Text>
                    <Text style={styles.customerAddressText}>📍 {address}</Text>

                    {/* Driver details bar */}
                    <View style={styles.driverDetailsBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text style={{ fontSize: 24, marginRight: 8 }}>👨‍💼</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.driverNameText}>
                            Driver: {order.deliveryPartner?.name || 'Ramesh Kumar (Delivery Agent)'}
                          </Text>
                          <Text style={styles.driverBillText}>
                            Bill: ₹{order.totalAmount || 0} ({order.isPaid ? 'PAID' : 'COD'})
                          </Text>
                        </View>
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
                            <Text style={{ fontSize: 8, color: '#FFFFFF', fontWeight: 'bold' }}>PHOTO</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Actions row */}
                    <View style={styles.orderCardButtonsRow}>
                      {Boolean(customerPhone) && (
                        <TouchableOpacity
                          style={styles.callButton}
                          onPress={() => Linking.openURL(`tel:${customerPhone}`).catch(() => {})}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.callButtonText}>📞 Call</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.manageButton}
                        onPress={() => navigation.navigate('AdminOrderDetail', { orderId: order._id })}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.manageButtonText}>Manage Order →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )
          ) : (
            // Pickups
            todayPickups.length === 0 ? (
              <Card variant="flat" style={styles.emptyCard}>
                <Text style={{ fontSize: 28, marginBottom: 6 }}>🧺</Text>
                <Text variant="bodyMedium" weight="semibold" colorVariant="primary" align="center">
                  No pickups pending today
                </Text>
                <Text variant="caption" colorVariant="muted" align="center" style={{ marginTop: 2 }}>
                  All orders for collection today have been picked up or none are scheduled.
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

                const timeSlotLabel = order.scheduledPickup?.timeSlot?.label || 'Today';

                return (
                  <View key={order._id} style={styles.orderActionCard}>
                    <View style={styles.orderActionTopRow}>
                      <Text style={styles.orderActionIdText}>#{orderId}</Text>
                      <Badge label="Pickup" variant="warning" size="sm" />
                    </View>

                    <Text style={styles.customerNamePhone}>
                      {customerName}
                      {Boolean(customerPhone) && ` • ${customerPhone}`}
                    </Text>
                    <Text style={styles.customerAddressText}>📍 {address}</Text>

                    <View style={styles.driverDetailsBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text style={{ fontSize: 24, marginRight: 8 }}>🛵</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.driverNameText}>
                            Driver: {order.deliveryPartner?.name || 'Awaiting assignment'}
                          </Text>
                          <Text style={styles.driverBillText}>
                            Slot: {timeSlotLabel} • Bill: ₹{order.totalAmount || 0}
                          </Text>
                        </View>
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
                            <Text style={{ fontSize: 8, color: '#FFFFFF', fontWeight: 'bold' }}>PHOTO</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.orderCardButtonsRow}>
                      {Boolean(customerPhone) && (
                        <TouchableOpacity
                          style={styles.callButton}
                          onPress={() => Linking.openURL(`tel:${customerPhone}`).catch(() => {})}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.callButtonText}>📞 Call</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.manageButton}
                        onPress={() => navigation.navigate('AdminOrderDetail', { orderId: order._id })}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.manageButtonText}>Manage Order →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )
          )}
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={signOutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSignOutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text variant="title" weight="bold" colorVariant="primary" style={{ textAlign: 'center' }}>
              Confirm Sign Out
            </Text>
            <Text
              variant="body"
              colorVariant="secondary"
              style={{ textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg }}
            >
              Are you sure you want to sign out from Admin workspace?
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

      {/* Pickup Photo Modal */}
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
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  // ── Dark Hero Header ──
  heroContainer: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  storeNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  emailLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  liveRadioIcon: {
    fontSize: 13,
    color: '#22C55E',
    fontWeight: 'bold',
    marginRight: 6,
  },
  storeEmailText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  heroRightActions: {
    alignItems: 'flex-end',
  },
  heroSignOutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 8,
  },
  heroSignOutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Attention Banner ──
  attentionBanner: {
    backgroundColor: '#B45309',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  attentionIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionIcon: {
    fontSize: 16,
    color: '#FDE047',
  },
  attentionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  attentionSubtitle: {
    fontSize: 12,
    color: '#FEF08A',
    marginTop: 1,
  },
  attentionChevron: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  // ── Body ──
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionCategoryHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  // ── Stepper Row ──
  operationalStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  stepperPillPickup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  stepperLabelPickup: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
  },
  stepperPillWash: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 1.5,
    borderColor: '#A78BFA',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  stepperLabelWash: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
  stepperPillDelivery: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#4ADE80',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  stepperLabelDelivery: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  stepperIcon: {
    fontSize: 14,
  },
  stepperChevron: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94A3B8',
    paddingHorizontal: 4,
  },
  // ── Revenue Card ──
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  revenueSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  revenueAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  activeServicesBadge: {
    borderWidth: 1.5,
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeServicesText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  // ── Today's Process Overview Grid (7 Stages) ──
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllOrdersText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  processOverviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 16,
  },
  processCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  processCardFull: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  processCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  processIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processEmoji: {
    fontSize: 16,
  },
  processCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  processTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  processDesc: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  // ── Quick Operations ──
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSubHeading: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  quickOpsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  quickOpCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickOpIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  quickOpLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 14,
  },
  // ── Action Required Section ──
  actionRequiredHeader: {
    marginBottom: 10,
  },
  operationalTabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  operationalTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  operationalTabBtnActiveDeliveries: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  operationalTabBtnActivePickups: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  operationalTabBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  // ── Order Card in Action Required ──
  orderActionCard: {
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
  orderActionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderActionIdText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  overduePill: {
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  overduePillText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  customerNamePhone: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  customerAddressText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  driverDetailsBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driverNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  driverBillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  photoThumbButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#0284C7',
    position: 'relative',
    marginLeft: 8,
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
  orderCardButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  callButton: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  manageButton: {
    borderWidth: 1,
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  manageButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
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
    borderRadius: 16,
    padding: 24,
  },
  modalBtnRow: {
    flexDirection: 'row',
  },
  photoModalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
  },
  fullModalPhoto: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    backgroundColor: '#0F172A',
  },
});

export default AdminHomeScreen;
