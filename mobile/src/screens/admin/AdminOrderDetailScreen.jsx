import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  TextInput,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { adminService } from '../../services/adminService';
import { socketService } from '../../services/socketService';

// RN-2 UI Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Divider from '../../components/ui/Divider';
import Loader from '../../components/ui/Loader';
import ErrorState from '../../components/ui/ErrorState';

export const AdminOrderDetailScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { orderId } = route.params || {};

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch Order Query
  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: () => adminService.getOrderById(orderId),
    enabled: Boolean(orderId),
  });

  // Fetch Nearby Eligible Delivery Partners Query (for assignment)
  const {
    data: nearbyDrivers = [],
    isLoading: isNearbyLoading,
    isError: isNearbyError,
    error: nearbyError,
    refetch: refetchNearby,
  } = useQuery({
    queryKey: ['admin-nearby-drivers', orderId],
    queryFn: () => adminService.getNearbyDrivers(orderId),
    enabled: Boolean(orderId) && assignModalVisible,
  });

  // Real-time socket room subscription for Admin Order Detail
  useEffect(() => {
    if (!orderId) return;

    socketService.joinRoom(`order:${orderId}`);

    const unsubStatus = socketService.on('order:statusChanged', (data) => {
      if (data.orderId === orderId) {
        queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      }
    });

    const unsubAssigned = socketService.on('order:assigned', (data) => {
      if (data.orderId === orderId) {
        queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-nearby-drivers', orderId] });
      }
    });

    return () => {
      unsubStatus();
      unsubAssigned();
      socketService.leaveRoom(`order:${orderId}`);
    };
  }, [orderId, queryClient]);

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, message, cancelReason }) =>
      adminService.updateOrderStatus(orderId, { status, message, cancelReason }),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      Alert.alert('Status Updated', `Order status changed to "${updatedOrder.status}" successfully.`);
    },
    onError: (err) => {
      Alert.alert('Update Failed', err.response?.data?.message || err.message || 'Could not update status.');
    },
  });

  // Assign Delivery Partner Mutation
  const assignPartnerMutation = useMutation({
    mutationFn: (partnerId) => adminService.assignDeliveryPartner(orderId, partnerId),
    onSuccess: () => {
      setAssignModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-nearby-drivers', orderId] });
      Alert.alert('Partner Assigned', 'Delivery partner has been assigned to this order.');
    },
    onError: (err) => {
      Alert.alert('Assignment Failed', err.response?.data?.message || err.message || 'Could not assign partner.');
    },
  });

  // Auto Assign Mutation
  const autoAssignMutation = useMutation({
    mutationFn: () => adminService.autoAssignOrder(orderId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-nearby-drivers', orderId] });
      const driverName = res.data?.deliveryPartner?.name || 'Partner';
      Alert.alert('Auto-Assigned', `Order assigned to ${driverName}.`);
    },
    onError: (err) => {
      Alert.alert('Notice', err.response?.data?.message || err.message || 'Auto-assignment unsuccessful.');
    },
  });

  const handleAssignPrompt = (partner) => {
    const isReassign = Boolean(order?.deliveryPartner);
    const distInfo = partner.distance !== null ? ` (~${partner.distance} km away)` : '';
    Alert.alert(
      isReassign ? 'Confirm Reassignment' : 'Confirm Assignment',
      `Assign shared delivery partner "${partner.name}"${distInfo} to order #${orderRef}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isReassign ? 'Reassign' : 'Assign',
          onPress: () => assignPartnerMutation.mutate(partner._id),
        },
      ]
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
      case 'pending_pickup':
      case 'placed':
        return <Badge label="PENDING PICKUP" variant="warning" size="md" />;
      case 'picked_up':
        return <Badge label="PICKED UP (EN ROUTE)" variant="info" size="md" />;
      case 'at_laundry_pending_confirmation':
        return <Badge label="HANDOFF PENDING" variant="warning" size="md" />;
      case 'received_at_laundry':
        return <Badge label="RECEIVED AT STORE" variant="success" size="md" />;
      case 'in_progress':
      case 'processing':
        return <Badge label="PROCESSING (WASH)" variant="info" size="md" />;
      case 'ready':
      case 'ready_for_delivery':
        return <Badge label="READY FOR DELIVERY" variant="success" size="md" />;
      case 'ready_for_redelivery':
        return <Badge label="READY FOR REDELIVERY" variant="warning" size="md" />;
      case 'out_for_delivery':
        return <Badge label="OUT FOR DELIVERY" variant="warning" size="md" />;
      case 'delivery_pending_customer_confirmation':
        return <Badge label="DELIVERY CONFIRMATION PENDING" variant="warning" size="md" />;
      case 'customer_unavailable':
      case 'delivery_failed':
        return <Badge label="CUSTOMER UNAVAILABLE" variant="error" size="md" />;
      case 'returned_to_laundry':
        return <Badge label="RETURNED TO LAUNDRY" variant="error" size="md" />;
      case 'delivered':
        return <Badge label="DELIVERED" variant="success" size="md" />;
      case 'cancelled':
        return <Badge label="CANCELLED" variant="error" size="md" />;
      default:
        return <Badge label={status?.toUpperCase() || 'UNKNOWN'} variant="neutral" size="md" />;
    }
  };

  const handleStatusTransition = (nextStatus, confirmationMsg) => {
    Alert.alert(
      'Confirm Status Change',
      confirmationMsg || `Move order status to "${nextStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateStatusMutation.mutate({ status: nextStatus }),
        },
      ]
    );
  };

  const handleCancelOrder = () => {
    const reason = cancelReason.trim();
    if (!reason) {
      Alert.alert('Reason Required', 'Please provide a cancellation reason before cancelling this order.');
      return;
    }
    updateStatusMutation.mutate(
      { status: 'cancelled', cancelReason: reason },
      {
        onSuccess: () => {
          setCancelModalVisible(false);
          setCancelReason('');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer style={styles.centerContainer}>
        <Loader size="large" />
        <Text variant="body" colorVariant="secondary" style={{ marginTop: spacing.md }}>
          Loading order details...
        </Text>
      </ScreenContainer>
    );
  }

  if (isError || !order) {
    return (
      <ScreenContainer style={styles.centerContainer}>
        <ErrorState
          title="Order Not Found"
          message={error?.message || 'Could not retrieve order details.'}
          onRetry={refetch}
        />
        <Button
          title="Back to Orders"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
        />
      </ScreenContainer>
    );
  }

  const orderRef = order._id?.slice(-6)?.toUpperCase() || 'ORDER';
  const pickupAddress = order.pickupAddress || order.pickupAddressSnapshot;
  const deliveryAddress = order.deliveryAddress || order.deliveryAddressSnapshot;
  const deliveryPartner = order.deliveryPartner;
  const currentStatus = order.status;

  // Calculate driver tracking state
  const getDriverTrackingState = () => {
    if (!deliveryPartner) return null;
    const updatedAt = deliveryPartner.location?.updatedAt;
    if (!updatedAt) return { label: 'OFFLINE', variant: 'neutral', detail: 'No location updates' };
    const diffSec = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000);
    if (diffSec < 60) {
      return { label: 'LIVE', variant: 'success', detail: `Active (${diffSec}s ago)` };
    } else if (diffSec < 120) {
      return { label: 'UPDATING', variant: 'warning', detail: `Updated ${diffSec}s ago` };
    } else if (diffSec < 300) {
      return { label: 'STALE', variant: 'warning', detail: `Delayed (${Math.floor(diffSec / 60)}m ago)` };
    } else {
      return { label: 'OFFLINE', variant: 'neutral', detail: 'Partner offline' };
    }
  };

  const trackingState = getDriverTrackingState();

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={{ fontSize: 18, color: colors.primary }}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text variant="title" weight="bold" colorVariant="primary">
            Order #{orderRef}
          </Text>
          <Text variant="caption" colorVariant="muted">
            {new Date(order.createdAt).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </Text>
        </View>

        {getStatusBadge(currentStatus)}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {/* Status Transition Action Box */}
        <Card variant="elevated" style={[styles.actionCard, { backgroundColor: colors.surface }]}>
          <Text variant="subtitle" weight="bold" colorVariant="primary">
            Order Status Actions
          </Text>
          <Text variant="caption" colorVariant="muted" style={{ marginBottom: spacing.sm }}>
            Current stage: <Text weight="bold">{currentStatus?.toUpperCase()}</Text>
          </Text>

          {/* Role-Enforced Status Action Flow */}
          {(currentStatus === 'pending' || currentStatus === 'pending_pickup' || currentStatus === 'placed') && (
            <View>
              <View style={[styles.terminalStatusBox, { backgroundColor: colors.background, marginBottom: 10 }]}>
                <Text variant="caption" colorVariant="secondary">
                  ℹ️ Awaiting Delivery Partner: Pickup must be performed by the delivery partner from the customer.
                </Text>
              </View>
              <Button
                title="Cancel Order"
                variant="outline"
                size="md"
                disabled={updateStatusMutation.isPending}
                onPress={() => {
                  setCancelReason('');
                  setCancelModalVisible(true);
                }}
              />
            </View>
          )}

          {currentStatus === 'picked_up' && (
            <View style={[styles.terminalStatusBox, { backgroundColor: colors.background }]}>
              <Text variant="bodySmall" weight="semibold" colorVariant="primary">
                🛵 Driver En-Route to Laundry
              </Text>
              <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4 }}>
                Delivery partner collected clothes from customer and is heading to your store. You can start processing once clothes are handed over and you tap 'Confirm Received'.
              </Text>
            </View>
          )}

          {currentStatus === 'at_laundry_pending_confirmation' && (
            <View>
              <View style={[styles.terminalStatusBox, { backgroundColor: colors.background, marginBottom: 12 }]}>
                <Text variant="bodySmall" weight="bold" colorVariant="primary">
                  📦 Clothes Delivered to Store
                </Text>
                <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4 }}>
                  Delivery partner has dropped off customer clothes. Please verify the items and confirm receipt to unlock processing.
                </Text>
              </View>
              <Button
                title="Confirm Received at Laundry"
                variant="primary"
                size="md"
                isLoading={updateStatusMutation.isPending}
                disabled={updateStatusMutation.isPending}
                onPress={() =>
                  handleStatusTransition('received_at_laundry', 'Confirm you have received and verified the clothes in store?')
                }
              />
            </View>
          )}

          {currentStatus === 'received_at_laundry' && (
            <View>
              <View style={[styles.terminalStatusBox, { backgroundColor: colors.background, marginBottom: 12 }]}>
                <Text variant="bodySmall" weight="bold" colorVariant="primary">
                  Ready for Washing
                </Text>
                <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4 }}>
                  Clothes verified in store. Tap below to begin cleaning.
                </Text>
              </View>
              <Button
                title="Start Processing (Wash/Dry)"
                variant="primary"
                size="md"
                isLoading={updateStatusMutation.isPending}
                disabled={updateStatusMutation.isPending}
                onPress={() =>
                  handleStatusTransition('in_progress', 'Move order to washing and processing?')
                }
              />
            </View>
          )}

          {(currentStatus === 'in_progress' || currentStatus === 'processing') && (
            <View>
              <View style={[styles.terminalStatusBox, { backgroundColor: colors.background, marginBottom: 12 }]}>
                <Text variant="bodySmall" weight="bold" colorVariant="primary">
                  Washing in Progress
                </Text>
                <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4 }}>
                  Order is being washed, dried, and folded. Once ready and packed, mark it ready for delivery.
                </Text>
              </View>
              <Button
                title="Mark Ready for Delivery"
                variant="primary"
                size="md"
                isLoading={updateStatusMutation.isPending}
                disabled={updateStatusMutation.isPending}
                onPress={() =>
                  handleStatusTransition('ready', 'Is laundry completely clean, packaged, and ready for delivery partner pickup?')
                }
              />
            </View>
          )}

          {(currentStatus === 'ready' || currentStatus === 'ready_for_delivery') && (
            <View>
              <View style={[styles.terminalStatusBox, { backgroundColor: colors.background, marginBottom: 12 }]}>
                <Text variant="bodySmall" weight="bold" colorVariant="primary">
                  Order Packed & Ready
                </Text>
                <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4 }}>
                  {order.deliveryPartner
                    ? `Assigned to ${order.deliveryPartner.name}. Awaiting driver pickup from laundry.`
                    : 'Assign a delivery partner below to pick up clean clothes from your store.'}
                </Text>
              </View>
              {!order.deliveryPartner && (
                <Button
                  title="Assign Delivery Partner"
                  variant="primary"
                  size="md"
                  onPress={() => setAssignModalVisible(true)}
                />
              )}
            </View>
          )}

          {currentStatus === 'ready_for_redelivery' && (
            <View>
              <View style={[styles.terminalStatusBox, { backgroundColor: colors.background, marginBottom: 12 }]}>
                <Text variant="bodySmall" weight="bold" colorVariant="primary">
                  Scheduled for Redelivery
                </Text>
                <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4 }}>
                  {order.deliveryPartner
                    ? `Assigned to ${order.deliveryPartner.name}. Driver will collect and redeliver.`
                    : 'Assign a delivery partner to redeliver this order to the customer.'}
                </Text>
              </View>
              {!order.deliveryPartner && (
                <Button
                  title="Assign Delivery Partner"
                  variant="primary"
                  size="md"
                  onPress={() => setAssignModalVisible(true)}
                />
              )}
            </View>
          )}

          {currentStatus === 'out_for_delivery' && (
            <View style={[styles.terminalStatusBox, { backgroundColor: colors.background }]}>
              <Text variant="bodySmall" weight="semibold" colorVariant="primary">
                🛵 Out For Delivery
              </Text>
              <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4 }}>
                Delivery partner picked up clean clothes and is on the way to the customer. Delivery confirmation is performed upon arrival.
              </Text>
            </View>
          )}

          {currentStatus === 'delivery_pending_customer_confirmation' && (
            <View style={[styles.terminalStatusBox, { backgroundColor: colors.background }]}>
              <Text variant="bodySmall" weight="semibold" colorVariant="primary">
                📍 Arrived at Customer
              </Text>
              <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4 }}>
                Delivery partner has arrived at customer's address. Order will complete once customer taps 'Confirm Delivery' or driver verifies customer OTP.
              </Text>
            </View>
          )}

          {(currentStatus === 'customer_unavailable' || currentStatus === 'delivery_failed') && (
            <View style={[styles.terminalStatusBox, { backgroundColor: colors.background }]}>
              <Text variant="bodySmall" weight="semibold" colorVariant="error">
                ⚠️ Customer Unavailable Today
              </Text>
              <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4 }}>
                Delivery partner could not deliver today. Order is being returned to your laundry store.
              </Text>
            </View>
          )}

          {currentStatus === 'returned_to_laundry' && (
            <View>
              <View style={[styles.terminalStatusBox, { backgroundColor: colors.background, marginBottom: 12 }]}>
                <Text variant="bodySmall" weight="bold" colorVariant="primary">
                  Returned to Store (Customer Unavailable)
                </Text>
                <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4 }}>
                  Order safely returned to store. Schedule next-day redelivery attempt under this same order ID.
                </Text>
              </View>
              <Button
                title="Schedule Next-Day Redelivery"
                variant="primary"
                size="md"
                isLoading={updateStatusMutation.isPending}
                disabled={updateStatusMutation.isPending}
                onPress={() =>
                  handleStatusTransition('ready_for_redelivery', 'Prepare this order for next-day redelivery attempt?')
                }
              />
            </View>
          )}

          {(currentStatus === 'delivered' || currentStatus === 'cancelled') && (
            <View style={[styles.terminalStatusBox, { backgroundColor: colors.background }]}>
              <Text variant="body" colorVariant="muted" align="center">
                This order has reached terminal status ({currentStatus}). No further transitions allowed.
              </Text>
            </View>
          )}
        </Card>

        {/* Physical Package Identification / Pickup Photo Card */}
        {Boolean(order.pickupPhoto?.url) && (
          <Card variant="elevated" style={[styles.card, { backgroundColor: colors.surface, borderColor: '#0284C7', borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View>
                <Text variant="subtitle" weight="bold" colorVariant="primary">
                  📸 Package Identification (Pickup Photo)
                </Text>
                <Text variant="caption" colorVariant="secondary">
                  Laundry bag photo captured at customer pickup
                </Text>
              </View>
              <Badge label="VERIFIED PHOTO" variant="success" size="sm" />
            </View>

            <Divider style={{ marginVertical: spacing.xs }} />

            <View style={{ alignItems: 'center', marginVertical: 8 }}>
              <Image
                source={{ uri: order.pickupPhoto.url }}
                style={{
                  width: '100%',
                  height: 240,
                  borderRadius: 12,
                  backgroundColor: '#0F172A',
                }}
                resizeMode="contain"
              />
            </View>

            <View style={{ gap: 4, marginTop: 4 }}>
              <Text variant="caption" colorVariant="secondary">
                Order ID: <Text weight="bold" colorVariant="primary">#{orderRef}</Text>
              </Text>
              <Text variant="caption" colorVariant="secondary">
                Customer: <Text weight="bold" colorVariant="primary">{order.user?.name || 'Customer'}</Text>
              </Text>
              <Text variant="caption" colorVariant="secondary">
                Delivery Agent: <Text weight="bold" colorVariant="primary">{order.deliveryPartner?.name || 'Delivery Partner'}</Text>
              </Text>
              <Text variant="caption" colorVariant="secondary">
                Destination Store: <Text weight="bold" colorVariant="primary">{order.laundryId?.name || 'Laundry Store'}</Text>
              </Text>
              {Boolean(order.pickupPhoto?.uploadedAt) && (
                <Text variant="caption" colorVariant="muted">
                  Pickup Timestamp: {new Date(order.pickupPhoto.uploadedAt).toLocaleString()}
                </Text>
              )}
            </View>
          </Card>
        )}

        {/* Customer Information Card */}
        <Card variant="elevated" style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text variant="subtitle" weight="bold" colorVariant="primary">
            Customer Information
          </Text>
          <Divider style={{ marginVertical: spacing.xs }} />

          <View style={styles.infoRow}>
            <Text variant="body" weight="medium" colorVariant="primary">
              {order.user?.name || 'Customer'}
            </Text>
            {order.user?.phone ? (
              <Text variant="body" weight="bold" style={{ color: colors.primary }}>
                📞 {order.user.phone}
              </Text>
            ) : null}
          </View>
          {order.user?.email ? (
            <Text variant="caption" colorVariant="muted" style={{ marginTop: 2 }}>
              ✉️ {order.user.email}
            </Text>
          ) : null}

          {pickupAddress ? (
            <View style={styles.addressBlock}>
              <Text variant="caption" weight="bold" colorVariant="secondary">
                PICKUP ADDRESS ({pickupAddress.label || 'Home'})
              </Text>
              <Text variant="caption" colorVariant="primary" style={{ marginTop: 2 }}>
                {pickupAddress.fullAddress || pickupAddress.street || ''}, {pickupAddress.city || ''}{' '}
                {pickupAddress.pincode || ''}
              </Text>
              {pickupAddress.landmark ? (
                <Text variant="caption" colorVariant="muted">
                  Landmark: {pickupAddress.landmark}
                </Text>
              ) : null}
            </View>
          ) : null}

          {deliveryAddress ? (
            <View style={styles.addressBlock}>
              <Text variant="caption" weight="bold" colorVariant="secondary">
                DELIVERY ADDRESS ({deliveryAddress.label || 'Home'})
              </Text>
              <Text variant="caption" colorVariant="primary" style={{ marginTop: 2 }}>
                {deliveryAddress.fullAddress || deliveryAddress.street || ''}, {deliveryAddress.city || ''}{' '}
                {deliveryAddress.pincode || ''}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Delivery Partner Card */}
        <Card variant="elevated" style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text variant="subtitle" weight="bold" colorVariant="primary">
                Delivery Partner
              </Text>
              {order.assignmentInfo?.mode && (
                <Text variant="caption" colorVariant="muted" style={{ marginTop: 2 }}>
                  Assignment: {order.assignmentInfo.mode.toUpperCase()} ({order.assignmentInfo.status || 'unassigned'})
                </Text>
              )}
            </View>
            {currentStatus !== 'delivered' && currentStatus !== 'cancelled' && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {!deliveryPartner && (
                  <Button
                    title="⚡ Auto-Assign"
                    size="sm"
                    variant="outline"
                    isLoading={autoAssignMutation.isPending}
                    disabled={autoAssignMutation.isPending}
                    onPress={() => autoAssignMutation.mutate()}
                    style={{ marginRight: 6 }}
                  />
                )}
                <Button
                  title={deliveryPartner ? 'Reassign Partner' : 'Assign Partner'}
                  size="sm"
                  variant="outline"
                  onPress={() => setAssignModalVisible(true)}
                />
              </View>
            )}
          </View>
          <Divider style={{ marginVertical: spacing.xs }} />

          {deliveryPartner ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text variant="body" weight="medium" colorVariant="primary">
                  🛵 {deliveryPartner.name || 'Assigned Driver'}
                </Text>
                {trackingState && (
                  <Badge
                    label={trackingState.label}
                    variant={trackingState.variant}
                    size="sm"
                  />
                )}
              </View>
              {deliveryPartner.phone ? (
                <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
                  Phone: {deliveryPartner.phone}
                </Text>
              ) : null}
              {trackingState && (
                <Text variant="caption" colorVariant="muted" style={{ marginTop: 2 }}>
                  Tracking: {trackingState.detail}
                </Text>
              )}
            </View>
          ) : (
            <View>
              <Text variant="caption" colorVariant="muted">
                No delivery partner assigned yet. Tap "⚡ Auto-Assign" or "Assign Partner" to select a driver.
              </Text>
              {order.assignmentInfo?.failureReason && (
                <Text variant="caption" colorVariant="error" style={{ marginTop: 4 }}>
                  ⚠️ Note: {order.assignmentInfo.failureReason}
                </Text>
              )}
            </View>
          )}
        </Card>

        {/* Services & Items Breakdown */}
        <Card variant="elevated" style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text variant="subtitle" weight="bold" colorVariant="primary">
            Services & Items
          </Text>
          <Divider style={{ marginVertical: spacing.xs }} />

          {order.services?.map((item, idx) => (
            <View key={idx} style={styles.serviceItemRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="medium" colorVariant="primary">
                  {item.service?.name || 'Laundry Service'}
                </Text>
                <Text variant="caption" colorVariant="muted">
                  ₹{item.price} × {item.quantity}
                </Text>
              </View>
              <Text variant="subtitle" weight="bold" colorVariant="primary">
                ₹{item.lineTotal || item.price * item.quantity}
              </Text>
            </View>
          ))}

          <Divider style={{ marginVertical: spacing.sm }} />

          {/* Pricing Totals */}
          <View style={styles.priceRow}>
            <Text variant="caption" colorVariant="secondary">Items Subtotal</Text>
            <Text variant="body" colorVariant="primary">
              ₹{(order.totalAmount || 0) - (order.deliveryFee || 0)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text variant="caption" colorVariant="secondary">Delivery Fee</Text>
            <Text variant="caption" weight="bold" colorVariant="primary">
              {order.deliveryFee > 0 ? `₹${order.deliveryFee}` : 'FREE'}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text variant="caption" colorVariant="secondary">Payment Mode</Text>
            <Text variant="caption" weight="bold" colorVariant="primary">
              {order.paymentMethod?.toUpperCase() || 'COD'}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text variant="caption" colorVariant="secondary">Payment Status</Text>
            <Badge
              label={order.isPaid ? 'PAID' : 'UNPAID'}
              variant={order.isPaid ? 'success' : 'warning'}
              size="sm"
            />
          </View>

          <Divider style={{ marginVertical: spacing.xs }} />

          <View style={styles.priceRow}>
            <Text variant="subtitle" weight="bold" colorVariant="primary">Grand Total</Text>
            <Text variant="h3" weight="bold" colorVariant="primary">
              ₹{order.totalAmount || 0}
            </Text>
          </View>
        </Card>

        {/* Schedule & Notes */}
        <Card variant="elevated" style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text variant="subtitle" weight="bold" colorVariant="primary">
            Schedule & Special Instructions
          </Text>
          <Divider style={{ marginVertical: spacing.xs }} />

          <View style={styles.priceRow}>
            <Text variant="caption" colorVariant="secondary">Pickup Scheduled</Text>
            <Text variant="caption" weight="bold" colorVariant="primary">
              {order.scheduledPickup?.date
                ? new Date(order.scheduledPickup.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Not specified'}
            </Text>
          </View>

          {order.scheduledPickup?.timeSlot?.label ? (
            <View style={styles.priceRow}>
              <Text variant="caption" colorVariant="secondary">Time Slot</Text>
              <Text variant="caption" colorVariant="primary">
                {order.scheduledPickup.timeSlot.label} ({order.scheduledPickup.timeSlot.startTime} -{' '}
                {order.scheduledPickup.timeSlot.endTime})
              </Text>
            </View>
          ) : null}

          {order.specialInstructions ? (
            <View style={{ marginTop: 8 }}>
              <Text variant="caption" weight="bold" colorVariant="secondary">
                Special Instructions:
              </Text>
              <Text variant="caption" colorVariant="primary" style={{ marginTop: 2 }}>
                "{order.specialInstructions}"
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Tracking Updates Timeline */}
        {order.trackingUpdates && order.trackingUpdates.length > 0 && (
          <Card variant="elevated" style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text variant="subtitle" weight="bold" colorVariant="primary">
              Order Timeline
            </Text>
            <Divider style={{ marginVertical: spacing.xs }} />

            {order.trackingUpdates.map((t, index) => (
              <View key={index} style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text variant="caption" weight="bold" colorVariant="primary">
                    {t.status?.toUpperCase()}: {t.message}
                  </Text>
                  <Text variant="caption" colorVariant="muted">
                    {new Date(t.timestamp).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      {/* Cancel Order Modal with Reason */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text variant="h3" weight="bold" colorVariant="primary">Cancel Order</Text>
            <Text variant="body" colorVariant="secondary" style={{ marginTop: 4, marginBottom: spacing.md }}>
              Order #{orderRef} — Please provide a reason for cancellation.
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.borderLight,
                borderRadius: 8,
                padding: 12,
                color: colors.textPrimary,
                backgroundColor: colors.background,
                minHeight: 80,
                textAlignVertical: 'top',
                marginBottom: 16,
              }}
              placeholder="Enter cancellation reason..."
              placeholderTextColor={colors.textMuted}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                title="Back"
                variant="outline"
                size="md"
                onPress={() => setCancelModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm Cancel"
                variant="danger"
                size="md"
                onPress={handleCancelOrder}
                isLoading={updateStatusMutation?.isPending}
                disabled={!cancelReason.trim() || updateStatusMutation?.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign / Reassign Nearby Shared Delivery Partner Modal */}
      <Modal
        visible={assignModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text variant="h3" weight="bold" colorVariant="primary">
              {deliveryPartner ? 'Reassign Delivery Partner' : 'Assign Delivery Partner'}
            </Text>
            <Text variant="caption" colorVariant="muted" style={{ marginVertical: 4 }}>
              Order #{orderRef} • Nearby available shared delivery partners sorted by distance
            </Text>

            <Divider style={{ marginVertical: spacing.xs }} />

            {isNearbyLoading ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Loader size="small" />
                <Text variant="caption" colorVariant="secondary" style={{ marginTop: 10 }}>
                  Searching nearby eligible delivery partners...
                </Text>
              </View>
            ) : isNearbyError ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text variant="body" colorVariant="error" align="center">
                  {nearbyError?.message || 'Could not fetch nearby delivery partners.'}
                </Text>
                <Button
                  title="Retry"
                  size="sm"
                  variant="outline"
                  onPress={() => refetchNearby()}
                  style={{ marginTop: 10 }}
                />
              </View>
            ) : nearbyDrivers.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text variant="body" weight="medium" colorVariant="primary">
                  No Available Delivery Partners Nearby
                </Text>
                <Text variant="caption" colorVariant="muted" align="center" style={{ marginTop: 4 }}>
                  All delivery partners are currently offline or busy with active deliveries.
                </Text>
                <Button
                  title="Refresh"
                  size="sm"
                  variant="outline"
                  onPress={() => refetchNearby()}
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : (
              <FlatList
                data={nearbyDrivers}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => {
                  const isCurrent = deliveryPartner?._id === item._id;
                  const isNearest = index === 0 && item.distance !== null;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.partnerItem,
                        {
                          backgroundColor: isCurrent ? colors.background : colors.surface,
                          borderColor: isNearest ? colors.primary : colors.borderLight,
                          borderWidth: isNearest ? 1.5 : 1,
                        },
                      ]}
                      onPress={() => handleAssignPrompt(item)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Text variant="body" weight="bold" colorVariant="primary">
                            🛵 {item.name}
                          </Text>
                          {isNearest && (
                            <Badge
                              label="NEAREST"
                              variant="success"
                              size="sm"
                              style={{ marginLeft: 6 }}
                            />
                          )}
                          <Badge
                            label={item.availabilityStatus?.toUpperCase() || 'AVAILABLE'}
                            variant="info"
                            size="sm"
                            style={{ marginLeft: 6 }}
                          />
                        </View>
                        <Text variant="caption" colorVariant="secondary" style={{ marginTop: 3 }}>
                          {item.distance !== null ? `📍 ${item.distance} km away` : '📍 Location not updated'}
                          {item.phone ? ` • 📞 ${item.phone}` : ''}
                        </Text>
                      </View>

                      <Button
                        title={isCurrent ? 'Assigned' : deliveryPartner ? 'Reassign' : 'Assign'}
                        size="sm"
                        variant={isCurrent ? 'outline' : 'primary'}
                        disabled={isCurrent || assignPartnerMutation.isPending}
                        isLoading={assignPartnerMutation.isPending}
                        onPress={() => handleAssignPrompt(item)}
                      />
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <Button
              title="Close"
              variant="outline"
              size="md"
              onPress={() => setAssignModalVisible(false)}
              style={{ marginTop: 12 }}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 6,
  },
  body: {
    padding: 16,
  },
  actionCard: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 14,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  terminalStatusBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  card: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressBlock: {
    marginTop: 10,
  },
  serviceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '75%',
  },
  partnerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default AdminOrderDetailScreen;
