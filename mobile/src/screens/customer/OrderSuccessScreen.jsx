import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { ASSETS } from '../../assets';

// RN-2 Design System Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Divider from '../../components/ui/Divider';

export const OrderSuccessScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  const { order, laundryName } = route.params || {};

  const orderId = order?._id || order?.id || 'ORD-98234';
  const totalAmount = order?.totalAmount || 0;
  const storeName = laundryName || order?.laundryId?.name || 'Laundry Store';

  const handleBackToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'CustomerHome' }],
    });
  };

  const handleViewOrder = () => {
    navigation.reset({
      index: 1,
      routes: [
        { name: 'CustomerHome' },
        { name: 'OrderDetail', params: { orderId, fromOrderSuccess: true } },
      ],
    });
  };

  // Ensure Android hardware back returns to Marketplace cleanly
  useEffect(() => {
    const onBackPress = () => {
      handleBackToHome();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, []);

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerArea}>
          <Image
            source={ASSETS.illustrations.orderSuccess}
            style={styles.successImage}
            resizeMode="contain"
          />

          <View style={styles.badgeWrapper}>
            <Badge label="ORDER BOOKED SUCCESSFULLY" variant="success" size="md" />
          </View>

          <Text variant="h1" weight="bold" colorVariant="primary" align="center" style={{ marginTop: spacing.sm }}>
            Your Laundry is Booked!
          </Text>

          <Text variant="bodyMedium" colorVariant="secondary" align="center" style={{ marginTop: spacing.xs, paddingHorizontal: 20 }}>
            The driver has been notified and will arrive during your scheduled pickup slot.
          </Text>
        </View>

        {/* Order Details Card */}
        <Card variant="elevated" style={styles.summaryCard}>
          <View style={styles.row}>
            <Text variant="caption" colorVariant="muted">
              ORDER REFERENCE
            </Text>
            <Text variant="bodySmall" weight="bold" colorVariant="primary">
              #{orderId.toString().slice(-8).toUpperCase()}
            </Text>
          </View>

          <Divider style={{ marginVertical: spacing.sm }} />

          <View style={styles.row}>
            <Text variant="caption" colorVariant="muted">
              LAUNDRY STORE
            </Text>
            <Text variant="bodySmall" weight="bold" colorVariant="primary">
              🏬 {storeName}
            </Text>
          </View>

          <Divider style={{ marginVertical: spacing.sm }} />

          <View style={styles.row}>
            <Text variant="caption" colorVariant="muted">
              TOTAL AMOUNT
            </Text>
            <Text variant="title" weight="bold" style={{ color: colors.primary }}>
              ₹{totalAmount}
            </Text>
          </View>

          {order?.deliveryFee !== undefined && (
            <>
              <Divider style={{ marginVertical: spacing.sm }} />
              <View style={styles.row}>
                <Text variant="caption" colorVariant="muted">
                  DELIVERY FEE {order?.deliveryDistanceKm ? `(${order.deliveryDistanceKm.toFixed(1)} KM)` : ''}
                </Text>
                <Text variant="bodySmall" weight="bold" colorVariant="primary">
                  {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
                </Text>
              </View>
            </>
          )}

          {order?.gst !== undefined && (
            <>
              <Divider style={{ marginVertical: spacing.sm }} />
              <View style={styles.row}>
                <Text variant="caption" colorVariant="muted">
                  GST (5%)
                </Text>
                <Text variant="bodySmall" weight="bold" colorVariant="primary">
                  ₹{order.gst}
                </Text>
              </View>
            </>
          )}

          {order?.estimatedCompletionAt && (
            <>
              <Divider style={{ marginVertical: spacing.sm }} />
              <View style={styles.row}>
                <Text variant="caption" colorVariant="muted">
                  ESTIMATED DELIVERY
                </Text>
                <Text variant="bodySmall" weight="bold" colorVariant="primary">
                  🕒 {new Date(order.estimatedCompletionAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} Around {new Date(order.estimatedCompletionAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </>
          )}

          <Divider style={{ marginVertical: spacing.sm }} />

          <View style={styles.row}>
            <Text variant="caption" colorVariant="muted">
              PAYMENT STATUS
            </Text>
            <Badge
              label={order?.isPaid ? 'PAID ONLINE (RAZORPAY)' : 'CASH ON DELIVERY'}
              variant={order?.isPaid ? 'success' : 'warning'}
              size="sm"
            />
          </View>

          <Divider style={{ marginVertical: spacing.sm }} />

          <View style={styles.row}>
            <Text variant="caption" colorVariant="muted">
              NEXT STEP
            </Text>
            <Badge label="Awaiting Driver Pickup" variant="info" size="sm" />
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title="View Order Details"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleViewOrder}
            style={{ marginBottom: spacing.md }}
          />

          <Button
            title="Back to Marketplace"
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleBackToHome}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successImage: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  badgeWrapper: {
    marginBottom: 4,
  },
  summaryCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsContainer: {
    width: '100%',
  },
});

export default OrderSuccessScreen;
