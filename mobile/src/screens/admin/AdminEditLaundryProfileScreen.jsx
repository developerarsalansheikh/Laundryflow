import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { adminService } from '../../services/adminService';
import { ASSETS } from '../../assets';
import { promptImageSource } from '../../utils/imagePickerHelper';

// RN-2 Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Divider from '../../components/ui/Divider';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const AdminEditLaundryProfileScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { laundry } = route.params || {};

  const [name, setName] = useState(laundry?.name || '');
  const [description, setDescription] = useState(laundry?.description || '');
  const [logo, setLogo] = useState(laundry?.logo || '');
  const [selectedPhotoAsset, setSelectedPhotoAsset] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [phone, setPhone] = useState(laundry?.phone || '');
  const [address, setAddress] = useState(laundry?.address || '');
  const [city, setCity] = useState(laundry?.city || '');
  const [state, setState] = useState(laundry?.state || '');
  const [pincode, setPincode] = useState(laundry?.pincode || '');
  const [openTime, setOpenTime] = useState(laundry?.openTime || '09:00');
  const [closeTime, setCloseTime] = useState(laundry?.closeTime || '21:00');
  const [serviceRadius, setServiceRadius] = useState(String(laundry?.serviceRadius || 5));
  const [driverPay, setDriverPay] = useState(String(laundry?.deliveryPartnerEarningPerOrder || 50));
  const [selectedDays, setSelectedDays] = useState(laundry?.workingDays || DAYS_OF_WEEK);
  const [errors, setErrors] = useState({});

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) {
        Alert.alert('Selection Error', 'Store must be open on at least one day.');
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (payload) => adminService.updateMyLaundry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-my-laundry'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      Alert.alert('Store Updated', 'Your store profile changes have been saved.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err) => {
      Alert.alert('Update Failed', err.response?.data?.message || err.message);
    },
  });

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Store name is required';
    if (!/^\d{10}$/.test(phone.trim())) errs.phone = 'Valid 10-digit phone number is required';
    if (!address.trim()) errs.address = 'Street address is required';
    if (!city.trim()) errs.city = 'City is required';
    if (!pincode.trim()) errs.pincode = 'Pincode is required';
    if (isNaN(Number(serviceRadius)) || Number(serviceRadius) <= 0) {
      errs.serviceRadius = 'Valid radius in km is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (selectedPhotoAsset) {
      const formData = new FormData();
      formData.append('logo', {
        uri: selectedPhotoAsset.uri,
        name: selectedPhotoAsset.fileName || 'laundry-logo.jpg',
        type: selectedPhotoAsset.type || 'image/jpeg',
      });
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('phone', phone.trim());
      formData.append('address', address.trim());
      formData.append('city', city.trim());
      formData.append('state', state.trim());
      formData.append('pincode', pincode.trim());
      formData.append('openTime', openTime.trim());
      formData.append('closeTime', closeTime.trim());
      formData.append('serviceRadius', String(Number(serviceRadius)));
      formData.append('deliveryPartnerEarningPerOrder', String(Number(driverPay)));
      selectedDays.forEach((day) => formData.append('workingDays[]', day));
      updateMutation.mutate(formData);
    } else {
      updateMutation.mutate({
        name: name.trim(),
        description: description.trim(),
        logo: logo.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        openTime: openTime.trim(),
        closeTime: closeTime.trim(),
        workingDays: selectedDays,
        serviceRadius: Number(serviceRadius),
        deliveryPartnerEarningPerOrder: Number(driverPay),
      });
    }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={{ fontSize: 18, color: colors.primary }}>←</Text>
        </TouchableOpacity>
        <Text variant="h2" weight="bold" colorVariant="primary" style={{ marginLeft: 8 }}>
          Edit Store Profile
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Card variant="elevated" style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <Text variant="subtitle" weight="bold" colorVariant="primary" style={{ marginBottom: 12 }}>
            Store Image & Branding
          </Text>

          <View style={styles.imagePreviewRow}>
            <Image
              source={
                selectedPhotoAsset?.uri
                  ? { uri: selectedPhotoAsset.uri }
                  : logo && !imageError
                  ? { uri: logo }
                  : ASSETS.illustrations.washingMachine
              }
              style={styles.imagePreview}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Button
                title="📸 Choose Photo (Gallery)"
                variant="outline"
                size="sm"
                onPress={() => {
                  promptImageSource((asset) => {
                    setSelectedPhotoAsset(asset);
                    setImageError(false);
                  });
                }}
              />
              <Input
                label="Or Store Image URL"
                placeholder="https://example.com/store-photo.jpg"
                value={logo}
                onChangeText={(text) => {
                  setLogo(text);
                  setSelectedPhotoAsset(null);
                  setImageError(false);
                }}
                autoCapitalize="none"
                containerStyle={{ marginTop: 8 }}
              />
              <Text variant="caption" colorVariant="muted" style={{ marginTop: 4 }}>
                Displayed to customers across marketplace and detail pages.
              </Text>
            </View>
          </View>

          <Divider style={{ marginVertical: spacing.md }} />

          <Text variant="subtitle" weight="bold" colorVariant="primary" style={{ marginBottom: 12 }}>
            Basic Information
          </Text>

          <Input
            label="Store Name *"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((p) => ({ ...p, name: null }));
            }}
            error={errors.name}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Input
            label="Store Phone (10 digits) *"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (errors.phone) setErrors((p) => ({ ...p, phone: null }));
            }}
            error={errors.phone}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Input
            label="Store Tagline / Description"
            multiline
            numberOfLines={2}
            value={description}
            onChangeText={setDescription}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Divider style={{ marginVertical: spacing.md }} />

          <Text variant="subtitle" weight="bold" colorVariant="primary" style={{ marginBottom: 12 }}>
            Address & Coverage
          </Text>

          <Input
            label="Street Address *"
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              if (errors.address) setErrors((p) => ({ ...p, address: null }));
            }}
            error={errors.address}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="City *"
                value={city}
                onChangeText={(text) => {
                  setCity(text);
                  if (errors.city) setErrors((p) => ({ ...p, city: null }));
                }}
                error={errors.city}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Pincode *"
                keyboardType="numeric"
                maxLength={6}
                value={pincode}
                onChangeText={(text) => {
                  setPincode(text);
                  if (errors.pincode) setErrors((p) => ({ ...p, pincode: null }));
                }}
                error={errors.pincode}
              />
            </View>
          </View>

          <View style={[styles.row, { marginTop: spacing.md }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="Delivery Radius (km) *"
                keyboardType="numeric"
                value={serviceRadius}
                onChangeText={setServiceRadius}
                error={errors.serviceRadius}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Driver Pay / Order (₹)"
                keyboardType="numeric"
                value={driverPay}
                onChangeText={setDriverPay}
              />
            </View>
          </View>

          <Divider style={{ marginVertical: spacing.md }} />

          <Text variant="subtitle" weight="bold" colorVariant="primary" style={{ marginBottom: 12 }}>
            Operating Hours & Schedule
          </Text>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="Opening Time"
                placeholder="09:00"
                value={openTime}
                onChangeText={setOpenTime}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Closing Time"
                placeholder="21:00"
                value={closeTime}
                onChangeText={setCloseTime}
              />
            </View>
          </View>

          <Text variant="caption" weight="bold" colorVariant="secondary" style={{ marginTop: 12, marginBottom: 8 }}>
            Working Days (tap to toggle)
          </Text>

          <View style={styles.daysWrap}>
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => toggleDay(day)}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      borderColor: isSelected ? colors.primary : colors.borderLight,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    variant="caption"
                    weight={isSelected ? 'bold' : 'normal'}
                    style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary }}
                  >
                    {day.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Divider style={{ marginVertical: spacing.lg }} />

          <Button
            title="Save Profile Changes"
            variant="primary"
            size="lg"
            loading={updateMutation.isPending}
            disabled={updateMutation.isPending}
            onPress={handleSubmit}
          />
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 6,
  },
  body: {
    padding: 16,
  },
  formCard: {
    padding: 16,
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
  },
  daysWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  imagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  imagePreview: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
});

export default AdminEditLaundryProfileScreen;
