import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
  Alert,
  TextInput,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { deliveryService } from '../../services/deliveryService';
import { capturePickupPhoto, promptImageSource } from '../../utils/imagePickerHelper';
import { socketService } from '../../services/socketService';
import { useTrackingStore } from '../../store/trackingStore';
import { useAuthStore } from '../../store/authStore';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Divider from '../../components/ui/Divider';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

export const DeliveryOrderDetailScreen = () => {
  const { colors, spacing, radius, shadows } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { orderId } = route.params || {};

  // Confirmation Modals State
  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [handoffLaundryModalVisible, setHandoffLaundryModalVisible] = useState(false);
  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
  const [unavailableModalVisible, setUnavailableModalVisible] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState('Customer not available at location');
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreviewModalVisible, setPhotoPreviewModalVisible] = useState(false);
  const successTimerRef = useRef(null);

  // Unmount cleanup for success message timer
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  // Fetch Order Detail
  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['deliveryOrder', orderId],
    queryFn: () => deliveryService.getOrderById(orderId),
    enabled: Boolean(orderId),
  });

  const isSharingLocation = useTrackingStore((state) => state.isSharingLocation);
  const setIsSharingLocation = useTrackingStore((state) => state.setIsSharingLocation);
  const user = useAuthStore((state) => state.user);

  // Subscribe to order updates via socket
  useEffect(() => {
    if (!orderId) return;

    // Join order room if assigned
    socketService.joinRoom(`order:${orderId}`);

    const unsubStatus = socketService.on('order:statusChanged', (data) => {
      if (data.orderId === orderId) {
        queryClient.invalidateQueries({ queryKey: ['deliveryOrder', orderId] });
        queryClient.invalidateQueries({ queryKey: ['deliveryActiveOrders'] });
        queryClient.invalidateQueries({ queryKey: ['deliveryStats'] });
      }
    });

    const unsubUpdated = socketService.on('order:updated', (data) => {
      if (data.orderId === orderId) {
        queryClient.invalidateQueries({ queryKey: ['deliveryOrder', orderId] });
      }
    });

    return () => {
      unsubStatus();
      unsubUpdated();
      socketService.leaveRoom(`order:${orderId}`);
    };
  }, [orderId, queryClient]);

  // Throttled location sharing effect (every 12 seconds while active)
  useEffect(() => {
    if (!isSharingLocation || !orderId || !order) return;
    if (order.status === 'delivered' || order.status === 'cancelled') {
      setIsSharingLocation(false);
      return;
    }

    const sendLocationTick = () => {
      const lat = user?.currentLocation?.lat || 12.9716;
      const lng = user?.currentLocation?.lng || 77.5946;

      socketService.sendDriverLocation({
        orderId,
        latitude: lat,
        longitude: lng,
        heading: 90,
        accuracy: 10,
        speed: 25,
        timestamp: new Date().toISOString(),
      });
    };

    sendLocationTick();
    const interval = setInterval(sendLocationTick, 12000);
    return () => clearInterval(interval);
  }, [isSharingLocation, orderId, order?.status, user?.currentLocation, setIsSharingLocation]);

  // Status Update Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, message }) =>
      deliveryService.updateStatus(orderId, { status, message }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliveryOrder', orderId] });
      queryClient.invalidateQueries({ queryKey: ['deliveryActiveOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryCompletedOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryStats'] });

      setPickupModalVisible(false);
      setHandoffLaundryModalVisible(false);
      setDeliveryModalVisible(false);
      setUnavailableModalVisible(false);

      if (variables.status === 'picked_up') {
        setSuccessMessage('Pickup confirmed! Clothes collected from customer.');
      } else if (variables.status === 'at_laundry_pending_confirmation') {
        setSuccessMessage('Handoff reported! Waiting for laundry admin to confirm receipt.');
      } else if (variables.status === 'out_for_delivery') {
        setSuccessMessage('Order collected from laundry and marked Out for Delivery.');
      } else if (variables.status === 'delivery_pending_customer_confirmation') {
        setSuccessMessage('Arrived at customer! Awaiting customer confirmation or OTP verification.');
      } else if (variables.status === 'customer_unavailable') {
        setSuccessMessage('Customer marked unavailable. Please return clothes to laundry.');
      } else if (variables.status === 'returned_to_laundry') {
        setSuccessMessage('Clothes returned to laundry successfully for next-day delivery.');
      } else if (variables.status === 'delivered') {
        setIsSharingLocation(false);
        setSuccessMessage('Delivery confirmed! Order successfully delivered to customer.');
      }
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccessMessage(''), 5000);
    },
    onError: (err) => {
      Alert.alert(
        'Action Failed',
        err?.response?.data?.message || err?.message || 'Failed to update order status.'
      );
    },
  });

  // Upload Pickup Photo Mutation
  const uploadPickupPhotoMutation = useMutation({
    mutationFn: (asset) => deliveryService.uploadPickupPhoto(orderId, asset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryOrder', orderId] });
      queryClient.invalidateQueries({ queryKey: ['deliveryActiveOrders'] });
      setPhotoPreviewModalVisible(false);
      setSelectedPhoto(null);
      setSuccessMessage('Pickup photo attached successfully! Confirm collection to proceed.');
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccessMessage(''), 5000);

      // Automatically advance to pickup confirmation modal
      setPickupModalVisible(true);
    },
    onError: (err) => {
      Alert.alert(
        'Photo Upload Failed',
        err?.response?.data?.message || err?.message || 'Could not upload pickup photo. Please try again.'
      );
    },
  });

  const handleCollectFromCustomerPress = async () => {
    const hasPhoto = Boolean(order?.pickupPhoto?.url);
    if (!hasPhoto) {
      // Mandatory pickup proof: go directly to camera (no gallery option)
      const asset = await capturePickupPhoto();
      if (asset && asset.uri) {
        setSelectedPhoto(asset);
        setPhotoPreviewModalVisible(true);
      }
    } else {
      setPickupModalVisible(true);
    }
  };

  // Verify Customer Delivery OTP Mutation
  const verifyOtpMutation = useMutation({
    mutationFn: (otp) => deliveryService.verifyOTP(orderId, { otp }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryOrder', orderId] });
      queryClient.invalidateQueries({ queryKey: ['deliveryActiveOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryCompletedOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryStats'] });
      setOtpModalVisible(false);
      setOtpCode('');
      setIsSharingLocation(false);
      setSuccessMessage('OTP verified! Delivery marked complete.');
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccessMessage(''), 5000);
    },
    onError: (err) => {
      Alert.alert(
        'OTP Verification Failed',
        err?.response?.data?.message || err?.message || 'Invalid or expired OTP.'
      );
    },
  });

  // Generate OTP Mutation
  const generateOtpMutation = useMutation({
    mutationFn: () => deliveryService.generateOTP(orderId),
    onSuccess: (data) => {
      Alert.alert('OTP Sent', data?.message || 'Delivery OTP has been sent to customer phone and logged in terminal.');
      setOtpModalVisible(true);
    },
    onError: (err) => {
      Alert.alert('Error', err?.response?.data?.message || 'Could not generate OTP.');
    },
  });

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

  const handleCallPhone = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Calling Unavailable', `Could not initiate call to ${phone}`);
    });
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending':
      case 'pending_pickup':
      case 'placed':
        return 'warning';
      case 'picked_up':
      case 'at_laundry_pending_confirmation':
        return 'primary';
      case 'received_at_laundry':
      case 'in_progress':
      case 'processing':
        return 'neutral';
      case 'ready':
      case 'ready_for_delivery':
      case 'ready_for_redelivery':
        return 'primary';
      case 'out_for_delivery':
      case 'delivery_pending_customer_confirmation':
        return 'secondary';
      case 'delivered':
        return 'success';
      case 'customer_unavailable':
      case 'delivery_failed':
      case 'returned_to_laundry':
      case 'cancelled':
        return 'error';
      default:
        return 'neutral';
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <Header title="Order Detail" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <Loader size="large" />
        </View>
      </ScreenContainer>
    );
  }

  if (error || !order) {
    return (
      <ScreenContainer>
        <Header title="Order Detail" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <ErrorState
            title="Order Not Found"
            message={error?.message || 'Could not load order details or you are not authorized to view it.'}
            onRetry={refetch}
          />
        </View>
      </ScreenContainer>
    );
  }

  const customerName = order?.user?.name || 'Customer';
  const customerPhone = order?.user?.phone || '';
  const customerAddress =
    order?.pickupAddress?.fullAddress ||
    order?.pickupAddress?.street ||
    order?.deliveryAddress?.fullAddress ||
    order?.deliveryAddress?.street ||
    order?.address ||
    'Address on file';

  const laundryName = order?.laundryId?.name || 'Laundry Partner';
  const laundryAddress = order?.laundryId?.address || 'Store Location';
  const laundryPhone = order?.laundryId?.phone || '';

  const isDelivered = order.status === 'delivered';
  const isPending = order.status === 'pending' || order.status === 'pending_pickup' || order.status === 'placed';
  const isPickedUp = order.status === 'picked_up';
  const isAtLaundryPending = order.status === 'at_laundry_pending_confirmation';
  const isLaundryProcessing = order.status === 'received_at_laundry' || order.status === 'in_progress' || order.status === 'processing';
  const isReady = order.status === 'ready' || order.status === 'ready_for_delivery' || order.status === 'ready_for_redelivery';
  const isOutForDelivery = order.status === 'out_for_delivery';
  const isDeliveryPendingConfirmation = order.status === 'delivery_pending_customer_confirmation';
  const isCustomerUnavailable = order.status === 'customer_unavailable' || order.status === 'delivery_failed';
  const isReturnedToLaundry = order.status === 'returned_to_laundry';

  return (
    <ScreenContainer>
      <Header
        title={`Order #${String(order._id).slice(-6).toUpperCase()}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Banner */}
        {Boolean(successMessage) && (
          <View style={[styles.successBanner, { backgroundColor: colors.surface, borderColor: colors.status.success }]}>
            <Badge label="STATUS UPDATED" variant="success" size="sm" />
            <Text variant="bodySmall" weight="semibold" style={{ color: colors.status.success, marginTop: 4 }}>
              {successMessage}
            </Text>
          </View>
        )}

        {/* Current Status Header Card */}
        <Card variant="elevated" style={styles.card}>
          <View style={styles.statusHeaderRow}>
            <View>
              <Text variant="caption" colorVariant="secondary">
                CURRENT STATUS
              </Text>
              <Text variant="h3" weight="bold" colorVariant="primary" style={{ marginTop: 2 }}>
                {String(order.status || '').toUpperCase().replace(/_/g, ' ')}
              </Text>
            </View>

            <Badge
              label={String(order.status || '').toUpperCase()}
              variant={getStatusBadgeVariant(order.status)}
              size="md"
            />
          </View>

          <Divider style={{ marginVertical: spacing.sm }} />

          <View style={styles.orderMetaGrid}>
            <View>
              <Text variant="caption" colorVariant="muted">Amount</Text>
              <Text variant="bodyMedium" weight="bold" colorVariant="primary">
                ₹{order.totalAmount || 0}
              </Text>
            </View>
            <View>
              <Text variant="caption" colorVariant="muted">Payment</Text>
              <Text variant="bodyMedium" weight="semibold" style={{ color: order.isPaid ? colors.status.success : colors.status.warning }}>
                {order.isPaid ? 'PAID' : `COD (${order.paymentMethod || 'cash'})`}
              </Text>
            </View>
            <View>
              <Text variant="caption" colorVariant="muted">Created Date</Text>
              <Text variant="bodyMedium" colorVariant="secondary">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Live Location Sharing Card (Active Delivery Context) */}
        {(isOutForDelivery || order.status === 'picked_up') && (
          <Card variant="outlined" style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text variant="title" weight="bold" colorVariant="primary">
                  📡 Live GPS Location Sharing
                </Text>
                <Text variant="caption" colorVariant="muted" style={{ marginTop: 2 }}>
                  {isSharingLocation
                    ? 'Broadcasting real-time coordinates to customer'
                    : 'Location sharing is paused'}
                </Text>
              </View>
              <Badge
                label={isSharingLocation ? 'SHARING ACTIVE' : 'PAUSED'}
                variant={isSharingLocation ? 'success' : 'neutral'}
                size="sm"
              />
            </View>
            <View style={{ marginTop: 10 }}>
              <Button
                title={isSharingLocation ? 'Stop Sharing Location' : 'Start Sharing Location'}
                variant={isSharingLocation ? 'outline' : 'primary'}
                size="sm"
                onPress={() => setIsSharingLocation(!isSharingLocation)}
              />
            </View>
          </Card>
        )}

        {/* CUSTOMER Section */}
        <Card variant="outlined" style={styles.card}>
          <Text variant="title" weight="bold" colorVariant="primary" style={{ marginBottom: spacing.xs }}>
            Customer Information
          </Text>

          <Text variant="bodyMedium" weight="bold" colorVariant="primary">
            {customerName}
          </Text>
          {Boolean(customerPhone) && (
            <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
              Phone: +91 {customerPhone}
            </Text>
          )}

          <Text variant="caption" colorVariant="muted" style={{ marginTop: 6 }}>
            Address:
          </Text>
          <Text variant="bodySmall" colorVariant="primary" style={{ marginTop: 2 }}>
            {customerAddress}
          </Text>

          <View style={styles.actionButtonRow}>
            {Boolean(customerPhone) && (
              <Button
                title="Call Customer"
                variant="outline"
                size="sm"
                style={{ flex: 1 }}
                onPress={() => handleCallPhone(customerPhone)}
              />
            )}
            <Button
              title="Navigate"
              variant="primary"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => handleOpenMaps(customerAddress)}
            />
          </View>
        </Card>

        {/* LAUNDRY Section */}
        <Card variant="outlined" style={styles.card}>
          <Text variant="title" weight="bold" colorVariant="primary" style={{ marginBottom: spacing.xs }}>
            Laundry Store
          </Text>

          <Text variant="bodyMedium" weight="bold" colorVariant="primary">
            {laundryName}
          </Text>
          <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
            {laundryAddress}
          </Text>

          {Boolean(laundryPhone) && (
            <View style={{ marginTop: 8 }}>
              <Button
                title={`Call Store (${laundryPhone})`}
                variant="ghost"
                size="sm"
                onPress={() => handleCallPhone(laundryPhone)}
              />
            </View>
          )}
        </Card>

        {/* ORDER ITEMS Section */}
        <Card variant="outlined" style={styles.card}>
          <Text variant="title" weight="bold" colorVariant="primary" style={{ marginBottom: spacing.sm }}>
            Items & Services ({order?.services?.length || 0})
          </Text>

          {order?.services?.map((item, index) => {
            const serviceName = item?.service?.name || item?.name || 'Laundry Item';
            const price = item?.price || item?.service?.price || 0;
            const quantity = item?.quantity || 1;
            const lineTotal = item?.lineTotal || price * quantity;

            return (
              <View
                key={index}
                style={[
                  styles.itemRow,
                  index < order.services.length - 1 && { borderBottomColor: colors.borderLight, borderBottomWidth: 1 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                    {serviceName}
                  </Text>
                  <Text variant="caption" colorVariant="secondary">
                    Quantity: {quantity} × ₹{price}
                  </Text>
                </View>
                <Text variant="bodyMedium" weight="bold" colorVariant="primary">
                  ₹{lineTotal}
                </Text>
              </View>
            );
          })}

          {Boolean(order.specialInstructions) && (
            <View style={[styles.instructionsBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text variant="caption" weight="bold" colorVariant="secondary">
                Instructions:
              </Text>
              <Text variant="caption" colorVariant="primary" style={{ marginTop: 2 }}>
                {order.specialInstructions}
              </Text>
            </View>
          )}
        </Card>

        {/* Pickup Package Photo Card */}
        {Boolean(order?.pickupPhoto?.url) && (
          <Card variant="elevated" style={[styles.card, { borderColor: colors.primary, borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View>
                <Text variant="subtitle" weight="bold" colorVariant="primary">
                  📸 Pickup Photo Attached
                </Text>
                <Text variant="caption" colorVariant="secondary">
                  Customer bag photo verified for handover
                </Text>
              </View>
              <Badge label="VERIFIED" variant="success" size="sm" />
            </View>

            <Divider style={{ marginVertical: spacing.xs }} />

            <View style={{ alignItems: 'center', marginVertical: 8 }}>
              <Image
                source={{ uri: order.pickupPhoto.url }}
                style={{
                  width: '100%',
                  height: 220,
                  borderRadius: 12,
                  backgroundColor: '#0F172A',
                }}
                resizeMode="cover"
              />
            </View>

            {isPending && (
              <Button
                title="Retake / Change Photo"
                variant="outline"
                size="sm"
                style={{ marginTop: 6 }}
                onPress={async () => {
                  const asset = await capturePickupPhoto();
                  if (asset && asset.uri) {
                    setSelectedPhoto(asset);
                    setPhotoPreviewModalVisible(true);
                  }
                }}
              />
            )}
          </Card>
        )}

        {/* WORKFLOW ACTION BUTTONS */}
        <View style={styles.workflowSection}>
          {/* 1. PICKUP: pending -> picked_up */}
          {isPending && (
            <Button
              title="Collect From Customer (Pick Up)"
              variant="primary"
              size="lg"
              fullWidth
              loading={updateStatusMutation.isPending || uploadPickupPhotoMutation.isPending}
              onPress={handleCollectFromCustomerPress}
            />
          )}

          {/* 2. HANDOFF TO LAUNDRY: picked_up -> at_laundry_pending_confirmation */}
          {isPickedUp && (
            <Card variant="elevated" style={[styles.actionBannerCard, { borderColor: colors.primary }]}>
              <Badge label="PICKUP COMPLETED" variant="primary" size="sm" />
              <Text variant="bodyMedium" weight="bold" colorVariant="primary" style={{ marginTop: 8 }}>
                Deliver Clothes to Laundry Store
              </Text>
              <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4, marginBottom: 14 }}>
                Drive to {laundryName} and hand over the customer's dirty clothes.
              </Text>
              <Button
                title="Delivered to Laundry"
                variant="primary"
                size="lg"
                fullWidth
                loading={updateStatusMutation.isPending}
                onPress={() => setHandoffLaundryModalVisible(true)}
              />
            </Card>
          )}

          {/* 3. AWAITING LAUNDRY CONFIRMATION: at_laundry_pending_confirmation */}
          {isAtLaundryPending && (
            <Card variant="outlined" style={[styles.infoBannerCard, { borderColor: colors.status.warning }]}>
              <Badge label="HANDOFF PENDING" variant="warning" size="sm" />
              <Text variant="bodyMedium" weight="bold" colorVariant="primary" style={{ marginTop: 8 }}>
                Awaiting Laundry Admin Confirmation
              </Text>
              <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4 }}>
                You have delivered this order to the store. The Laundry Admin must tap 'Confirm Received' before processing starts.
              </Text>
            </Card>
          )}

          {/* 4. LAUNDRY PROCESSING: received_at_laundry / in_progress */}
          {isLaundryProcessing && (
            <Card variant="outlined" style={[styles.infoBannerCard, { borderColor: colors.borderLight }]}>
              <Badge label="IN PROCESSING" variant="neutral" size="sm" />
              <Text variant="bodyMedium" weight="bold" colorVariant="primary" style={{ marginTop: 8 }}>
                Clothes Being Cleaned by Store
              </Text>
              <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4 }}>
                The laundry team is washing and packing the clothes. You will be notified when this order is ready for delivery.
              </Text>
            </Card>
          )}

          {/* 5. READY FOR DELIVERY / REDELIVERY: ready -> out_for_delivery */}
          {isReady && (
            <Card variant="elevated" style={[styles.actionBannerCard, { borderColor: colors.primary }]}>
              <Badge label="READY AT LAUNDRY" variant="primary" size="sm" />
              <Text variant="bodyMedium" weight="bold" colorVariant="primary" style={{ marginTop: 8 }}>
                {order.status === 'ready_for_redelivery' ? 'Ready for Redelivery' : 'Clean Order Ready for Pickup'}
              </Text>
              <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4, marginBottom: 14 }}>
                Collect clean packed clothes from {laundryName} and deliver to {customerName}.
              </Text>
              <Button
                title="Pick Up From Laundry & Start Delivery"
                variant="primary"
                size="lg"
                fullWidth
                loading={updateStatusMutation.isPending}
                onPress={() =>
                  updateStatusMutation.mutate({
                    status: 'out_for_delivery',
                    message: 'Delivery partner collected clean clothes from laundry and is on the way to customer.',
                  })
                }
              />
            </Card>
          )}

          {/* 6. OUT FOR DELIVERY: out_for_delivery -> delivery_pending_customer_confirmation */}
          {isOutForDelivery && (
            <View style={{ gap: 10 }}>
              <Button
                title="Delivered to Customer (Arrived)"
                variant="secondary"
                size="lg"
                fullWidth
                loading={updateStatusMutation.isPending}
                onPress={() =>
                  updateStatusMutation.mutate({
                    status: 'delivery_pending_customer_confirmation',
                    message: 'Delivery partner arrived at customer location with clean clothes.',
                  })
                }
              />
              <Button
                title="Confirm Delivery (Enter OTP)"
                variant="outline"
                size="md"
                fullWidth
                onPress={() => {
                  setOtpModalVisible(true);
                }}
              />
              <Button
                title="Customer Unavailable / Return"
                variant="ghost"
                size="md"
                fullWidth
                style={{ borderColor: colors.status.error }}
                onPress={() => setUnavailableModalVisible(true)}
              />
            </View>
          )}

          {/* 7. DELIVERY PENDING CUSTOMER CONFIRMATION */}
          {isDeliveryPendingConfirmation && (
            <Card variant="elevated" style={[styles.actionBannerCard, { borderColor: colors.status.warning }]}>
              <Badge label="AWAITING CONFIRMATION" variant="warning" size="sm" />
              <Text variant="bodyMedium" weight="bold" colorVariant="primary" style={{ marginTop: 8 }}>
                Order Handed to Customer
              </Text>
              <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4, marginBottom: 14 }}>
                Ask customer for the OTP sent to their phone to confirm delivery.
              </Text>

              <View style={{ gap: 10 }}>
                <Button
                  title="Confirm Delivery (Enter OTP)"
                  variant="primary"
                  size="md"
                  fullWidth
                  onPress={() => setOtpModalVisible(true)}
                />
                <Button
                  title="Resend Delivery OTP"
                  variant="outline"
                  size="sm"
                  fullWidth
                  loading={generateOtpMutation.isPending}
                  onPress={() => generateOtpMutation.mutate()}
                />
                <Button
                  title="Customer Unavailable / Return to Laundry"
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onPress={() => setUnavailableModalVisible(true)}
                />
              </View>
            </Card>
          )}

          {/* 8. CUSTOMER UNAVAILABLE: customer_unavailable -> returned_to_laundry */}
          {isCustomerUnavailable && (
            <Card variant="elevated" style={[styles.actionBannerCard, { borderColor: colors.status.error }]}>
              <Badge label="DELIVERY ATTEMPT FAILED" variant="error" size="sm" />
              <Text variant="bodyMedium" weight="bold" colorVariant="primary" style={{ marginTop: 8 }}>
                Customer Unavailable
              </Text>
              <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4, marginBottom: 14 }}>
                Please take the clean clothes back to {laundryName}.
              </Text>
              <Button
                title="Return to Laundry Store"
                variant="primary"
                size="lg"
                fullWidth
                loading={updateStatusMutation.isPending}
                onPress={() =>
                  updateStatusMutation.mutate({
                    status: 'returned_to_laundry',
                    message: 'Delivery partner returned order to laundry store because customer was unavailable.',
                  })
                }
              />
            </Card>
          )}

          {/* 9. RETURNED TO LAUNDRY */}
          {isReturnedToLaundry && (
            <Card variant="outlined" style={[styles.infoBannerCard, { borderColor: colors.borderLight }]}>
              <Badge label="RETURNED TO LAUNDRY" variant="neutral" size="sm" />
              <Text variant="bodyMedium" weight="bold" colorVariant="primary" style={{ marginTop: 8 }}>
                Order Safely Returned to Store
              </Text>
              <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4 }}>
                The laundry store has received the order. They will schedule a next-day redelivery attempt.
              </Text>
            </Card>
          )}

          {/* 10. DELIVERED -> NEW PICKUP PROMPT (CORE RN-6) */}
          {isDelivered && (
            <Card variant="elevated" style={[styles.newPickupPrompt, { borderColor: colors.primary }]}>
              <Badge label="DELIVERY COMPLETE" variant="success" size="sm" />
              <Text variant="bodyMedium" weight="bold" colorVariant="primary" style={{ marginTop: 8 }}>
                Customer has new dirty clothes to wash?
              </Text>
              <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4, marginBottom: 14 }}>
                Create a completely new pickup order on the spot for this customer and store without asking them to log in.
              </Text>

              <Button
                title="+ New Pickup Order"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() =>
                  navigation.navigate('NewPickup', {
                    previousOrderId: order._id,
                    order,
                  })
                }
              />
            </Card>
          )}
        </View>
      </ScrollView>

      {/* 0. Photo Preview & Confirmation Modal */}
      <Modal
        visible={photoPreviewModalVisible}
        title="Review Pickup Photo"
        onClose={() => {
          if (!uploadPickupPhotoMutation.isPending) {
            setPhotoPreviewModalVisible(false);
            setSelectedPhoto(null);
          }
        }}
      >
        <Text variant="bodySmall" colorVariant="primary">
          Verify that the collected laundry bag is clearly visible.
        </Text>
        <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4, marginBottom: 12 }}>
          This photo attaches to Order #{String(order?._id).slice(-6).toUpperCase()} and is verified by the laundry store upon arrival.
        </Text>

        {Boolean(selectedPhoto?.uri) && (
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Image
              source={{ uri: selectedPhoto.uri }}
              style={{
                width: '100%',
                height: 250,
                borderRadius: 12,
                backgroundColor: '#0F172A',
              }}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title="Retake"
            variant="outline"
            size="md"
            style={{ flex: 1 }}
            disabled={uploadPickupPhotoMutation.isPending}
            onPress={async () => {
              // Retake: also goes directly to camera for consistency
              const asset = await capturePickupPhoto();
              if (asset && asset.uri) {
                setSelectedPhoto(asset);
              }
            }}
          />
          <Button
            title="Confirm & Save"
            variant="primary"
            size="md"
            style={{ flex: 1.4 }}
            loading={uploadPickupPhotoMutation.isPending}
            disabled={!selectedPhoto}
            onPress={() => {
              if (selectedPhoto) {
                uploadPickupPhotoMutation.mutate(selectedPhoto);
              }
            }}
          />
        </View>
      </Modal>

      {/* 1. Pickup Confirmation Modal */}
      <Modal
        visible={pickupModalVisible}
        title="Confirm Pickup"
        onClose={() => setPickupModalVisible(false)}
      >
        <Text variant="bodyMedium" colorVariant="primary">
          Confirm that you collected the customer's clothes from {customerName}?
        </Text>
        <Text variant="caption" colorVariant="secondary" style={{ marginTop: 8, marginBottom: 12 }}>
          This will update the order status to Picked Up. Cancellation will no longer be allowed.
        </Text>

        {Boolean(order?.pickupPhoto?.url) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 8, borderRadius: 8, marginBottom: 14, gap: 10 }}>
            <Image
              source={{ uri: order.pickupPhoto.url }}
              style={{ width: 48, height: 48, borderRadius: 6 }}
            />
            <View style={{ flex: 1 }}>
              <Text variant="caption" weight="bold" colorVariant="primary">
                Pickup Photo Attached
              </Text>
              <Text variant="caption" colorVariant="secondary">
                Package ready for store handoff
              </Text>
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            style={{ flex: 1 }}
            onPress={() => setPickupModalVisible(false)}
          />
          <Button
            title="Confirm"
            variant="primary"
            size="md"
            style={{ flex: 1 }}
            loading={updateStatusMutation.isPending}
            onPress={() =>
              updateStatusMutation.mutate({
                status: 'picked_up',
                message: 'Delivery partner collected clothes from customer home.',
              })
            }
          />
        </View>
      </Modal>

      {/* 2. Handed to Laundry Modal */}
      <Modal
        visible={handoffLaundryModalVisible}
        title="Handoff to Laundry"
        onClose={() => setHandoffLaundryModalVisible(false)}
      >
        <Text variant="bodyMedium" colorVariant="primary">
          Have you handed over this order to the {laundryName} team?
        </Text>
        <Text variant="caption" colorVariant="secondary" style={{ marginTop: 8, marginBottom: 16 }}>
          Status will change to 'At Laundry (Pending Confirmation)' until the Laundry Admin taps 'Confirm Received'.
        </Text>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            style={{ flex: 1 }}
            onPress={() => setHandoffLaundryModalVisible(false)}
          />
          <Button
            title="Confirm Handoff"
            variant="primary"
            size="md"
            style={{ flex: 1 }}
            loading={updateStatusMutation.isPending}
            onPress={() =>
              updateStatusMutation.mutate({
                status: 'at_laundry_pending_confirmation',
                message: 'Delivery partner delivered clothes to laundry partner store.',
              })
            }
          />
        </View>
      </Modal>

      {/* 3. Delivery Confirmation Modal */}
      <Modal
        visible={deliveryModalVisible}
        title="Confirm Delivery"
        onClose={() => setDeliveryModalVisible(false)}
      >
        <Text variant="bodyMedium" colorVariant="primary">
          Confirm that the customer {customerName} received this order?
        </Text>
        <Text variant="caption" colorVariant="secondary" style={{ marginTop: 8, marginBottom: 16 }}>
          This will move the order to customer confirmation.
        </Text>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            style={{ flex: 1 }}
            onPress={() => setDeliveryModalVisible(false)}
          />
          <Button
            title="Mark Delivered"
            variant="secondary"
            size="md"
            style={{ flex: 1 }}
            loading={updateStatusMutation.isPending}
            onPress={() =>
              updateStatusMutation.mutate({
                status: 'delivery_pending_customer_confirmation',
                message: 'Order handed to customer. Delivery confirmation pending.',
              })
            }
          />
        </View>
      </Modal>

      {/* 4. Customer Unavailable Modal */}
      <Modal
        visible={unavailableModalVisible}
        title="Customer Unavailable"
        onClose={() => setUnavailableModalVisible(false)}
      >
        <Text variant="bodyMedium" colorVariant="primary">
          Is the customer unavailable at their address?
        </Text>
        <Text variant="caption" colorVariant="secondary" style={{ marginTop: 8, marginBottom: 12 }}>
          Provide the reason. The order must be returned to the laundry store for next-day delivery.
        </Text>

        <TextInput
          value={unavailableReason}
          onChangeText={setUnavailableReason}
          placeholder="Reason (e.g. Customer not answering phone)"
          placeholderTextColor={colors.textMuted}
          style={{
            borderWidth: 1,
            borderColor: colors.borderLight,
            borderRadius: radius.md,
            padding: 12,
            color: colors.textPrimary,
            marginBottom: 16,
          }}
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            style={{ flex: 1 }}
            onPress={() => setUnavailableModalVisible(false)}
          />
          <Button
            title="Mark Unavailable"
            variant="secondary"
            size="md"
            style={{ flex: 1 }}
            loading={updateStatusMutation.isPending}
            onPress={() =>
              updateStatusMutation.mutate({
                status: 'customer_unavailable',
                message: unavailableReason || 'Customer unavailable at delivery location.',
              })
            }
          />
        </View>
      </Modal>

      {/* 5. OTP Verification Modal */}
      <Modal
        visible={otpModalVisible}
        title="Confirm Delivery"
        onClose={() => {
          setOtpModalVisible(false);
          setOtpCode('');
        }}
      >
        <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
          Enter Customer OTP
        </Text>
        <Text variant="caption" colorVariant="secondary" style={{ marginTop: 6, marginBottom: 14 }}>
          Ask the customer for the OTP sent to their registered phone.
        </Text>

        <TextInput
          value={otpCode}
          onChangeText={setOtpCode}
          placeholder="Enter Customer OTP"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={6}
          style={{
            borderWidth: 1,
            borderColor: colors.borderLight,
            borderRadius: radius.md,
            padding: 14,
            fontSize: 20,
            letterSpacing: 4,
            textAlign: 'center',
            fontWeight: 'bold',
            color: colors.textPrimary,
            marginBottom: 16,
          }}
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            style={{ flex: 1 }}
            onPress={() => {
              setOtpModalVisible(false);
              setOtpCode('');
            }}
          />
          <Button
            title="Confirm Delivery"
            variant="primary"
            size="md"
            style={{ flex: 1.4 }}
            loading={verifyOtpMutation.isPending}
            disabled={otpCode.trim().length < 4}
            onPress={() => verifyOtpMutation.mutate(otpCode.trim())}
          />
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    padding: 16,
    marginBottom: 14,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  instructionsBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  workflowSection: {
    marginTop: 10,
  },
  actionBannerCard: {
    padding: 16,
    borderWidth: 1.5,
  },
  infoBannerCard: {
    padding: 16,
    borderWidth: 1,
  },
  newPickupPrompt: {
    padding: 18,
    borderWidth: 1.5,
  },
  successBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
});

export default DeliveryOrderDetailScreen;
