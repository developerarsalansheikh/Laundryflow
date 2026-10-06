import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useFavoriteStore } from '../../store/favoriteStore';
import { useLocationStore } from '../../store/locationStore';
import { authService } from '../../services/authService';
import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import { promptImageSource } from '../../utils/imagePickerHelper';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/ui/Icon';

export const CustomerSettingsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const favoriteIds = useFavoriteStore((state) => state.favoriteIds);
  const currentCity = useLocationStore((state) => state.city);

  // Sync authoritative fresh profile for authenticated user
  const { data: serverProfile } = useQuery({
    queryKey: ['userProfile', user?._id],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.USERS.PROFILE);
      if (res.data?.data) {
        useAuthStore.getState().setUser(res.data.data);
      }
      return res.data?.data;
    },
    enabled: Boolean(isAuthenticated),
    staleTime: 1000 * 10,
  });

  const activeUser = serverProfile || user;

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Edit Profile States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [selectedPhotoAsset, setSelectedPhotoAsset] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const handleOpenEdit = () => {
    setEditName(activeUser?.name || '');
    setEditPhone(activeUser?.phone || '');
    setEditEmail(activeUser?.email || '');
    setSelectedPhotoAsset(null);
    setEditModalVisible(true);
  };

  const handlePickPhoto = () => {
    promptImageSource((asset) => {
      if (asset?.uri) {
        setSelectedPhotoAsset(asset);
      }
    });
  };

  const handleDirectAvatarChange = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    promptImageSource(async (asset) => {
      if (!asset?.uri) return;
      setSavingProfile(true);
      try {
        const formData = new FormData();
        const cleanUri = Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', '');
        formData.append('image', {
          uri: cleanUri,
          name: asset.fileName || `avatar_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        });
        const uploadRes = await authService.updateProfileImage(formData);
        if (uploadRes?.data?.profileImage) {
          useAuthStore.getState().setUser({
            ...useAuthStore.getState().user,
            profileImage: uploadRes.data.profileImage,
          });
        }
        await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        Alert.alert('Profile Photo Updated', 'Your profile picture has been updated successfully!');
      } catch (err) {
        Alert.alert('Upload Failed', err?.response?.data?.message || err?.message || 'Failed to upload profile photo.');
      } finally {
        setSavingProfile(false);
      }
    });
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Please enter your name.');
      return;
    }
    const cleanPhone = editPhone.trim().replace(/\D/g, '');
    if (cleanPhone && cleanPhone.length !== 10) {
      Alert.alert('Validation Error', 'Phone number must be exactly 10 digits.');
      return;
    }

    setSavingProfile(true);
    try {
      if (selectedPhotoAsset?.uri) {
        const formData = new FormData();
        const cleanUri = Platform.OS === 'android' ? selectedPhotoAsset.uri : selectedPhotoAsset.uri.replace('file://', '');
        formData.append('image', {
          uri: cleanUri,
          name: selectedPhotoAsset.fileName || `avatar_${Date.now()}.jpg`,
          type: selectedPhotoAsset.type || 'image/jpeg',
        });
        const uploadRes = await authService.updateProfileImage(formData);
        if (uploadRes?.data?.profileImage) {
          useAuthStore.getState().setUser({
            ...useAuthStore.getState().user,
            profileImage: uploadRes.data.profileImage,
          });
        }
      }

      const updatedUserRes = await authService.updateProfile({
        name: editName.trim(),
        phone: cleanPhone || undefined,
        email: editEmail.trim() || undefined,
      });

      if (updatedUserRes?.data) {
        useAuthStore.getState().setUser(updatedUserRes.data);
      }
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });

      setEditModalVisible(false);
      Alert.alert('Profile Saved', 'Your profile details have been saved successfully.');
    } catch (err) {
      Alert.alert('Update Failed', err?.response?.data?.message || err?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await authService.logout();
      setLogoutModalVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch {
      useAuthStore.getState().logout();
      setLogoutModalVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } finally {
      setLoggingOut(false);
    }
  };

  const handleToggleTheme = (value) => {
    setTheme(value ? 'dark' : 'light');
  };

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text variant="h2" weight="bold" colorVariant="primary">
            Settings & Account
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDirectAvatarChange}
              style={styles.avatarTouchable}
            >
              {activeUser?.profileImage ? (
                <Image source={{ uri: activeUser.profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                  <Text variant="h2" weight="bold" style={{ color: '#FFFFFF' }}>
                    {activeUser?.name ? activeUser.name.charAt(0).toUpperCase() : 'G'}
                  </Text>
                </View>
              )}
              {isAuthenticated && (
                <View style={[styles.avatarCameraBadge, { backgroundColor: colors.primary }]}>
                  {savingProfile ? (
                    <ActivityIndicator size={10} color="#FFFFFF" />
                  ) : (
                    <Text style={{ fontSize: 10 }}>📷</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text variant="title" weight="bold" colorVariant="primary">
                {isAuthenticated ? (activeUser?.name || 'LaundryFlow Customer') : 'Guest Customer'}
              </Text>
              <Text variant="caption" colorVariant="secondary">
                {isAuthenticated ? (activeUser?.phone ? `+91 ${activeUser.phone}` : (activeUser?.email || 'Logged in')) : 'Sign in to sync orders & addresses'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                <Badge
                  label={isAuthenticated ? 'Verified Customer' : 'Browsing Mode'}
                  variant={isAuthenticated ? 'success' : 'neutral'}
                  size="sm"
                />
                {currentCity ? (
                  <Badge label={`📍 ${currentCity}`} variant="info" size="sm" />
                ) : null}
              </View>
            </View>
          </View>

          {isAuthenticated ? (
            <Button
              title="✏️ Edit Profile & Photo"
              variant="outline"
              size="sm"
              onPress={handleOpenEdit}
              style={{ marginTop: 12 }}
            />
          ) : (
            <Button
              title="Sign In / Register"
              size="sm"
              onPress={() => navigation.navigate('Login')}
              style={{ marginTop: 12 }}
            />
          )}
        </Card>

        {/* ACCOUNT SECTION */}
        <View style={styles.section}>
          <Text variant="caption" weight="bold" colorVariant="muted" style={styles.sectionTitle}>
            ACCOUNT
          </Text>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={() => {
              if (!isAuthenticated) {
                navigation.navigate('Login');
              } else {
                navigation.navigate('AddressList');
              }
            }}
          >
            <Text style={styles.menuIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                Saved Addresses
              </Text>
              <Text variant="caption" colorVariant="secondary">
                Manage home, office, and doorstep pickup locations
              </Text>
            </View>
            <Text variant="bodyMedium" colorVariant="muted">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={() => {
              if (!isAuthenticated) {
                navigation.navigate('Login');
              } else {
                navigation.navigate('MyOrders');
              }
            }}
          >
            <Text style={styles.menuIcon}>📦</Text>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                Order History
              </Text>
              <Text variant="caption" colorVariant="secondary">
                View active bookings and completed orders
              </Text>
            </View>
            <Text variant="bodyMedium" colorVariant="muted">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={() => navigation.navigate('SelectLocation', { isMandatory: false })}
          >
            <Text style={styles.menuIcon}>🗺️</Text>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                Change Service Location
              </Text>
              <Text variant="caption" colorVariant="secondary">
                Currently: {currentCity || 'Not selected'}
              </Text>
            </View>
            <Text variant="bodyMedium" colorVariant="muted">›</Text>
          </TouchableOpacity>

          <View style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={styles.menuIcon}>❤️</Text>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                Favorite Laundries
              </Text>
              <Text variant="caption" colorVariant="secondary">
                {favoriteIds.length} saved {favoriteIds.length === 1 ? 'store' : 'stores'} (contextually available)
              </Text>
            </View>
          </View>
        </View>

        {/* PREFERENCES SECTION */}
        <View style={styles.section}>
          <Text variant="caption" weight="bold" colorVariant="muted" style={styles.sectionTitle}>
            PREFERENCES
          </Text>

          <View style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={styles.menuIcon}>{theme === 'dark' ? '🌙' : '☀️'}</Text>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                Dark Mode
              </Text>
              <Text variant="caption" colorVariant="secondary">
                {theme === 'dark' ? 'Dark theme active' : 'Light theme (Default)'}
              </Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={handleToggleTheme}
              trackColor={{ false: '#CBD5E1', true: colors.primary }}
              thumbColor={theme === 'dark' ? '#FFFFFF' : '#F8FAFC'}
            />
          </View>

          <View style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={styles.menuIcon}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                Order Notifications
              </Text>
              <Text variant="caption" colorVariant="secondary">
                Push alerts for pickup, washing, and delivery
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#CBD5E1', true: colors.primary }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#F8FAFC'}
            />
          </View>
        </View>

        {/* SUPPORT SECTION */}
        <View style={styles.section}>
          <Text variant="caption" weight="bold" colorVariant="muted" style={styles.sectionTitle}>
            SUPPORT & LEGAL
          </Text>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={() =>
              Alert.alert(
                'Help & Support',
                'For customer support, reach our 24/7 helpline at support@laundryflow.in or call 1800-LAUNDRY.'
              )
            }
          >
            <Text style={styles.menuIcon}>💬</Text>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                Help & Support
              </Text>
              <Text variant="caption" colorVariant="secondary">
                FAQs and instant assistance
              </Text>
            </View>
            <Text variant="bodyMedium" colorVariant="muted">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={() =>
              Alert.alert(
                'About LaundryFlow',
                'LaundryFlow v1.0.0\nA production-grade laundry & dry cleaning marketplace connecting customers with verified neighborhood laundry stores.'
              )
            }
          >
            <Text style={styles.menuIcon}>ℹ️</Text>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                About LaundryFlow
              </Text>
              <Text variant="caption" colorVariant="secondary">
                Version 1.0.0
              </Text>
            </View>
            <Text variant="bodyMedium" colorVariant="muted">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={() =>
              Alert.alert(
                'Terms & Conditions',
                'Standard terms of service apply. Orders are fulfilled by licensed laundry partners subject to distance, minimum order, and serviceability checks.'
              )
            }
          >
            <Text style={styles.menuIcon}>📄</Text>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                Terms & Conditions
              </Text>
            </View>
            <Text variant="bodyMedium" colorVariant="muted">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={() =>
              Alert.alert(
                'Privacy Policy',
                'Your personal details, order addresses, and contact numbers are encrypted and protected under strict data security policies.'
              )
            }
          >
            <Text style={styles.menuIcon}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                Privacy Policy
              </Text>
            </View>
            <Text variant="bodyMedium" colorVariant="muted">›</Text>
          </TouchableOpacity>
        </View>

        {/* LOGOUT BUTTON */}
        {isAuthenticated && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.logoutBtn, { borderColor: colors.status.error }]}
              onPress={() => setLogoutModalVisible(true)}
            >
              <Text variant="bodyMedium" weight="bold" style={{ color: colors.status.error }}>
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContent, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text variant="title" weight="bold" colorVariant="primary">
                Edit Profile & Photo
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text variant="title" weight="bold" colorVariant="muted">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Photo Upload Section */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                {selectedPhotoAsset?.uri || user?.profileImage ? (
                  <Image
                    source={{ uri: selectedPhotoAsset?.uri || user.profileImage }}
                    style={styles.editAvatarImage}
                  />
                ) : (
                  <View style={[styles.editAvatarFallback, { backgroundColor: colors.primary }]}>
                    <Text variant="h1" weight="bold" style={{ color: '#FFFFFF' }}>
                      {editName ? editName.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                <Button
                  title="📸 Select Photo from Gallery / Camera"
                  variant="outline"
                  size="sm"
                  onPress={handlePickPhoto}
                  style={{ marginTop: 8 }}
                />
              </View>

              <Input
                label="Full Name *"
                placeholder="Enter your full name"
                value={editName}
                onChangeText={setEditName}
                containerStyle={{ marginBottom: 12 }}
              />

              <Input
                label="Phone Number"
                placeholder="10-digit mobile number"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                maxLength={10}
                containerStyle={{ marginBottom: 12 }}
              />

              <Input
                label="Email Address"
                placeholder="name@example.com"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                containerStyle={{ marginBottom: 16 }}
              />
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                style={{ flex: 1 }}
                onPress={() => setEditModalVisible(false)}
              />
              <Button
                title={savingProfile ? 'Saving...' : 'Save Profile'}
                variant="primary"
                size="md"
                loading={savingProfile}
                disabled={savingProfile}
                style={{ flex: 1 }}
                onPress={handleSaveProfile}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContent}>
            <Text variant="h3" weight="bold" colorVariant="primary" style={{ marginBottom: 8 }}>
              Confirm Logout
            </Text>
            <Text variant="bodyMedium" colorVariant="secondary" style={{ marginBottom: 20 }}>
              Are you sure you want to log out?
            </Text>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setLogoutModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={loggingOut ? 'Logging out...' : 'Log Out'}
                variant="danger"
                size="md"
                loading={loggingOut}
                onPress={handleLogoutConfirm}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  editModalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    padding: 20,
    borderRadius: 16,
  },
  editAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editAvatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  logoutBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    padding: 20,
    borderRadius: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default CustomerSettingsScreen;
