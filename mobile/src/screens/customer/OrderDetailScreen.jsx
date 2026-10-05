import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  BackHandler,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { customerService } from '../../services/customerService';
import { socketService } from '../../services/socketService';
import { useTrackingStore } from '../../store/trackingStore';

// RN-2 Design System Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Divider from '../../components/ui/Divider';
import Loader from '../../components/ui/Loader';
import ErrorState from '../../components/ui/ErrorState';
import LiveTrackingMap from '../../components/ui/LiveTrackingMap';
import RazorpayModal from '../../components/ui/RazorpayModal';

const STATUS_CONFIG = {
  pending: { label: 'Order Placed', desc: 'Order received and scheduled for pickup.', variant: 'warning', step: 1 },
  pending_pickup: { label: 'Pickup Scheduled', desc: 'Delivery partner assigned to collect your garments.', variant: 'warning', step: 1 },
  placed: { label: 'Order Placed', desc: 'Order received and scheduled for pickup.', variant: 'warning', step: 1 },
  picked_up: { label: 'Picked Up by Driver', desc: 'Garments collected and heading to laundry store.', variant: 'info', step: 3 },
  at_laundry_pending_confirmation: { label: 'At Laundry (Pending Confirmation)', desc: 'Delivered to store, awaiting store confirmation.', variant: 'info', step: 4 },
  received_at_laundry: { label: 'Received at Laundry', desc: 'Store verified your items and started preparing.', variant: 'info', step: 5 },
  in_progress: { label: 'Washing & Processing', desc: 'Garments are being washed and treated.', variant: 'info', step: 6 },
  processing: { label: 'Washing & Processing', desc: 'Garments are being washed and treated.', variant: 'info', step: 6 },
  ready: { label: 'Ready for Delivery', desc: 'Clean, crisp and packed. Awaiting delivery partner.', variant: 'primary', step: 7 },
  ready_for_delivery: { label: 'Ready for Delivery', desc: 'Clean, crisp and packed. Awaiting delivery partner.', variant: 'primary', step: 7 },
  ready_for_redelivery: { label: 'Ready for Redelivery', desc: 'Stored at laundry store, ready for redelivery.', variant: 'primary', step: 7 },
  out_for_delivery: { label: 'Out for Delivery', desc: 'Delivery partner is on the way to your address.', variant: 'primary', step: 9 },
  delivery_pending_customer_confirmation: { label: 'Arrived at Your Doorstep', desc: 'Delivery partner has arrived. Please share the delivery OTP sent to your phone with the driver.', variant: 'warning', step: 10 },
  customer_unavailable: { label: 'Customer Unavailable (Rescheduling)', desc: 'Clothes safely returned to store for tomorrow redelivery.', variant: 'danger', step: 9 },
  delivery_failed: { label: 'Delivery Attempt Failed', desc: 'Attempt failed. Items returning to store.', variant: 'danger', step: 9 },
  returned_to_laundry: { label: 'Returned to Store (Next-Day Delivery)', desc: 'Clothes safely stored for next day redelivery.', variant: 'warning', step: 9 },
  delivered: { label: 'Delivered & Completed', desc: 'Order complete! Thank you for using LaundryFlow.', variant: 'success', step: 11 },
  cancelled: { label: 'Cancelled', desc: 'This order was cancelled.', variant: 'danger', step: 0 },
};

const TIMELINE_STEPS = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'pickup_assigned', label: 'Pickup Assigned' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'at_laundry', label: 'Delivered to Laundry' },
  { key: 'received', label: 'Laundry Received' },
  { key: 'processing', label: 'Processing' },
  { key: 'ready', label: 'Ready for Delivery' },
  { key: 'delivery_assigned', label: 'Delivery Assigned' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'arrived', label: 'Delivered to Customer' },
  { key: 'delivered', label: 'Customer Confirmed' },
];

