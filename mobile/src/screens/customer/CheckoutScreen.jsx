import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { useCartStore } from '../../store/cartStore';
import { useLocationStore } from '../../store/locationStore';
import { customerService } from '../../services/customerService';

// RN-2 Design System Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Divider from '../../components/ui/Divider';
import Loader from '../../components/ui/Loader';
import GlobalLoadingOverlay from '../../components/GlobalLoadingOverlay';
import RazorpayModal from '../../components/ui/RazorpayModal';

const PAYMENT_METHODS = [
  {
    id: 'cod',
    label: '💵 Pay at Delivery (Full Payment at Doorstep)',
    desc: 'Payment at pickup is ₹0. Pay complete amount upon delivery via Cash, UPI, or QR.',
  },
  {
    id: 'razorpay',
    label: '💳 Online Payment (Razorpay)',
    desc: 'Pay complete amount securely via Cards, UPI, or Net Banking.',
  },
];

export const CheckoutScreen = () => {
  const { colors, spacing, shadows } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();

  const cart = useCartStore();
  const cartSummary = cart.getCartSummary();
  const currentCity = useLocationStore((state) => state.city);

  // State
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedDateOffset, setSelectedDateOffset] = useState(0); // 0 = Today, 1 = Tomorrow, 2 = Day After
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [errorMessage, setErrorMessage] = useState('');

  // Razorpay state
  const [razorpayModalVisible, setRazorpayModalVisible] = useState(false);
  const [activeRazorpayOrder, setActiveRazorpayOrder] = useState(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  // Handle incoming selected address from AddressList navigation
  useEffect(() => {
    if (route.params?.selectedAddress) {
      setSelectedAddress(route.params.selectedAddress);
    }
  }, [route.params?.selectedAddress]);

  // Query: Saved Addresses
  const {
    data: addressesData,
    isLoading: isAddressesLoading,
  } = useQuery({
    queryKey: ['addresses'],
    queryFn: customerService.getAddresses,
  });

  const addressList = useMemo(() => {
    if (Array.isArray(addressesData?.data)) return addressesData.data;
    if (Array.isArray(addressesData)) return addressesData;
    return [];
  }, [addressesData]);

  // Pre-select address: prioritize matching current city if available, otherwise default
  useEffect(() => {
    if (!selectedAddress && addressList.length > 0) {
      const cityMatched = currentCity
        ? addressList.find((a) => a.city && a.city.trim().toLowerCase() === currentCity.trim().toLowerCase())
        : null;
      const defaultAddr = cityMatched || addressList.find((a) => a.isDefault) || addressList[0];
      setSelectedAddress(defaultAddr);
    }
  }, [addressList, selectedAddress, currentCity]);

  // When customer changes current city in locationStore, re-align selected address
  useEffect(() => {
    if (currentCity && selectedAddress?.city && selectedAddress.city.trim().toLowerCase() !== currentCity.trim().toLowerCase()) {
      const cityMatched = addressList.find((a) => a.city && a.city.trim().toLowerCase() === currentCity.trim().toLowerCase());
      if (cityMatched) {
        setSelectedAddress(cityMatched);
      }
    }
  }, [currentCity, addressList, selectedAddress]);

  // Delivery Zone Availability & Server Fee Check (Feature Phase A)
  const {
    data: zoneCheckResponse,
    isLoading: isZoneChecking,
  } = useQuery({
    queryKey: ['deliveryZoneCheck', cart.laundryId, selectedAddress?._id, cartSummary.subtotal],
    queryFn: () =>
      customerService.checkDeliveryZone({
        laundryId: cart.laundryId,
        addressId: selectedAddress?._id,
        pincode: selectedAddress?.pincode,
        city: selectedAddress?.city,
        coordinates: selectedAddress?.coordinates,
        orderSubtotal: cartSummary.subtotal,
      }),
    enabled: Boolean(cart.laundryId && selectedAddress?._id),
  });

  const zoneData = zoneCheckResponse?.data || zoneCheckResponse || null;
  const isDeliveryAvailable = zoneData ? zoneData.available !== false : true;
  const deliveryFee = zoneData?.deliveryFee !== undefined ? zoneData.deliveryFee : (cartSummary.deliveryFee || 0);
  const zoneUnavailableReason = zoneData?.reason || '';
  const calculatedGrandTotal = (cartSummary.subtotal || 0) + deliveryFee + (cartSummary.tax || 0);

  // Calculate pickup date options (Today, Tomorrow, Day After)
  const dateOptions = useMemo(() => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dt = String(d.getDate()).padStart(2, '0');
      const isoDate = `${y}-${m}-${dt}`;
      const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[d.getDay()];

      days.push({
        offset: i,
        isoDate,
        dayLabel,
        fullDayName: fullDayNames[d.getDay()],
        dateFormatted: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
      });
    }
    return days;
  }, []);

  const activeDateOption = dateOptions[selectedDateOffset] || dateOptions[0];

  // Helper to check if a slot has already passed for Today
  const isSlotPassed = (slot, isToday) => {
    if (!isToday) return false;
    if (slot?.isPassed !== undefined) return Boolean(slot.isPassed);
    if (!slot?.startTime) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const slotStartMinutes = (startH || 0) * 60 + (startM || 0);
    return currentMinutes >= slotStartMinutes;
  };

  // Query: Time Slots for Selected Laundry & Date
  const {
    data: slotsData,
    isLoading: isSlotsLoading,
  } = useQuery({
    queryKey: ['timeSlots', cart.laundryId, activeDateOption.isoDate],
    queryFn: () => customerService.getTimeSlots(cart.laundryId, activeDateOption.isoDate),
    enabled: Boolean(cart.laundryId),
  });

  const rawSlots = slotsData?.data;
  const availableSlots = Array.isArray(rawSlots) ? rawSlots : [];

  // When available slots load for chosen date, auto-select first valid (not passed) slot
  useEffect(() => {
    if (availableSlots.length > 0) {
      const isToday = selectedDateOffset === 0;
      const upcomingSlots = availableSlots.filter((s) => !isSlotPassed(s, isToday));

      // If user is on Today and all slots have passed, auto-select Tomorrow
      if (isToday && upcomingSlots.length === 0) {
        setSelectedDateOffset(1);
        return;
      }

      const currentSelectedSlot = availableSlots.find((s) => s._id === selectedSlotId);
      const isCurrentPassed = currentSelectedSlot ? isSlotPassed(currentSelectedSlot, isToday) : true;

      if (!currentSelectedSlot || isCurrentPassed) {
        const firstValidSlot = upcomingSlots[0] || (!isToday ? availableSlots[0] : null);
        if (firstValidSlot) {
          setSelectedSlotId(firstValidSlot._id);
          setErrorMessage('');
        } else {
          setSelectedSlotId(null);
        }
      }
    } else {
      setSelectedSlotId(null);
    }
  }, [availableSlots, selectedSlotId, selectedDateOffset]);

  // Mutation: Place Order
  const placeOrderMutation = useMutation({
    mutationFn: async (orderPayload) => {
      return await customerService.placeOrder(orderPayload);
    },
    onSuccess: async (res) => {
      const createdOrder = res?.data || res;
      const completedLaundryName = cart.laundryName || createdOrder?.laundryId?.name || 'Laundry Store';

      if (paymentMethod === 'razorpay') {
        try {
          const payOrderRes = await customerService.createPaymentOrder(createdOrder._id);
          const payData = payOrderRes?.data || payOrderRes;
          setActiveRazorpayOrder({
            orderId: createdOrder._id,
            razorpayOrderId: payData.razorpayOrderId,
            amount: payData.amount,
            amountInRupees: payData.amountInRupees || createdOrder.totalAmount,
            key: payData.key,
            laundryName: completedLaundryName,
          });
          setRazorpayModalVisible(true);
        } catch (payErr) {
          Alert.alert(
            'Order Placed with Pending Payment',
            'Order was booked, but unable to initialize online payment. You can complete payment anytime from Order Details.',
            [
              {
                text: 'View Order',
                onPress: () => {
                  queryClient.invalidateQueries({ queryKey: ['myOrders'] });
                  cart.clearCart();
                  navigation.replace('OrderDetail', { orderId: createdOrder._id });
                },
              },
            ]
          );
        }
      } else {
        // Invalidate and refresh order history queries
        queryClient.invalidateQueries({ queryKey: ['myOrders'] });
        queryClient.refetchQueries({ queryKey: ['myOrders'] });
        // Clear/reset the cart so subsequent orders start with a fresh basket
        cart.clearCart();
        // Navigate to Order Success
        navigation.replace('OrderSuccess', {
          order: createdOrder,
          laundryName: completedLaundryName,
        });
      }
    },
    onError: (err) => {
      setErrorMessage(err?.message || 'Failed to place order. Please check store availability.');
    },
  });

  const handlePaymentSuccess = async (paymentResult) => {
    try {
      setIsVerifyingPayment(true);
      setRazorpayModalVisible(false);
      await customerService.verifyPayment(paymentResult);
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orderDetail', activeRazorpayOrder?.orderId] });
      cart.clearCart();
      navigation.replace('OrderSuccess', {
        order: {
          _id: activeRazorpayOrder?.orderId,
          totalAmount: activeRazorpayOrder?.amountInRupees,
          isPaid: true,
          paymentMethod: 'razorpay',
        },
        laundryName: activeRazorpayOrder?.laundryName,
      });
    } catch (verifyErr) {
      Alert.alert(
        'Verification Warning',
        verifyErr?.message || 'Payment completed, but verification timed out. Please check your order details.',
        [
          {
            text: 'View Order',
            onPress: () => {
              cart.clearCart();
              navigation.replace('OrderDetail', { orderId: activeRazorpayOrder?.orderId });
            },
          },
        ]
      );
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handlePaymentFailure = (err) => {
    setRazorpayModalVisible(false);
    Alert.alert(
      'Payment Failed',
      err?.message || 'Payment could not be completed. Your order has been placed as unpaid. You can retry payment anytime from Order Details.',
      [
        {
          text: 'Go to Order',
          onPress: () => {
            cart.clearCart();
            navigation.replace('OrderDetail', { orderId: activeRazorpayOrder?.orderId });
          },
        },
      ]
    );
  };

  const handlePaymentCancel = () => {
    setRazorpayModalVisible(false);
    Alert.alert(
      'Payment Cancelled',
      'Your order has been placed as unpaid. You can complete payment anytime from Order Details.',
      [
        {
          text: 'Go to Order',
          onPress: () => {
            cart.clearCart();
            navigation.replace('OrderDetail', { orderId: activeRazorpayOrder?.orderId });
          },
        },
      ]
    );
  };

  const handlePlaceOrder = () => {
    // Prevent double-submission or concurrent mutation
    if (placeOrderMutation.isPending || isVerifyingPayment) {
      return;
    }
    setErrorMessage('');

    // 1. Verify single-laundry integrity
    if (!cart.isSingleLaundryValid() || cart.items.length === 0) {
      Alert.alert('Cart Error', 'Your basket is empty or contains an invalid store reference.');
      return;
    }

    // 2. Validate address
    if (!selectedAddress?._id) {
      setErrorMessage('Please select a pickup and delivery address.');
      return;
    }

    if (!isDeliveryAvailable) {
      setErrorMessage(zoneUnavailableReason || 'Delivery is not available in your area for this store.');
      return;
    }

    // 3. Validate time slot strictly (Req 23)
    if (!selectedSlotId) {
      setErrorMessage('Please select an available pickup time.');
      return;
    }

    const chosenSlot = availableSlots.find((s) => s._id === selectedSlotId);
    if (selectedDateOffset === 0 && chosenSlot && isSlotPassed(chosenSlot, true)) {
      setErrorMessage('The selected pickup slot has already passed for today. Please select an upcoming slot.');
      return;
    }

    // 4. Construct payload strictly conforming to backend placeOrder contract with itemized clothing types (Req 18-20)
    const servicesPayload = cart.items.map((item) => ({
      service: item.serviceId || item.id,
      clothingType: item.clothingType,
      itemName: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const orderPayload = {
      services: servicesPayload,
      laundryId: cart.laundryId,
      pickupAddressId: selectedAddress._id,
      deliveryAddressId: selectedAddress._id,
      pickupDate: activeDateOption.isoDate,
      timeSlotId: selectedSlotId,
      specialInstructions: cart.instructions || '',
      paymentMethod,
    };

    placeOrderMutation.mutate(orderPayload);
  };

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: colors.background }}>
      <Header
        title="Checkout"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {errorMessage ? (
          <View style={[styles.errorBox, { backgroundColor: colors.status.error + '15', borderColor: colors.status.error }]}>
            <Text variant="bodySmall" weight="semibold" style={{ color: colors.status.error }}>
              ⚠️ {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* Selected Store Card */}
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.storeHeader}>
            <Text variant="caption" weight="bold" colorVariant="muted">
              ORDERING FROM
            </Text>
            <Badge label="SINGLE LAUNDRY VERIFIED" variant="success" size="sm" />
          </View>
          <Text variant="title" weight="bold" colorVariant="primary" style={{ marginTop: 4 }}>
            🏬 {cart.laundryName || 'Selected Store'}
          </Text>
          <Text variant="caption" colorVariant="secondary">
            📍 {cart.laundryAddress || 'Store Pickup & Delivery'}
          </Text>

          <Divider style={{ marginVertical: spacing.sm }} />

          {/* Items Summary Preview */}
          <Text variant="caption" weight="bold" colorVariant="muted" style={{ marginBottom: 4 }}>
            ORDER ITEMS ({cartSummary.totalItems})
          </Text>
          {cart.items.map((item) => (
            <View key={item.id} style={styles.itemSummaryRow}>
              <Text variant="bodySmall" colorVariant="primary">
                {item.quantity}x {item.name}
              </Text>
              <Text variant="bodySmall" weight="semibold" colorVariant="primary">
                ₹{item.price * item.quantity}
              </Text>
            </View>
          ))}
        </Card>

        {/* Pickup & Delivery Address Card */}
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text variant="title" weight="bold" colorVariant="primary">
              📍 Pickup & Delivery Address
            </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('AddressList', {
                  isSelectMode: true,
                  selectedAddressId: selectedAddress?._id,
                })
              }
            >
              <Text variant="bodySmall" weight="bold" style={{ color: colors.primary }}>
                {selectedAddress ? 'Change' : '+ Select'}
              </Text>
            </TouchableOpacity>
          </View>

          {isAddressesLoading ? (
            <Loader size="small" message="Loading addresses..." />
          ) : selectedAddress ? (
            <View style={styles.selectedAddressBox}>
              <View style={styles.addressLabelRow}>
                <Badge label={selectedAddress.label ? selectedAddress.label.toUpperCase() : 'HOME'} variant="primary" size="sm" />
                {selectedAddress.isDefault && (
                  <View style={{ marginLeft: 6 }}>
                    <Badge label="DEFAULT" variant="neutral" size="sm" />
                  </View>
                )}
              </View>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary" style={{ marginTop: 6 }}>
                {selectedAddress.fullAddress}
              </Text>
              <Text variant="caption" colorVariant="secondary">
                {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </Text>
              {isZoneChecking ? (
                <Text variant="caption" colorVariant="muted" style={{ marginTop: 6 }}>
                  Checking delivery zone...
                </Text>
              ) : !isDeliveryAvailable ? (
                <View style={[styles.zoneErrorBanner, { backgroundColor: colors.status.error + '15', borderColor: colors.status.error, borderWidth: 1, borderRadius: 6, padding: 8, marginTop: 8 }]}>
                  <Text variant="caption" weight="bold" style={{ color: colors.status.error }}>
                    ⚠️ {zoneUnavailableReason || 'Delivery not available in your area for this store'}
                  </Text>
                </View>
              ) : (
                <View style={{ marginTop: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <Badge label={zoneData?.distanceKm ? `${zoneData.distanceKm.toFixed(1)} KM AWAY` : 'DELIVERY AVAILABLE'} variant="info" size="sm" />
                    <Badge label={deliveryFee === 0 ? 'FREE DELIVERY' : `DELIVERY FEE: ₹${deliveryFee}`} variant="success" size="sm" />
                  </View>

                  {zoneData?.estimatedCompletionAt && (
                    <View style={{ marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
                      <Text variant="caption" weight="bold" colorVariant="muted">
                        ESTIMATED COMPLETION & DELIVERY
                      </Text>
                      <Text variant="bodySmall" weight="bold" colorVariant="primary" style={{ marginTop: 2 }}>
                        🕒 {new Date(zoneData.estimatedCompletionAt).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })} Around {new Date(zoneData.estimatedCompletionAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
                        Turnaround: {zoneData.estimatedTurnaroundHours || 24} hours
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.noAddressBox, { borderColor: colors.primary }]}
              onPress={() => navigation.navigate('AddEditAddress')}
            >
              <Text variant="bodyMedium" weight="bold" style={{ color: colors.primary }}>
                + Add Delivery Address
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Pickup Date & Time Slot Picker */}
        <Card variant="elevated" style={styles.sectionCard}>
          <Text variant="title" weight="bold" colorVariant="primary" style={{ marginBottom: spacing.xs }}>
            🕒 Schedule Pickup Slot
          </Text>
          <Text variant="caption" colorVariant="secondary" style={{ marginBottom: 12 }}>
            Select your preferred pickup day and driver arrival window.
          </Text>

          {/* Date Selector Chips */}
          <View style={styles.dateRow}>
            {dateOptions.map((opt) => {
              const isSelected = selectedDateOffset === opt.offset;
              return (
                <TouchableOpacity
                  key={opt.offset}
                  style={[
                    styles.dateChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.borderLight,
                    },
                  ]}
                  onPress={() => {
                    setSelectedDateOffset(opt.offset);
                    setSelectedSlotId(null);
                  }}
                >
                  <Text
                    variant="caption"
                    weight={isSelected ? 'bold' : 'normal'}
                    style={{ color: isSelected ? '#FFFFFF' : colors.textSecondary }}
                  >
                    {opt.dayLabel}
                  </Text>
                  <Text
                    variant="bodySmall"
                    weight={isSelected ? 'bold' : 'semibold'}
                    style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary, marginTop: 2 }}
                  >
                    {opt.dateFormatted}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

            {/* Time Slots List */}
            <View style={styles.slotsArea}>
              {isSlotsLoading ? (
                <Loader size="small" message="Loading store pickup slots..." />
              ) : availableSlots.length > 0 ? (
                <View style={styles.slotsGrid}>
                  {availableSlots.map((slot) => {
                    const isToday = selectedDateOffset === 0;
                    const passed = isSlotPassed(slot, isToday);
                    const isSelected = selectedSlotId === slot._id;
                    const label = slot.label || `${slot.startTime} - ${slot.endTime}`;

                    return (
                      <TouchableOpacity
                        key={slot._id}
                        activeOpacity={passed ? 1 : 0.7}
                        disabled={passed}
                        style={[
                          styles.slotChip,
                          {
                            backgroundColor: passed
                              ? '#F1F5F9'
                              : isSelected
                              ? colors.primary
                              : colors.surface,
                            borderColor: passed
                              ? '#E2E8F0'
                              : isSelected
                              ? colors.primary
                              : colors.borderLight,
                            borderWidth: isSelected ? 2 : 1,
                            opacity: passed ? 0.45 : 1,
                          },
                        ]}
                        onPress={() => {
                          if (passed) return;
                          setSelectedSlotId(slot._id);
                          setErrorMessage('');
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text
                            variant="bodySmall"
                            weight={isSelected ? 'bold' : 'normal'}
                            style={{
                              color: passed
                                ? '#94A3B8'
                                : isSelected
                                ? '#FFFFFF'
                                : colors.textPrimary,
                              textDecorationLine: passed ? 'line-through' : 'none',
                            }}
                          >
                            ⏱ {label}
                          </Text>
                          {passed && (
                            <Badge label="Passed" variant="danger" size="sm" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
              <View style={[styles.defaultSlotNotice, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <Text variant="caption" colorVariant="secondary">
                  ⚡ Standard Morning Window: 09:00 AM - 12:00 PM will be scheduled for {activeDateOption.fullDayName}.
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Payment Method Selector */}
        <Card variant="elevated" style={styles.sectionCard}>
          <Text variant="title" weight="bold" colorVariant="primary" style={{ marginBottom: spacing.xs }}>
            💳 Payment Method
          </Text>

          {PAYMENT_METHODS.map((method) => {
            const isSelected = paymentMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentOption,
                  {
                    backgroundColor: isSelected ? colors.surfaceElevated : 'transparent',
                    borderColor: isSelected ? colors.primary : colors.borderLight,
                  },
                ]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <View style={styles.paymentRadio}>
                  <View
                    style={[
                      styles.radioCircle,
                      { borderColor: isSelected ? colors.primary : colors.borderLight },
                    ]}
                  >
                    {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                  </View>
                </View>
                <View style={styles.paymentText}>
                  <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                    {method.label}
                  </Text>
                  <Text variant="caption" colorVariant="secondary">
                    {method.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </Card>

        {/* Bill Summary */}
        <Card variant="elevated" style={styles.sectionCard}>
          <Text variant="title" weight="bold" colorVariant="primary" style={{ marginBottom: spacing.sm }}>
            Payment Summary
          </Text>

          {/* Selected Schedule Time Summary (Req 23) */}
          <View style={{ marginBottom: 12, padding: 10, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
            <Text variant="caption" weight="bold" colorVariant="muted">
              SCHEDULED PICKUP TIME
            </Text>
            <Text variant="bodySmall" weight="bold" colorVariant="primary" style={{ marginTop: 2 }}>
              📅 {activeDateOption.fullDayName}, {activeDateOption.dateFormatted}
            </Text>
            <Text variant="bodyMedium" weight="bold" style={{ color: colors.primary, marginTop: 2 }}>
              ⏱ {availableSlots.find((s) => s._id === selectedSlotId)?.label || (availableSlots.find((s) => s._id === selectedSlotId) ? `${availableSlots.find((s) => s._id === selectedSlotId).startTime} - ${availableSlots.find((s) => s._id === selectedSlotId).endTime}` : '⚠️ Please select a pickup slot above')}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text variant="bodyMedium" colorVariant="secondary">
              Order Subtotal
            </Text>
            <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
              ₹{cartSummary.subtotal}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text variant="bodyMedium" colorVariant="secondary">
              Store Distance
            </Text>
            <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
              {zoneData?.distanceKm ? `${zoneData.distanceKm.toFixed(1)} KM` : 'Store Hub'}
            </Text>
          </View>

          {/* Minimum Order Base Charge (Req 10) */}
          {cartSummary.subtotal < 100 && (
            <View style={styles.billRow}>
              <Text variant="bodyMedium" colorVariant="secondary">
                Minimum-Order Charge (under ₹100)
              </Text>
              <Text variant="bodyMedium" weight="semibold" style={{ color: colors.status.warning }}>
                ₹{zoneData?.minimumOrderCharge || 30}
              </Text>
            </View>
          )}

          {/* Pickup Leg Distance Charge (Req 9) */}
          <View style={styles.billRow}>
            <Text variant="bodyMedium" colorVariant="secondary">
              Pickup Distance Charge
            </Text>
            <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
              {zoneData?.pickupDistanceCharge > 0 ? `₹${zoneData.pickupDistanceCharge}` : 'FREE (≤ 3 KM)'}
            </Text>
          </View>

          {/* Delivery Leg Distance Charge (Req 9) */}
          <View style={styles.billRow}>
            <Text variant="bodyMedium" colorVariant="secondary">
              Delivery Distance Charge
            </Text>
            <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
              {zoneData?.deliveryDistanceCharge > 0 ? `₹${zoneData.deliveryDistanceCharge}` : 'FREE (≤ 3 KM)'}
            </Text>
          </View>

          {/* Total Delivery & Distance Charges */}
          <View style={styles.billRow}>
            <Text variant="bodyMedium" colorVariant="secondary">
              Total Delivery Charges
            </Text>
            <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text variant="bodyMedium" colorVariant="secondary">
              Taxes (5% GST)
            </Text>
            <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
              ₹{cartSummary.tax}
            </Text>
          </View>
          <Divider style={{ marginVertical: spacing.sm }} />
          <View style={styles.billRow}>
            <Text variant="title" weight="bold" colorVariant="primary">
              Final Total
            </Text>
            <Text variant="title" weight="bold" style={{ color: colors.primary }}>
              ₹{calculatedGrandTotal}
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Bottom Place Order Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.borderLight }]}>
        <View style={styles.totalBlock}>
          <Text variant="caption" colorVariant="muted">
            TOTAL AMOUNT
          </Text>
          <Text variant="h3" weight="bold" style={{ color: colors.primary }}>
            ₹{calculatedGrandTotal}
          </Text>
        </View>

        <Button
          title={!isDeliveryAvailable ? "Delivery Unavailable" : "Place Order →"}
          variant={!isDeliveryAvailable ? "outline" : "primary"}
          size="lg"
          loading={placeOrderMutation.isPending || isVerifyingPayment}
          disabled={
            placeOrderMutation.isPending ||
            isVerifyingPayment ||
            !isDeliveryAvailable ||
            isZoneChecking
          }
          onPress={handlePlaceOrder}
          style={styles.placeOrderBtn}
        />
      </View>

      <GlobalLoadingOverlay
        visible={placeOrderMutation.isPending || isVerifyingPayment}
        message={
          isVerifyingPayment
            ? "Verifying payment with bank..."
            : "Confirming your order with store..."
        }
      />

      <RazorpayModal
        visible={razorpayModalVisible}
        orderDetails={activeRazorpayOrder}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        onCancel={handlePaymentCancel}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  selectedAddressBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F030',
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noAddressBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dateChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  slotsArea: {
    marginTop: 4,
  },
  slotsGrid: {
    gap: 8,
  },
  slotChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  defaultSlotNotice: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  paymentRadio: {
    marginRight: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paymentText: {
    flex: 1,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  totalBlock: {
    alignItems: 'flex-start',
  },
  placeOrderBtn: {
    flex: 1,
    marginLeft: 20,
  },
});

export default CheckoutScreen;
