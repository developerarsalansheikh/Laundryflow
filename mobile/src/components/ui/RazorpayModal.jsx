import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme';
import Text from './Text';
import Button from './Button';
import Badge from './Badge';
import Divider from './Divider';

/**
 * RazorpayCheckoutModal
 *
 * In-app secure Razorpay checkout interface.
 * Strictly adheres to default Light Theme (NO gradients).
 *
 * Props:
 * - visible: boolean
 * - orderDetails: { orderId, razorpayOrderId, amount, amountInRupees, key, laundryName }
 * - onSuccess: (paymentResult: { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }) => void
 * - onFailure: (error: { message, code }) => void
 * - onCancel: () => void
 */
export const RazorpayModal = ({
  visible,
  orderDetails,
  onSuccess,
  onFailure,
  onCancel,
}) => {
  const { colors, spacing, shadows } = useTheme();
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!visible || !orderDetails) return null;

  const {
    orderId,
    razorpayOrderId = `order_${orderId || 'test'}`,
    amountInRupees = 0,
    laundryName = 'LaundryFlow Store',
  } = orderDetails;

  const handlePaySuccess = () => {
    setIsProcessing(true);
    // Simulate slight network processing delay
    setTimeout(() => {
      setIsProcessing(false);
      const fakePaymentId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const mockSignature = `sig_${Date.now().toString(36)}_${fakePaymentId}`;

      onSuccess({
        razorpayOrderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: mockSignature,
        orderId,
      });
    }, 600);
  };

  const handlePayFailure = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onFailure({
        code: 'BAD_REQUEST_ERROR',
        message: 'Payment was declined by issuing bank (Test Simulation)',
      });
    }, 400);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
              ...shadows.lg,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View>
              <Text variant="caption" weight="bold" colorVariant="muted">
                RAZORPAY SECURE CHECKOUT
              </Text>
              <Text variant="title" weight="bold" colorVariant="primary">
                💳 Complete Payment
              </Text>
            </View>
            <TouchableOpacity
              onPress={onCancel}
              disabled={isProcessing}
              style={styles.closeBtn}
            >
              <Text variant="bodyLarge" colorVariant="muted">
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Amount Banner */}
            <View
              style={[
                styles.amountBanner,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
              ]}
            >
              <View>
                <Text variant="caption" colorVariant="secondary">
                  Merchant: {laundryName}
                </Text>
                <Text variant="caption" colorVariant="muted">
                  Order Ref: #{orderId ? orderId.toString().slice(-8).toUpperCase() : 'ORD'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="caption" colorVariant="muted">
                  PAYABLE AMOUNT
                </Text>
                <Text variant="h2" weight="bold" style={{ color: colors.primary }}>
                  ₹{amountInRupees}
                </Text>
              </View>
            </View>

            {/* Payment Methods */}
            <Text variant="titleSmall" weight="bold" colorVariant="primary" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
              Select Payment Instrument
            </Text>

            {/* Card Option */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                {
                  backgroundColor: selectedMethod === 'card' ? colors.surfaceElevated : colors.surface,
                  borderColor: selectedMethod === 'card' ? colors.primary : colors.borderLight,
                },
              ]}
              onPress={() => setSelectedMethod('card')}
            >
              <View style={styles.radio}>
                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: selectedMethod === 'card' ? colors.primary : colors.borderLight },
                  ]}
                >
                  {selectedMethod === 'card' && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                  💳 Debit / Credit Card
                </Text>
                <Text variant="caption" colorVariant="muted">
                  Visa, Mastercard, RuPay (Test Card: 4242 •••• 4242)
                </Text>
              </View>
            </TouchableOpacity>

            {/* UPI Option */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                {
                  backgroundColor: selectedMethod === 'upi' ? colors.surfaceElevated : colors.surface,
                  borderColor: selectedMethod === 'upi' ? colors.primary : colors.borderLight,
                },
              ]}
              onPress={() => setSelectedMethod('upi')}
            >
              <View style={styles.radio}>
                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: selectedMethod === 'upi' ? colors.primary : colors.borderLight },
                  ]}
                >
                  {selectedMethod === 'upi' && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                  📱 Instant UPI
                </Text>
                <Text variant="caption" colorVariant="muted">
                  Google Pay, PhonePe, Paytm (instant@razorpay)
                </Text>
              </View>
            </TouchableOpacity>

            {/* NetBanking Option */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                {
                  backgroundColor: selectedMethod === 'nb' ? colors.surfaceElevated : colors.surface,
                  borderColor: selectedMethod === 'nb' ? colors.primary : colors.borderLight,
                },
              ]}
              onPress={() => setSelectedMethod('nb')}
            >
              <View style={styles.radio}>
                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: selectedMethod === 'nb' ? colors.primary : colors.borderLight },
                  ]}
                >
                  {selectedMethod === 'nb' && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                  🏦 Net Banking
                </Text>
                <Text variant="caption" colorVariant="muted">
                  HDFC, ICICI, SBI, Axis & 50+ Banks
                </Text>
              </View>
            </TouchableOpacity>

            {/* Security Badge */}
            <View style={styles.securityNote}>
              <Badge label="🔒 256-BIT ENCRYPTED RAZORPAY GATEWAY" variant="success" size="sm" />
            </View>

            <Divider style={{ marginVertical: spacing.md }} />

            {/* Actions */}
            {isProcessing ? (
              <View style={styles.loadingArea}>
                <ActivityIndicator
                  size="small"
                  color={colors?.primary || '#2563EB'}
                  style={{ width: 20, height: 20 }}
                />
                <Text variant="bodySmall" colorVariant="secondary" style={{ marginTop: 8 }}>
                  Contacting payment gateway...
                </Text>
              </View>
            ) : (
              <View>
                <Button
                  title={`Pay ₹${amountInRupees} Securely →`}
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={handlePaySuccess}
                  style={{ marginBottom: spacing.xs }}
                />

                <Button
                  title="Simulate Bank Decline"
                  variant="danger"
                  size="sm"
                  fullWidth
                  onPress={handlePayFailure}
                  style={{ marginTop: spacing.xs, marginBottom: spacing.xs }}
                />

                <Button
                  title="Cancel Payment"
                  variant="outline"
                  size="sm"
                  fullWidth
                  onPress={onCancel}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 20,
  },
  amountBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  radio: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  securityNote: {
    alignItems: 'center',
    marginTop: 14,
  },
  loadingArea: {
    alignItems: 'center',
    paddingVertical: 18,
  },
});

export default RazorpayModal;
