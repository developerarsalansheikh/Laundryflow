import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Text from './ui/Text';

/**
 * LaundryFlow SingleLaundryConflictModal
 * 
 * Displayed when customer attempts to add a service from a new laundry
 * while their cart already contains items from a different laundry.
 * Provides two clear actions:
 * 1. Keep Current Laundry (Preserves cart, closes modal)
 * 2. Clear Cart & Switch (Clears cart and adds new laundry's service)
 */
export const SingleLaundryConflictModal = ({
  visible = false,
  onClose,
  currentLaundryName = 'Another Store',
  newLaundryName = 'This Store',
  onKeepCurrent,
  onClearAndSwitch,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      position="bottom"
      title="Replace cart items?"
      description="Your current cart contains items from another laundry."
      footer={
        <View style={styles.footerContainer}>
          <Button
            title="Keep Current Laundry"
            variant="outline"
            size="lg"
            fullWidth
            onPress={onKeepCurrent || onClose}
            style={{ marginBottom: spacing.sm }}
          />
          <Button
            title="Clear Cart & Switch"
            variant="danger"
            size="lg"
            fullWidth
            onPress={onClearAndSwitch}
          />
        </View>
      }
    >
      <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text variant="bodySmall" colorVariant="secondary">
          Current cart belongs to:
        </Text>
        <Text variant="bodyMedium" weight="bold" colorVariant="primary" style={{ marginTop: 2 }}>
          🏬 {currentLaundryName}
        </Text>
        <Text variant="caption" colorVariant="muted" style={{ marginTop: spacing.xs }}>
          Switching to <Text variant="caption" weight="bold" colorVariant="primary">{newLaundryName}</Text> will discard the items currently in your basket because each order can only be processed by one laundry store.
        </Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    width: '100%',
    alignItems: 'stretch',
  },
  infoBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 4,
  },
});

export default SingleLaundryConflictModal;
