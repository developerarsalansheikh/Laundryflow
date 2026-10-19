import React, { useState } from 'react';
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

const CANCEL_REASONS = [
  'Changed my mind',
  'Found another laundry store',
  'Incorrect garments or quantities selected',
  'Pickup time slot no longer suitable',
  'Placed order by mistake',
  'Other',
];

export const CancelOrderModal = ({
  visible,
  onClose,
  onConfirmCancel,
  isLoading,
  order,
}) => {
  const { colors, spacing, borderRadius } = useTheme();
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  if (!visible) return null;

  const isPaidOnline = order?.isPaid && order?.paymentMethod === 'razorpay';
  const finalReason =
    selectedReason === 'Other'
      ? customReason.trim() || 'Other reason'
      : selectedReason;

  const handleConfirm = () => {
    onConfirmCancel(finalReason);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
          <View style={styles.header}>
            <Text variant="title" weight="bold" colorVariant="primary">
              Cancel Order
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text variant="body" weight="bold" colorVariant="secondary">
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <Text variant="body" colorVariant="secondary" style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
            Please select a reason for cancellation. Once cancelled, this action cannot be undone.
          </Text>

          {isPaidOnline && (
            <View
              style={[
                styles.refundNotice,
                {
                  backgroundColor: 'rgba(5, 150, 105, 0.1)',
                  borderColor: '#059669',
                  borderRadius: borderRadius.md,
                  padding: spacing.sm,
                  marginBottom: spacing.md,
                },
              ]}
            >
              <Text variant="caption" weight="bold" style={{ color: '#059669' }}>
                💳 Instant Auto-Refund
              </Text>
              <Text variant="caption" style={{ color: '#047857', marginTop: 2 }}>
                ₹{order?.totalAmount} will be refunded back to your original payment method.
              </Text>
            </View>
          )}

          <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
            {CANCEL_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    {
                      borderColor: isSelected ? colors.primary : colors.borderLight,
                      backgroundColor: isSelected ? colors.primaryLight || 'rgba(37, 99, 235, 0.08)' : colors.surface,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      marginBottom: spacing.xs,
                    },
                  ]}
                  onPress={() => setSelectedReason(reason)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {isSelected && <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text
                    variant="body"
                    weight={isSelected ? 'bold' : 'normal'}
                    style={{ color: isSelected ? colors.primary : colors.textPrimary, marginLeft: spacing.sm, flex: 1 }}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {selectedReason === 'Other' && (
              <TextInput
                style={[
                  styles.customInput,
                  {
                    borderColor: colors.borderLight,
                    backgroundColor: colors.background,
                    color: colors.textPrimary,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm,
                    marginTop: spacing.xs,
                  },
                ]}
                placeholder="Describe your reason..."
                placeholderTextColor={colors.textMuted}
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                numberOfLines={2}
              />
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Button title="Keep Order" variant="outline" size="md" fullWidth onPress={onClose} disabled={isLoading} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Yes, Cancel"
                variant="danger"
                size="md"
                fullWidth
                loading={isLoading}
                onPress={handleConfirm}
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
    padding: 20,
  },
  card: {
    width: '100%',
    maxHeight: '85%',
    borderWidth: 1,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refundNotice: {
    borderWidth: 1,
  },
  reasonsList: {
    maxHeight: 240,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  customInput: {
    borderWidth: 1,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 16,
  },
});

export default CancelOrderModal;
