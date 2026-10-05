import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
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
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import AuthGateModal from '../../components/AuthGateModal';

export const CartScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const cart = useCartStore();

  const userCity = useLocationStore((state) => state.city);
  const userLat = useLocationStore((state) => state.latitude);
  const userLng = useLocationStore((state) => state.longitude);

  // Saved Addresses for customer delivery fee verification
  const { data: addressesData } = useQuery({
    queryKey: ['addresses'],
    queryFn: customerService.getAddresses,
    enabled: Boolean(isAuthenticated),
  });

  const defaultAddress = useMemo(() => {
    const list = Array.isArray(addressesData?.data) ? addressesData.data : (Array.isArray(addressesData) ? addressesData : []);
    return list.find((a) => a.isDefault) || list[0] || null;
  }, [addressesData]);

  const rawSubtotal = useMemo(() => {
    return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart.items]);

  // Delivery Zone Availability & Server Fee Check (3 KM / ₹100 Rule)
  const { data: zoneCheckResponse } = useQuery({
    queryKey: ['deliveryZoneCheck', cart.laundryId, defaultAddress?._id, rawSubtotal],
    queryFn: () =>
      customerService.checkDeliveryZone({
        laundryId: cart.laundryId,
        addressId: defaultAddress?._id,
        pincode: defaultAddress?.pincode,
        city: defaultAddress?.city || userCity,
        coordinates: defaultAddress?.coordinates || (userLat && userLng ? { lat: userLat, lng: userLng } : undefined),
        orderSubtotal: rawSubtotal,
      }),
    enabled: Boolean(cart.laundryId && rawSubtotal > 0),
  });

  const zoneData = zoneCheckResponse?.data || zoneCheckResponse || null;
  const effectiveDeliveryFee = useMemo(() => {
    if (zoneData?.deliveryFee !== undefined) {
      return zoneData.deliveryFee;
    }
    // Standard rule: subtotal >= 100 is FREE (within 3 KM); under 100 has 30 min order charge
    if (rawSubtotal >= 100) return 0;
    if (rawSubtotal > 0) return 30;
    return 0;
  }, [zoneData, rawSubtotal]);

  const cartSummary = cart.getCartSummary(effectiveDeliveryFee);

  const [authGateVisible, setAuthGateVisible] = useState(false);
  const [instructions, setInstructions] = useState(cart.instructions || '');

  // Proceed to Checkout handler with Auth Gate
  const handleProceedToCheckout = () => {
    if (cart.items.length === 0) return;

    // Save instructions in cart store
    cart.setInstructions(instructions);

    if (!isAuthenticated) {
      setAuthGateVisible(true);
      return;
    }

    navigation.navigate('Checkout');
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your basket?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => cart.clearCart(),
        },
      ]
    );
  };

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: colors.background }}>
      <Header
        title="My Basket"
        showBack
        onBackPress={() => navigation.goBack()}
        rightElement={
          cart.items.length > 0 ? (
            <TouchableOpacity onPress={handleClearCart}>
              <Text variant="caption" weight="bold" colorVariant="danger">
                Clear Cart
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {cart.items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title="Your basket is empty"
            description="Explore our verified laundry stores and add items to place an order."
            actionLabel="Browse Marketplace"
            onActionPress={() => navigation.navigate('CustomerHome')}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Selected Laundry Banner */}
          <Card variant="elevated" style={styles.laundryCard}>
            <View style={styles.laundryRow}>
              <View style={styles.laundryIcon}>
                <Text variant="h2">🏬</Text>
              </View>
              <View style={styles.laundryInfo}>
                <Badge label="SINGLE-LAUNDRY ORDER" variant="primary" size="sm" />
                <Text variant="title" weight="bold" colorVariant="primary" style={{ marginTop: 2 }}>
                  {cart.laundryName || 'Selected Store'}
                </Text>
                <Text variant="caption" colorVariant="secondary">
                  📍 {cart.laundryAddress || 'Store Pickup & Delivery'}
                </Text>
              </View>
            </View>
          </Card>

          {/* Cart Items List */}
          <View style={styles.sectionHeader}>
            <Text variant="title" weight="bold" colorVariant="primary">
              Order Items ({cartSummary.totalItems})
            </Text>
          </View>

          {cart.items.map((item) => {
            const lineTotal = item.price * item.quantity;
            const unitDisplay = item.unit === 'per_kg' ? 'kg' : 'piece';

            return (
              <Card key={item.id} variant="elevated" style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <View style={styles.itemMeta}>
                    <Text variant="bodyLarge" weight="bold" colorVariant="primary">
                      {item.name}
                    </Text>
                    <Text variant="caption" colorVariant="muted" style={{ marginTop: 2 }}>
                      ₹{item.price} / {unitDisplay}
                    </Text>
                    <Text variant="bodySmall" weight="bold" style={{ color: colors.primary, marginTop: 4 }}>
                      Line Total: ₹{lineTotal}
                    </Text>
                  </View>

                  {/* Quantity Stepper */}
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      style={[styles.stepperBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                      onPress={() => cart.decrementItem(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text variant="bodyLarge" weight="bold" style={{ color: colors.primary }}>
                        −
                      </Text>
                    </TouchableOpacity>

                    <Text variant="bodyMedium" weight="bold" colorVariant="primary" style={styles.qtyText}>
                      {item.quantity}
                    </Text>

                    <TouchableOpacity
                      style={[styles.stepperBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                      onPress={() => cart.incrementItem(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text variant="bodyLarge" weight="bold" style={{ color: colors.primary }}>
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })}

          {/* Special Instructions Input */}
          <Card variant="elevated" style={styles.instructionsCard}>
            <Text variant="bodyMedium" weight="bold" colorVariant="primary" style={{ marginBottom: spacing.xs }}>
              📝 Special Instructions (Optional)
            </Text>
            <Input
              placeholder="e.g. Mild detergent, separate white shirts, extra starch..."
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={2}
            />
          </Card>

          {/* Bill Summary Breakdown */}
          <Card variant="elevated" style={styles.billCard}>
            <Text variant="title" weight="bold" colorVariant="primary" style={{ marginBottom: spacing.sm }}>
              Bill Breakdown
            </Text>

            <View style={styles.billRow}>
              <Text variant="bodyMedium" colorVariant="secondary">
                Item Total (Subtotal)
              </Text>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                ₹{cartSummary.subtotal}
              </Text>
            </View>

            {cartSummary.subtotal > 0 && cartSummary.subtotal < 100 && (
              <View style={[styles.freeDeliveryBanner, { backgroundColor: colors.primaryLight || '#EEF2FF', borderColor: colors.primary }]}>
                <Text variant="caption" weight="bold" style={{ color: colors.primary }}>
                  💡 Add ₹{100 - cartSummary.subtotal} more to get FREE delivery (within 3 KM)!
                </Text>
              </View>
            )}

            <View style={styles.billRow}>
              <Text variant="bodyMedium" colorVariant="secondary">
                Pickup & Delivery Fee
              </Text>
              <Text
                variant="bodyMedium"
                weight="bold"
                style={{
                  color: cartSummary.deliveryFee === 0 ? (colors.success || '#10B981') : colors.textPrimary,
                }}
              >
                {cartSummary.deliveryFee === 0
                  ? 'FREE (≤ 3 KM)'
                  : cartSummary.subtotal < 100
                  ? `₹${cartSummary.deliveryFee} (Min. Order Fee)`
                  : `₹${cartSummary.deliveryFee}`}
              </Text>
            </View>

            <View style={styles.billRow}>
              <Text variant="bodyMedium" colorVariant="secondary">
                Taxes & Packaging (5% GST)
              </Text>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                ₹{cartSummary.tax}
              </Text>
            </View>

            <Divider style={{ marginVertical: spacing.sm }} />

            <View style={styles.billRow}>
              <Text variant="title" weight="bold" colorVariant="primary">
                To Pay
              </Text>
              <Text variant="title" weight="bold" style={{ color: colors.primary }}>
                ₹{cartSummary.grandTotal}
              </Text>
            </View>
          </Card>
        </ScrollView>
      )}

      {/* Floating Checkout Button Bar */}
      {cart.items.length > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.borderLight }]}>
          <View style={styles.totalBlock}>
            <Text variant="caption" colorVariant="muted">
              GRAND TOTAL
            </Text>
            <Text variant="h3" weight="bold" style={{ color: colors.primary }}>
              ₹{cartSummary.grandTotal}
            </Text>
          </View>

          <Button
            title="Proceed to Checkout →"
            variant="primary"
            size="lg"
            onPress={handleProceedToCheckout}
            style={styles.checkoutBtn}
          />
        </View>
      )}

      {/* Auth Gate Modal for Guests */}
      <AuthGateModal
        visible={authGateVisible}
        onClose={() => setAuthGateVisible(false)}
        title="Sign in to Checkout"
        description="Login or create an account to select your pickup address and confirm your booking."
        pendingIntent={{
          action: 'checkout',
          returnTo: 'Checkout',
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  laundryCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  laundryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  laundryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  laundryInfo: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  itemCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemMeta: {
    flex: 1,
    paddingRight: 10,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    paddingHorizontal: 12,
  },
  instructionsCard: {
    padding: 14,
    borderRadius: 14,
    marginVertical: 10,
  },
  billCard: {
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  checkoutBtn: {
    flex: 1,
    marginLeft: 20,
  },
  freeDeliveryBanner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CartScreen;
