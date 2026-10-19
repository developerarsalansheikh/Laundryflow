import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme';
import Text from './ui/Text';
import Button from './ui/Button';

export const EditOrderModal = ({
  visible,
  onClose,
  onConfirmEdit,
  isLoading,
  order,
  remainingSeconds = 0,
}) => {
  const { colors, spacing, borderRadius } = useTheme();

  const [items, setItems] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [minutesLeft, setMinutesLeft] = useState(Math.max(0, Math.floor(remainingSeconds / 60)));
  const [secondsLeft, setSecondsLeft] = useState(Math.max(0, remainingSeconds % 60));

  useEffect(() => {
    if (order && Array.isArray(order.services)) {
      setItems(
        order.services.map((s) => ({
          service: s.service?._id || s.service,
          itemName: s.itemName || s.clothingType || 'Item',
          clothingType: s.clothingType || s.itemName || '',
          quantity: s.quantity || 1,
          price: s.price || 0,
          lineTotal: (s.price || 0) * (s.quantity || 1),
        }))
      );
      setSpecialInstructions(order.specialInstructions || '');
    }
  }, [order, visible]);

  // Countdown timer inside modal
  useEffect(() => {
    if (!visible || remainingSeconds <= 0) return;
    let currentSec = remainingSeconds;

    const interval = setInterval(() => {
      currentSec -= 1;
      if (currentSec <= 0) {
        clearInterval(interval);
        onClose(); // Automatically close if window expires while modal is open
      } else {
        setMinutesLeft(Math.floor(currentSec / 60));
        setSecondsLeft(currentSec % 60);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, remainingSeconds, onClose]);

  if (!visible) return null;

  const handleQuantityChange = (index, delta) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const newQty = Math.max(0, target.quantity + delta);
      if (newQty === 0) {
        // Only allow removing if at least one item remains
        if (copy.filter((i) => i.quantity > 0).length <= 1) {
          return prev; // keep at least 1 item
        }
      }
      target.quantity = newQty;
      target.lineTotal = target.price * newQty;
      return copy;
    });
  };

  const activeItems = items.filter((i) => i.quantity > 0);
  const newSubtotal = activeItems.reduce((acc, curr) => acc + curr.lineTotal, 0);
  const deliveryFee = order?.deliveryFee || 0;
  const gst = Math.round(newSubtotal * 0.05);
  const discount = order?.discount || 0;
  const newTotal = newSubtotal + deliveryFee + gst - discount;
  const diff = newTotal - (order?.totalAmount || 0);

  const isPaidOnline = order?.isPaid && order?.paymentMethod === 'razorpay';

  const handleSubmit = () => {
    onConfirmEdit({
      services: activeItems.map((i) => ({
        service: i.service,
        itemName: i.itemName,
        clothingType: i.clothingType,
        quantity: i.quantity,
        price: i.price,
      })),
      specialInstructions: specialInstructions.trim(),
      editReason: 'Customer updated clothes and instructions',
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text variant="title" weight="bold" colorVariant="primary">
                Edit Order Items
              </Text>
              <Text variant="caption" style={{ color: '#D97706', marginTop: 2 }}>
                ⏱️ Window closing in {minutesLeft}m {secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}s
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text variant="body" weight="bold" colorVariant="secondary">
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Garments List */}
            <Text variant="label" weight="bold" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
              Clothes & Quantities
            </Text>

            {items.map((item, index) => {
              if (item.quantity === 0) return null;
              return (
                <View
                  key={`${item.service}_${index}`}
                  style={[
                    styles.itemRow,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.borderLight,
                      borderRadius: borderRadius.md,
                      padding: spacing.sm,
                      marginBottom: spacing.xs,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="bold" colorVariant="primary">
                      {item.itemName}
                    </Text>
                    <Text variant="caption" colorVariant="secondary">
                      ₹{item.price} each • Total: ₹{item.lineTotal}
                    </Text>
                  </View>

                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      style={[styles.qtyBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                      onPress={() => handleQuantityChange(index, -1)}
                    >
                      <Text variant="body" weight="bold" colorVariant="primary">
                        -
                      </Text>
                    </TouchableOpacity>

                    <Text variant="body" weight="bold" style={{ marginHorizontal: spacing.sm }}>
                      {item.quantity}
                    </Text>

                    <TouchableOpacity
                      style={[styles.qtyBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                      onPress={() => handleQuantityChange(index, 1)}
                    >
                      <Text variant="body" weight="bold" colorVariant="primary">
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Special Instructions */}
            <Text variant="label" weight="bold" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
              Special Instructions
            </Text>
            <TextInput
              style={[
                styles.instructionsInput,
                {
                  borderColor: colors.borderLight,
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                  borderRadius: borderRadius.md,
                  padding: spacing.sm,
                },
              ]}
              placeholder="Add notes for the laundry staff (e.g. gentle wash, no starch)..."
              placeholderTextColor={colors.textMuted}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
            />

            {/* Price Adjustment Summary */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.borderLight,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginTop: spacing.md,
                },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text variant="body" colorVariant="secondary">
                  Original Order Total:
                </Text>
                <Text variant="body" weight="bold" colorVariant="primary">
                  ₹{order?.totalAmount || 0}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text variant="body" colorVariant="secondary">
                  New Recalculated Total:
                </Text>
                <Text variant="body" weight="bold" style={{ color: colors.primary }}>
                  ₹{newTotal}
                </Text>
              </View>

              {diff < 0 && (
                <View style={[styles.adjustmentNotice, { backgroundColor: 'rgba(5, 150, 105, 0.1)', borderColor: '#059669' }]}>
                  <Text variant="caption" weight="bold" style={{ color: '#059669' }}>
                    {isPaidOnline
                      ? `✓ ₹${Math.abs(diff)} will be refunded to your payment method.`
                      : `✓ Your COD amount will be reduced by ₹${Math.abs(diff)}.`}
                  </Text>
                </View>
              )}

              {diff > 0 && (
                <View style={[styles.adjustmentNotice, { backgroundColor: 'rgba(217, 119, 6, 0.1)', borderColor: '#D97706' }]}>
                  <Text variant="caption" weight="bold" style={{ color: '#D97706' }}>
                    {isPaidOnline
                      ? `⚠️ Extra ₹${diff} will be collected in Cash / UPI upon delivery.`
                      : `ℹ️ Your COD amount will increase by ₹${diff}.`}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Button title="Cancel" variant="outline" size="md" fullWidth onPress={onClose} disabled={isLoading} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Save Changes"
                variant="primary"
                size="md"
                fullWidth
                loading={isLoading}
                onPress={handleSubmit}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxHeight: '90%',
    borderWidth: 1,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentScroll: {
    maxHeight: 380,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsInput: {
    borderWidth: 1,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  summaryCard: {
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  adjustmentNotice: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 16,
  },
});

export default EditOrderModal;
