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

const SUPPORT_CATEGORIES = [
  { label: 'Order Modification Request', value: 'order_issue' },
  { label: 'Cancellation & Refund Request', value: 'cancellation' },
  { label: 'Pickup or Delivery Delay', value: 'delivery_issue' },
  { label: 'Missing or Damaged Garments', value: 'damaged_item' },
  { label: 'Payment or Billing Inquiry', value: 'billing' },
  { label: 'General Help / Other', value: 'general' },
];

export const ContactSupportModal = ({
  visible,
  onClose,
  onSubmitTicket,
  isLoading,
  orderId,
  laundryName,
}) => {
  const { colors, spacing, borderRadius } = useTheme();

  const [category, setCategory] = useState(SUPPORT_CATEGORIES[0].value);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible) return null;

  const shortOrderId = orderId ? `#${orderId.slice(-6).toUpperCase()}` : '';

  const handleClose = () => {
    setSubmittedTicket(null);
    setErrorMessage('');
    setDescription('');
    setSubject('');
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (isLoading || isSubmitting) return;

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage('Please provide at least 10 characters describing your request.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);

    const autoSubject = subject.trim() || `${SUPPORT_CATEGORIES.find((c) => c.value === category)?.label} for Order ${shortOrderId}`;

    try {
      const res = await onSubmitTicket({
        orderId,
        category,
        subject: autoSubject,
        description: description.trim(),
        priority: category === 'cancellation' || category === 'damaged_item' ? 'high' : 'medium',
      });
      if (res?.data) {
        setSubmittedTicket(res.data);
      }
    } catch (err) {
      let friendlyError = 'Failed to submit request. Please retry.';
      const status = err?.response?.status;
      if (status === 404) {
        friendlyError = 'Support service is currently undergoing server updates. Please retry shortly or contact store directly.';
      } else if (status === 401) {
        friendlyError = 'Your session has expired. Please log in again to contact support.';
      } else if (status === 403) {
        friendlyError = 'You do not have permission to submit a ticket for this order.';
      } else if (err?.response?.data?.message) {
        friendlyError = err.response.data.message;
      } else if (!err?.response && (err?.message?.includes('Network') || err?.code === 'ECONNREFUSED')) {
        friendlyError = 'Network error. Please check your internet connection.';
      } else if (err?.message) {
        friendlyError = err.message;
      }
      setErrorMessage(friendlyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
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
            <Text variant="title" weight="bold" colorVariant="primary">
              Contact Order Support
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text variant="body" weight="bold" colorVariant="secondary">
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Success Confirmation State */}
          {submittedTicket ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
              <View
                style={[
                  styles.successIconBadge,
                  { backgroundColor: 'rgba(5, 150, 105, 0.1)', borderColor: '#059669', borderRadius: 30 },
                ]}
              >
                <Text style={{ fontSize: 32 }}>✓</Text>
              </View>

              <Text variant="title" weight="bold" style={{ color: '#059669', marginTop: spacing.md }}>
                Support Ticket Created
              </Text>

              <Text variant="body" weight="bold" colorVariant="primary" style={{ marginTop: spacing.xs }}>
                Ticket ID: {submittedTicket.ticketId}
              </Text>

              <Text
                variant="body"
                colorVariant="secondary"
                style={{ textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.sm }}
              >
                Our platform support desk will review your order details and contact you via your registered phone or email shortly.
              </Text>

              <View style={{ width: '100%', marginTop: spacing.xl }}>
                <Button title="Done" variant="primary" size="lg" fullWidth onPress={handleClose} />
              </View>
            </View>
          ) : (
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              {/* Order Context Banner */}
              <View
                style={[
                  styles.orderInfoBox,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.borderLight,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm,
                    marginTop: spacing.sm,
                    marginBottom: spacing.md,
                  },
                ]}
              >
                <Text variant="caption" weight="bold" colorVariant="secondary">
                  ORDER REFERENCE
                </Text>
                <Text variant="body" weight="bold" colorVariant="primary">
                  {shortOrderId} {laundryName ? `• ${laundryName}` : ''}
                </Text>
              </View>

              {/* Issue Category */}
              <Text variant="label" weight="bold" style={{ marginBottom: spacing.xs }}>
                Issue Category
              </Text>
              <View style={styles.categoriesContainer}>
                {SUPPORT_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.value;
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.catPill,
                        {
                          borderColor: isSelected ? colors.primary : colors.borderLight,
                          backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.08)' : colors.background,
                          borderRadius: borderRadius.md,
                          paddingVertical: spacing.xs + 2,
                          paddingHorizontal: spacing.sm,
                          marginRight: spacing.xs,
                          marginBottom: spacing.xs,
                        },
                      ]}
                      onPress={() => setCategory(cat.value)}
                    >
                      <Text
                        variant="caption"
                        weight={isSelected ? 'bold' : 'normal'}
                        style={{ color: isSelected ? colors.primary : colors.textPrimary }}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Description */}
              <Text variant="label" weight="bold" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
                Describe your request
              </Text>
              <TextInput
                style={[
                  styles.descInput,
                  {
                    borderColor: errorMessage ? '#DC2626' : colors.borderLight,
                    backgroundColor: colors.background,
                    color: colors.textPrimary,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm,
                  },
                ]}
                placeholder="Explain what assistance you need with this order..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={(t) => {
                  setDescription(t);
                  if (errorMessage) setErrorMessage('');
                }}
                multiline
                numberOfLines={4}
              />

              {Boolean(errorMessage) && (
                <Text variant="caption" style={{ color: '#DC2626', marginTop: 4 }}>
                  {errorMessage}
                </Text>
              )}

              <Text variant="caption" colorVariant="secondary" style={{ marginTop: spacing.sm, fontStyle: 'italic' }}>
                Note: Support tickets are attended by our customer care team within business hours.
              </Text>

              {/* Actions */}
              <View style={styles.footer}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    size="md"
                    fullWidth
                    onPress={handleClose}
                    disabled={isLoading || isSubmitting}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Submit Ticket"
                    variant="primary"
                    size="md"
                    fullWidth
                    loading={isLoading || isSubmitting}
                    disabled={isLoading || isSubmitting}
                    onPress={handleSubmit}
                  />
                </View>
              </View>
            </ScrollView>
          )}
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
    maxHeight: '85%',
    borderWidth: 1,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scrollArea: {
    maxHeight: 440,
  },
  orderInfoBox: {
    borderWidth: 1,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  catPill: {
    borderWidth: 1,
  },
  descInput: {
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  successIconBadge: {
    width: 60,
    height: 60,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 18,
    marginBottom: 6,
  },
});

export default ContactSupportModal;
