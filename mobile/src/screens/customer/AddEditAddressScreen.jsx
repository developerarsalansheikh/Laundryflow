import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { customerService } from '../../services/customerService';

// RN-2 Design System Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const LABELS = [
  { id: 'home', label: '🏠 Home' },
  { id: 'office', label: '🏢 Office' },
  { id: 'other', label: '📍 Other' },
];

export const AddEditAddressScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();

  const editingAddress = route.params?.address;
  const isEditing = Boolean(editingAddress);

  // Form states
  const [label, setLabel] = useState(editingAddress?.label || 'home');
  const [fullAddress, setFullAddress] = useState(editingAddress?.fullAddress || '');
  const [landmark, setLandmark] = useState(editingAddress?.landmark || '');
  const [city, setCity] = useState(editingAddress?.city || '');
  const [stateName, setStateName] = useState(editingAddress?.state || '');
  const [pincode, setPincode] = useState(editingAddress?.pincode || '');
  const [isDefault, setIsDefault] = useState(editingAddress?.isDefault || false);
  const [errorMessage, setErrorMessage] = useState('');

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        label,
        fullAddress: fullAddress.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        isDefault,
      };

      if (isEditing) {
        return await customerService.updateAddress(editingAddress._id, payload);
      }
      return await customerService.addAddress(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      navigation.goBack();
    },
    onError: (err) => {
      setErrorMessage(err?.message || 'Failed to save address. Please check all fields.');
    },
  });

  const handleSubmit = () => {
    setErrorMessage('');

    if (!fullAddress.trim()) {
      setErrorMessage('Please enter your full address (house/flat no, street).');
      return;
    }
    if (!city.trim()) {
      setErrorMessage('Please enter the city.');
      return;
    }
    if (!stateName.trim()) {
      setErrorMessage('Please enter the state.');
      return;
    }
    if (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) {
      setErrorMessage('Please enter a valid 6-digit postal pincode.');
      return;
    }

    saveMutation.mutate();
  };

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: colors.background }}>
      <Header
        title={isEditing ? 'Edit Address' : 'Add New Address'}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {errorMessage ? (
            <View style={[styles.errorBox, { backgroundColor: colors.status.error + '15', borderColor: colors.status.error }]}>
              <Text variant="bodySmall" weight="semibold" style={{ color: colors.status.error }}>
                ⚠️ {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Label selector */}
          <Text variant="bodySmall" weight="bold" colorVariant="secondary" style={{ marginBottom: spacing.xs }}>
            ADDRESS TYPE
          </Text>
          <View style={styles.labelRow}>
            {LABELS.map((item) => {
              const isSelected = label === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.labelChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.borderLight,
                    },
                  ]}
                  onPress={() => setLabel(item.id)}
                >
                  <Text
                    variant="bodyMedium"
                    weight={isSelected ? 'bold' : 'normal'}
                    style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Form Card */}
          <Card variant="elevated" style={styles.formCard}>
            <Input
              label="Flat, House No., Building, Street Name *"
              placeholder="e.g. Flat 302, Sunrise Residency, 12th Main"
              value={fullAddress}
              onChangeText={setFullAddress}
              multiline
              numberOfLines={2}
            />

            <Input
              label="Landmark (Optional)"
              placeholder="e.g. Near HDFC Bank ATM"
              value={landmark}
              onChangeText={setLandmark}
            />

            <View style={styles.twoColumnRow}>
              <View style={styles.columnHalf}>
                <Input
                  label="City *"
                  placeholder="e.g. Bangalore"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={styles.columnHalf}>
                <Input
                  label="State *"
                  placeholder="e.g. Karnataka"
                  value={stateName}
                  onChangeText={setStateName}
                />
              </View>
            </View>

            <Input
              label="6-Digit Pincode *"
              placeholder="e.g. 560038"
              value={pincode}
              onChangeText={setPincode}
              keyboardType="numeric"
              maxLength={6}
            />

            {/* Default Address Toggle */}
            <View style={[styles.switchRow, { borderTopColor: colors.borderLight }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                  Set as Default Address
                </Text>
                <Text variant="caption" colorVariant="secondary">
                  Automatically pre-select this address during checkout.
                </Text>
              </View>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{ false: colors.borderLight, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.borderLight }]}>
        <Button
          title={isEditing ? 'Update Address' : 'Save Address'}
          variant="primary"
          size="lg"
          fullWidth
          loading={saveMutation.isPending}
          onPress={handleSubmit}
        />
      </View>
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
  labelRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  labelChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    padding: 16,
    borderRadius: 14,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  columnHalf: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 6,
    borderTopWidth: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});

export default AddEditAddressScreen;