const getCurrentTimelineIndex = (order) => {
  if (!order) return 0;
  const status = order.status;
  if (status === 'delivered') return 10;
  if (status === 'delivery_pending_customer_confirmation') return 9;
  if (status === 'out_for_delivery') return 8;
  if (status === 'ready' || status === 'ready_for_delivery' || status === 'ready_for_redelivery') {
    return order.deliveryPartner ? 7 : 6;
  }
  if (status === 'in_progress' || status === 'processing') return 5;
  if (status === 'received_at_laundry') return 4;
  if (status === 'at_laundry_pending_confirmation') return 3;
  if (status === 'picked_up') return 2;
  if (status === 'pending' || status === 'placed' || status === 'pending_pickup') {
    return (order.deliveryPartner || order.assignedDeliveryPartner) ? 1 : 0;
  }
  return 0;
};

export const OrderDetailScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();

  const { orderId } = route.params || {};

  // Payment states
  const [razorpayModalVisible, setRazorpayModalVisible] = React.useState(false);
  const [activeRazorpayOrder, setActiveRazorpayOrder] = React.useState(null);
  const [isStartingPayment, setIsStartingPayment] = React.useState(false);

  // Change address state
  const [changeAddressModalVisible, setChangeAddressModalVisible] = React.useState(false);
  const [selectedNewAddress, setSelectedNewAddress] = React.useState(null);

  const { data: addressesData } = useQuery({
    queryKey: ['addresses'],
    queryFn: customerService.getAddresses,
  });
  const savedAddressList = React.useMemo(() => {
    if (Array.isArray(addressesData?.data)) return addressesData.data;
    if (Array.isArray(addressesData)) return addressesData;
    return [];
  }, [addressesData]);

  const changeAddressMutation = useMutation({
    mutationFn: (addr) =>
      customerService.changeOrderAddress(orderId, {
        addressId: addr._id,
        fullAddress: addr.fullAddress,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        coordinates: addr.coordinates,
        landmark: addr.landmark,
        label: addr.label,
      }),
    onSuccess: () => {
      setChangeAddressModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['orderDetail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      Alert.alert('Address Updated', 'The order address and service charges were updated successfully.');
    },
    onError: (err) => {
      Alert.alert(
        'Address Update Rejected',
        err?.response?.data?.message || err?.message || 'Unable to update address for this order.'
      );
    },
  });

  // Fetch Order
  const {
    data: orderResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['orderDetail', orderId],
    queryFn: () => customerService.getOrderById(orderId),
    enabled: Boolean(orderId),
  });

  const order = orderResponse?.data || orderResponse;

  // Confirm Delivery Mutation
  const confirmDeliveryMutation = useMutation({
    mutationFn: () => customerService.confirmDelivery(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderDetail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      Alert.alert('Delivery Confirmed', 'Thank you! Your order is marked as delivered and complete.');
    },
    onError: (err) => {
      Alert.alert(
        'Confirmation Failed',
        err?.response?.data?.message || err?.message || 'Unable to confirm delivery.'
      );
    },
  });

  // Report Customer Unavailable Mutation (Reschedule)
  const reportUnavailableMutation = useMutation({
    mutationFn: (reason) => customerService.reportUnavailable(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderDetail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      Alert.alert(
        'Delivery Rescheduled',
        'We have notified the delivery partner. The package will be returned to the store and redelivered tomorrow.'
      );
    },
    onError: (err) => {
      Alert.alert(
        'Action Failed',
        err?.response?.data?.message || err?.message || 'Unable to update availability.'
      );
    },
  });

  // Cancel Order Mutation (Allowed strictly before pickup)
  const cancelMutation = useMutation({
    mutationFn: (reason) => customerService.cancelOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderDetail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      Alert.alert('Order Cancelled', 'Your order has been successfully cancelled.');
    },
    onError: (err) => {
      Alert.alert('Cancellation Error', err?.response?.data?.message || err?.message || 'Unable to cancel this order.');
    },
  });

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelMutation.mutate('Cancelled by customer'),
        },
      ]
    );
  };

  const handleReportUnavailable = () => {
    Alert.alert(
      'Reschedule Delivery',
      'Are you unavailable to receive your clothes today? The delivery partner will return the order to the store for redelivery tomorrow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reschedule for Tomorrow',
          onPress: () => reportUnavailableMutation.mutate('Customer requested reschedule to next day'),
        },
      ]
    );
  };

  const handleInitiatePayment = async () => {
    try {
      setIsStartingPayment(true);
      const payOrderRes = await customerService.createPaymentOrder(orderId);
      const payData = payOrderRes?.data || payOrderRes;
      setActiveRazorpayOrder({
        orderId: order._id,
        razorpayOrderId: payData.razorpayOrderId,
        amount: payData.amount,
        amountInRupees: payData.amountInRupees || order.totalAmount,
        key: payData.key,
        laundryName: order.laundryId?.name || 'Laundry Store',
      });
      setRazorpayModalVisible(true);
    } catch (err) {
      Alert.alert(
        'Payment Initialization Failed',
        err?.message || 'Unable to start payment. Please check your network connection.'
      );
    } finally {
      setIsStartingPayment(false);
    }
  };

  const handlePaymentSuccess = async (paymentResult) => {
    try {
      setRazorpayModalVisible(false);
      await customerService.verifyPayment(paymentResult);
      queryClient.invalidateQueries({ queryKey: ['orderDetail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      Alert.alert('Payment Successful', 'Your payment was verified and marked as paid!');
    } catch (verifyErr) {
      Alert.alert(
        'Verification Warning',
        verifyErr?.message || 'Payment received, but verification timed out. Please refresh order.'
      );
      queryClient.invalidateQueries({ queryKey: ['orderDetail', orderId] });
    }
  };

  const handlePaymentFailure = (err) => {
    setRazorpayModalVisible(false);
    Alert.alert(
      'Payment Incomplete',
      err?.message || 'Payment was not completed. You can try again at any time.'
    );
  };

  const handlePaymentCancel = () => {
    setRazorpayModalVisible(false);
  };

  const statusInfo = STATUS_CONFIG[order?.status] || {
    label: order?.status || 'Pending',
    variant: 'neutral',
  };

  const isPending = order?.status === 'pending' || order?.status === 'placed' || order?.status === 'pending_pickup';
  const currentTimelineIndex = getCurrentTimelineIndex(order);

  const handleBackPress = () => {
    if (route.params?.fromOrderSuccess) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'CustomerHome' }],
      });
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('CustomerHome');
    }
  };

  useEffect(() => {
    if (!route.params?.fromOrderSuccess) return;
    const onBack = () => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'CustomerHome' }],
      });
      return true;
    };
    const handler = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => handler.remove();
  }, [route.params?.fromOrderSuccess, navigation]);

  const driverLiveLocation = useTrackingStore((state) => state.driverLocations[orderId]);
  const updateDriverLocation = useTrackingStore((state) => state.updateDriverLocation);
  const clearOrderTracking = useTrackingStore((state) => state.clearOrderTracking);

  // Real-time socket tracking effect for live orders
  useEffect(() => {
    if (!orderId || !order) return;

    const isLive =
      order.status === 'out_for_delivery' ||
      (order.status === 'ready' && Boolean(order.deliveryPartner));

    if (isLive) {
      socketService.trackOrder(orderId, (resp) => {
        if (resp?.data?.deliveryPartner?.location) {
          updateDriverLocation(orderId, {
            ...resp.data.deliveryPartner.location,
            driverName: resp.data.deliveryPartner.name,
            driverPhone: resp.data.deliveryPartner.phone,
          });
        }
      });
    }

    const unsubLocation = socketService.on('driver:locationUpdated', (data) => {
      if (data.orderId === orderId || !data.orderId) {
        updateDriverLocation(orderId, data);
      }
    });

    const unsubLegacyLocation = socketService.on('delivery:location', (data) => {
      updateDriverLocation(orderId, {
        latitude: data.lat,
        longitude: data.lng,
        driverName: data.deliveryPartner?.name,
        driverPhone: data.deliveryPartner?.phone,
      });
    });

    const unsubStatus = socketService.on('order:statusChanged', (data) => {
      if (data.orderId === orderId) {
        queryClient.invalidateQueries({ queryKey: ['orderDetail', orderId] });
        queryClient.invalidateQueries({ queryKey: ['myOrders'] });
        if (data.status === 'delivered') {
          socketService.untrackOrder(orderId);
          clearOrderTracking(orderId);
        }
      }
    });

    const unsubAssigned = socketService.on('order:assigned', (data) => {
      if (data.orderId === orderId) {
        queryClient.invalidateQueries({ queryKey: ['orderDetail', orderId] });
      }
    });

    return () => {
      unsubLocation();
      unsubLegacyLocation();
      unsubStatus();
      unsubAssigned();
      if (isLive) {
        socketService.untrackOrder(orderId);
      }
    };
  }, [orderId, order?.status, updateDriverLocation, clearOrderTracking, queryClient]);

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: colors.background }}>
      <Header
        title={order?._id ? `Order #${order._id.slice(-8).toUpperCase()}` : 'Order Details'}
        showBack
        onBackPress={handleBackPress}
      />

      {isLoading && (
        <View style={styles.loaderArea}>
          <Loader size="large" message="Loading order details..." />
        </View>
      )}

      {isError && !isLoading && (
        <ErrorState
          title="Could not load order"
          message={error?.message || 'Failed to retrieve order details.'}
          retryAction={refetch}
        />
      )}

      {!isLoading && order && (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 50 }]}
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
          {/* 1. Customer Delivery Confirmation Card (When Arrived) */}
          {order.status === 'delivery_pending_customer_confirmation' && (
            <Card variant="elevated" style={[styles.card, { borderColor: colors.status.success, borderWidth: 2 }]}>
              <Badge label="DELIVERY ARRIVED" variant="success" size="sm" />
              <Text variant="title" weight="bold" colorVariant="primary" style={{ marginTop: 8 }}>
                Your laundry order has arrived!
              </Text>
              <Text variant="bodySmall" colorVariant="secondary" style={{ marginTop: 4, marginBottom: 14 }}>
                The delivery partner has handed over your clothes. Please inspect your garments and confirm receipt.
              </Text>
              <Button
                title="✓ Confirm Delivery Received"
                variant="primary"
                size="lg"
                fullWidth
                loading={confirmDeliveryMutation.isPending}
                onPress={() => confirmDeliveryMutation.mutate()}
              />
            </Card>
          )}

          {/* 2. Out For Delivery Banner with Reschedule Option */}
          {order.status === 'out_for_delivery' && (
            <Card variant="outlined" style={[styles.card, { borderColor: colors.primary }]}>
              <Badge label="OUT FOR DELIVERY" variant="primary" size="sm" />
              <Text variant="title" weight="bold" colorVariant="primary" style={{ marginTop: 6 }}>
                Clean clothes on the way!
              </Text>
              <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2, marginBottom: 12 }}>
                {order.deliveryPartner?.name
                  ? `Delivery Partner: ${order.deliveryPartner.name}${order.deliveryPartner.phone ? ` (+91 ${order.deliveryPartner.phone})` : ''}`
                  : 'A delivery partner is delivering your freshly cleaned clothes.'}
              </Text>
              <Button
                title="Not Available Today / Reschedule"
                variant="outline"
                size="sm"
                fullWidth
                loading={reportUnavailableMutation.isPending}
                onPress={handleReportUnavailable}
              />
            </Card>
          )}

          {/* 3. Customer Unavailable / Returned to Laundry Banner */}
          {(order.status === 'customer_unavailable' || order.status === 'returned_to_laundry') && (
            <Card variant="outlined" style={[styles.card, { borderColor: colors.status.warning, borderWidth: 1.5 }]}>
              <Badge label="REDELIVERY SCHEDULED" variant="warning" size="sm" />
              <Text variant="title" weight="bold" colorVariant="primary" style={{ marginTop: 6 }}>
                Order Safely Stored at Laundry Store
              </Text>
              <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
                You were unavailable for today's delivery. Your clothes have been returned to the store and will be scheduled for redelivery tomorrow under the same order.
              </Text>
            </Card>
          )}

          {/* Status Hero Card */}
          <Card variant="elevated" style={styles.card}>
            <View style={styles.statusPillRow}>
              <View style={styles.statusIndicatorWrapper}>
                <View
                  style={[
                    styles.statusPillDot,
                    {
                      backgroundColor:
                        statusInfo.variant === 'success'
                          ? colors.status.success
                          : statusInfo.variant === 'danger'
                          ? colors.status.danger
                          : statusInfo.variant === 'warning'
                          ? colors.status.warning
                          : colors.primary,
                    },
                  ]}
                />
                <Text variant="caption" weight="bold" colorVariant="muted" style={{ letterSpacing: 0.8 }}>
                  CURRENT STATUS
                </Text>
              </View>
              <Badge
                label={
                  order.status === 'delivered'
                    ? 'COMPLETED'
                    : order.status === 'cancelled'
                    ? 'CANCELLED'
                    : 'ACTIVE'
                }
                variant={statusInfo.variant}
                size="sm"
              />
            </View>

            <Text variant="h2" weight="bold" colorVariant="primary" style={styles.statusMainHeading}>
              {statusInfo.label}
            </Text>

            {statusInfo.desc && (
              <Text variant="bodySmall" colorVariant="secondary" style={styles.statusSubDesc}>
                {statusInfo.desc}
              </Text>
            )}

            {/* Requirement 13: 11-Step Lifecycle Timeline */}
            <View style={styles.timelineArea}>
              <Divider style={{ marginVertical: spacing.sm }} />
              <Text variant="caption" weight="bold" colorVariant="muted" style={{ marginBottom: 10 }}>
                REAL-WORLD ORDER LIFECYCLE
              </Text>
              {TIMELINE_STEPS.map((step, idx) => {
                const isCompleted = idx < currentTimelineIndex;
                const isCurrent = idx === currentTimelineIndex;
                return (
                  <View key={step.key} style={styles.timelineStepRow}>
                    <View style={styles.timelineIndicatorColumn}>
                      <View
                        style={[
                          styles.timelineDot,
                          isCompleted && { backgroundColor: colors.status.success },
                          isCurrent && { backgroundColor: colors.primary, width: 12, height: 12, borderRadius: 6 },
                          !isCompleted && !isCurrent && { backgroundColor: colors.borderLight },
                        ]}
                      />
                      {idx < TIMELINE_STEPS.length - 1 && (
                        <View
                          style={[
                            styles.timelineLine,
                            isCompleted ? { backgroundColor: colors.status.success } : { backgroundColor: colors.borderLight },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.timelineTextColumn}>
                      <Text
                        variant="bodySmall"
                        weight={isCurrent ? 'bold' : isCompleted ? 'semibold' : 'regular'}
                        style={{
                          color: isCurrent
                            ? colors.primary
                            : isCompleted
                            ? colors.textPrimary
                            : colors.textMuted,
                        }}
                      >
                        {step.label}
                      </Text>
                      {isCurrent && (
                        <Text variant="caption" weight="bold" style={{ color: colors.primary }}>
                          Active Stage
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Tracking updates history */}
            {Array.isArray(order.trackingUpdates) && order.trackingUpdates.length > 0 && (
              <View style={styles.timelineArea}>
                <Divider style={{ marginVertical: spacing.sm }} />
                <Text variant="caption" weight="bold" colorVariant="muted" style={{ marginBottom: 6 }}>
                  ACTIVITY LOG
                </Text>
                {order.trackingUpdates.map((update, idx) => (
                  <View key={idx} style={styles.timelineItem}>
                    <Text variant="caption" weight="bold" style={{ color: colors.primary, width: 20 }}>
                      ●
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySmall" weight="semibold" colorVariant="primary">
                        {update.message || update.status}
                      </Text>
                      {update.timestamp && (
                        <Text variant="caption" colorVariant="muted">
                          {new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Live Delivery Tracking Map */}
          {(order.status === 'out_for_delivery' ||
            (order.status === 'ready' && Boolean(order.deliveryPartner))) && (
              <LiveTrackingMap
                orderId={order._id}
                driverLocation={driverLiveLocation || order.deliveryPartner?.currentLocation}
                destinationAddress={
                  order.deliveryAddress?.fullAddress ||
                  order.pickupAddress?.fullAddress ||
                  order.address
                }
                destinationCoords={
                  order.deliveryAddress?.coordinates || order.pickupAddress?.coordinates
                }
                deliveryPartner={order.deliveryPartner}
                orderStatus={order.status}
              />
            )}

          {/* Laundry Store Information */}
          <Card variant="elevated" style={styles.card}>
            <Text variant="caption" weight="bold" colorVariant="muted" style={{ marginBottom: 4 }}>
              ASSIGNED LAUNDRY STORE
            </Text>
            <Text variant="title" weight="bold" colorVariant="primary">
              🏬 {order.laundryId?.name || 'Laundry Store'}
            </Text>
            {order.laundryId?.address ? (
              <Text variant="bodySmall" colorVariant="secondary" style={{ marginTop: 2 }}>
                📍 {order.laundryId.address}
              </Text>
            ) : null}
            {order.laundryId?.phone ? (
              <Text variant="caption" colorVariant="muted" style={{ marginTop: 4 }}>
                📞 Store Phone: {order.laundryId.phone}
              </Text>
            ) : null}
          </Card>

          {/* Pickup & Delivery Schedule */}
          <Card variant="elevated" style={styles.card}>
            <Text variant="title" weight="bold" colorVariant="primary" style={{ marginBottom: spacing.xs }}>
              🕒 Pickup & Delivery Schedule
            </Text>

            <View style={styles.scheduleRow}>
              <Text variant="bodySmall" colorVariant="secondary">
                Scheduled Pickup:
              </Text>
              <Text variant="bodySmall" weight="bold" colorVariant="primary">
                {order.scheduledPickup?.date
                  ? new Date(order.scheduledPickup.date).toLocaleDateString()
                  : 'As per schedule'}
                {order.scheduledPickup?.timeSlot?.startTime
                  ? ` (${order.scheduledPickup.timeSlot.startTime} - ${order.scheduledPickup.timeSlot.endTime})`
                  : ''}
              </Text>
            </View>

            {(order.estimatedCompletionAt || order.estimatedDelivery) ? (
              <View style={styles.scheduleRow}>
                <Text variant="bodySmall" colorVariant="secondary">
                  Estimated Ready / Delivery:
                </Text>
                <Text variant="bodySmall" weight="bold" colorVariant="primary">
                  {new Date(order.estimatedCompletionAt || order.estimatedDelivery).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} Around {new Date(order.estimatedCompletionAt || order.estimatedDelivery).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ) : null}
          </Card>

          {/* Addresses (Requirement 7: Immutable Address Snapshot) */}
          <Card variant="elevated" style={styles.card}>
            <Text variant="title" weight="bold" colorVariant="primary" style={{ marginBottom: spacing.xs }}>
              📍 Pickup & Delivery Addresses
            </Text>

            <View style={{ marginBottom: 10 }}>
              <Text variant="caption" weight="bold" colorVariant="muted">
                PICKUP ADDRESS (SNAPSHOT)
              </Text>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary" style={{ marginTop: 2 }}>
                {order.pickupAddressSnapshot?.fullAddress || order.pickupAddress?.fullAddress || order.address || 'Address snapshot recorded'}
              </Text>
              {(order.pickupAddressSnapshot?.city || order.pickupAddress?.city) ? (
                <Text variant="caption" colorVariant="secondary">
                  {order.pickupAddressSnapshot?.city || order.pickupAddress?.city}, {order.pickupAddressSnapshot?.state || order.pickupAddress?.state} - {order.pickupAddressSnapshot?.pincode || order.pickupAddress?.pincode}
                </Text>
              ) : null}
            </View>

            {Boolean(order.deliveryAddressSnapshot?.fullAddress || order.deliveryAddress?.fullAddress) && (
              <View style={{ borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 10 }}>
                <Text variant="caption" weight="bold" colorVariant="muted">
                  DELIVERY ADDRESS (SNAPSHOT)
                </Text>
                <Text variant="bodyMedium" weight="semibold" colorVariant="primary" style={{ marginTop: 2 }}>
                  {order.deliveryAddressSnapshot?.fullAddress || order.deliveryAddress?.fullAddress}
                </Text>
                {(order.deliveryAddressSnapshot?.city || order.deliveryAddress?.city) ? (
                  <Text variant="caption" colorVariant="secondary">
                    {order.deliveryAddressSnapshot?.city || order.deliveryAddress?.city}, {order.deliveryAddressSnapshot?.state || order.deliveryAddress?.state} - {order.deliveryAddressSnapshot?.pincode || order.deliveryAddress?.pincode}
                  </Text>
                ) : null}
              </View>
            )}

            {isPending && (
              <View style={{ marginTop: 12 }}>
                <Button
                  title="✏️ Change Delivery Address"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setSelectedNewAddress(null);
                    setChangeAddressModalVisible(true);
                  }}
                />
              </View>
            )}
          </Card>

          {/* Items & Services Breakdown */}
          <Card variant="elevated" style={styles.card}>
            <Text variant="title" weight="bold" colorVariant="primary" style={{ marginBottom: spacing.sm }}>
              Services & Items
            </Text>

            {Array.isArray(order.services) &&
              order.services.map((item, idx) => {
                const serviceName = item.clothingType
                  ? `${item.itemName || item.service?.name || 'Item'} (${item.clothingType})`
                  : (item.itemName || item.service?.name || item.name || 'Laundry Service');
                const price = item.price || item.service?.price || 0;
                const qty = item.quantity || 1;

                return (
                  <View key={idx} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                        {qty}x {serviceName}
                      </Text>
                      <Text variant="caption" colorVariant="muted">
                        ₹{price} each
                      </Text>
                    </View>
                    <Text variant="bodyMedium" weight="bold" colorVariant="primary">
                      ₹{item.lineTotal || price * qty}
                    </Text>
                  </View>
                );
              })}

            {/* Minimum-order charge if applicable */}
            {order.minimumOrderCharge > 0 && (
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" colorVariant="secondary">
                    Minimum-Order Charge ( ₹100)
                  </Text>
                </View>
                <Text variant="bodyMedium" weight="semibold" style={{ color: colors.status.warning }}>
                  ₹{order.minimumOrderCharge}
                </Text>
              </View>
            )}

            {/* Pickup Distance Charge */}
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" colorVariant="secondary">
                  Pickup Distance Charge
                </Text>
              </View>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                {order.pickupDistanceCharge > 0 ? `₹${order.pickupDistanceCharge}` : 'FREE (≤ 3 KM)'}
              </Text>
            </View>

            {/* Delivery Distance Charge */}
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" colorVariant="secondary">
                  Delivery Distance Charge
                </Text>
              </View>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                {order.deliveryDistanceCharge > 0 ? `₹${order.deliveryDistanceCharge}` : 'FREE (≤ 3 KM)'}
              </Text>
            </View>

            {/* Total Delivery & Distance Charges */}
            {order.deliveryFee !== undefined ? (
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" weight="semibold" colorVariant="secondary">
                    Total Delivery Charges {order.deliveryDistanceKm ? `(${order.deliveryDistanceKm.toFixed(1)} km)` : ''}
                  </Text>
                </View>
                <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                  {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
                </Text>
              </View>
            ) : null}

            {/* GST (5% Authoritative) */}
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" colorVariant="secondary">
                  GST (5%)
                </Text>
              </View>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                ₹{order.gst ?? Math.round(((order.subtotal || (order.totalAmount - (order.deliveryFee || 0))) * 0.05))}
              </Text>
            </View>

            <Divider style={{ marginVertical: spacing.sm }} />

            <View style={styles.itemRow}>
              <Text variant="title" weight="bold" colorVariant="primary">
                Total Amount
              </Text>
              <Text variant="title" weight="bold" style={{ color: colors.primary }}>
                ₹{order.totalAmount}
              </Text>
            </View>

            <View style={styles.paymentMethodRow}>
              <Badge
                label={`Payment: ${order.paymentMethod?.toUpperCase() || 'COD'}`}
                variant="neutral"
                size="sm"
              />
              <Badge
                label={order.isPaid ? 'PAID' : 'PAYMENT DUE'}
                variant={order.isPaid ? 'success' : 'warning'}
                size="sm"
              />
            </View>

            {/* Pay Now Button (if online order is unpaid) */}
            {!order.isPaid && order.status !== 'cancelled' && order.paymentMethod !== 'cod' && (
              <View style={{ marginTop: spacing.md }}>
                <Button
                  title={`💳 Pay ₹${order.totalAmount} Now (Razorpay)`}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isStartingPayment}
                  onPress={handleInitiatePayment}
                />
              </View>
            )}
          </Card>

          {/* Cancellation Option (if pending) */}
          {isPending && (
            <View style={styles.cancelArea}>
              <Button
                title="Cancel Order"
                variant="danger"
                size="lg"
                fullWidth
                loading={cancelMutation.isPending}
                onPress={handleCancelOrder}
              />
            </View>
          )}

          {/* Browse Marketplace Action */}
          <View style={{ marginTop: spacing.xs, marginBottom: spacing.sm }}>
            <Button
              title="🏬 Browse Marketplace"
              variant="outline"
              size="md"
              fullWidth
              onPress={() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'CustomerHome' }],
                });
              }}
            />
          </View>
        </ScrollView>
      )}

      <RazorpayModal
        visible={razorpayModalVisible}
        orderDetails={activeRazorpayOrder}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        onCancel={handlePaymentCancel}
      />

      {/* Change Address Modal */}
      <Modal
        visible={changeAddressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChangeAddressModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text variant="title" weight="bold">Select New Delivery Address</Text>
              <TouchableOpacity onPress={() => setChangeAddressModalVisible(false)}>
                <Text variant="title" weight="bold" colorVariant="muted">✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {savedAddressList.length === 0 ? (
                <Text variant="body" colorVariant="secondary" style={{ paddingVertical: 20, textAlign: 'center' }}>
                  No saved addresses found. Add an address from Settings first.
                </Text>
              ) : (
                savedAddressList.map((addr) => {
                  const isSelected = selectedNewAddress?._id === addr._id;
                  return (
                    <TouchableOpacity
                      key={addr._id}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: isSelected ? colors.primary : colors.borderLight,
                        backgroundColor: isSelected ? (colors.primaryLight || '#EEF2FF') : colors.surface,
                        marginBottom: 10,
                      }}
                      onPress={() => setSelectedNewAddress(addr)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text variant="subtitle" weight="bold" colorVariant="primary">
                          {addr.label ? addr.label.toUpperCase() : 'ADDRESS'}
                        </Text>
                        {addr.isDefault && <Badge label="Default" variant="primary" size="sm" />}
                      </View>
                      <Text variant="body" colorVariant="secondary">{addr.fullAddress}</Text>
                      <Text variant="caption" colorVariant="muted">{addr.city}, {addr.state} - {addr.pincode}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            <View style={{ marginTop: 16 }}>
              <Button
                title={changeAddressMutation.isPending ? 'Validating & Updating...' : 'Confirm Address Change'}
                variant="primary"
                size="lg"
                disabled={!selectedNewAddress || changeAddressMutation.isPending}
                loading={changeAddressMutation.isPending}
                onPress={() => {
                  if (selectedNewAddress) {
                    changeAddressMutation.mutate(selectedNewAddress);
                  }
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loaderArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 16,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusMainHeading: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusSubDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  timelineArea: {
    marginTop: 4,
  },
  timelineStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 36,
  },
  timelineIndicatorColumn: {
    alignItems: 'center',
    width: 24,
    marginRight: 8,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 22,
    marginVertical: 2,
  },
  timelineTextColumn: {
    flex: 1,
    paddingTop: 1,
    paddingBottom: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  cancelArea: {
    marginTop: 8,
  },
});

export default OrderDetailScreen;
