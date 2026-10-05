import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { adminService } from '../../services/adminService';
import { authService } from '../../services/authService';

// RN-2 UI Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Divider from '../../components/ui/Divider';
import Loader from '../../components/ui/Loader';
import ErrorState from '../../components/ui/ErrorState';

export const AdminProfileScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isDark = useUIStore((state) => state.theme === 'dark');
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  // Fetch Laundry Profile Query
  const {
    data: laundry,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-my-laundry', user?.laundryId || user?._id],
    queryFn: adminService.getMyLaundry,
    staleTime: 1000 * 60,
  });

  // Toggle Store Active Mutation
  const toggleStoreActiveMutation = useMutation({
    mutationFn: (newActive) => adminService.updateMyLaundry({ isActive: newActive }),
    onMutate: async (newActive) => {
      await queryClient.cancelQueries({ queryKey: ['admin-my-laundry', user?.laundryId || user?._id] });
      const previousData = queryClient.getQueryData(['admin-my-laundry', user?.laundryId || user?._id]);
      queryClient.setQueryData(['admin-my-laundry', user?.laundryId || user?._id], (old) =>
        old ? { ...old, isActive: newActive } : old
      );
      return { previousData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-my-laundry', user?.laundryId || user?._id] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard', user?.laundryId || user?._id] });
      Alert.alert(
        'Store Status Updated',
        `Store is now ${data?.isActive !== false ? 'ACTIVE and accepting customer orders' : 'INACTIVE and offline'}.`
      );
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['admin-my-laundry'], context.previousData);
      }
      Alert.alert('Update Failed', err.response?.data?.message || err.message || 'Could not update store status');
    },
  });

  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const handleLogout = () => {
    setSignOutModalVisible(false);
    authService.logout();
  };

  if (isLoading) {
    return (
      <ScreenContainer style={styles.centerContainer}>
        <Loader size="large" />
        <Text variant="body" colorVariant="secondary" style={{ marginTop: spacing.md }}>
          Loading store profile...
        </Text>
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer style={styles.centerContainer}>
        <ErrorState
          title="Could not load store details"
          message={error?.message || 'Failed to fetch laundry information.'}
          onRetry={refetch}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false} padding="none" style={styles.container}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <Text variant="h2" weight="bold" colorVariant="primary">
          Store & Account
        </Text>
        <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
          Operational settings for your laundry business
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Store Card */}
        <Card variant="elevated" style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Store Status Toggle Bar */}
          <View style={[styles.storeStatusRow, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.badgeRow}>
                <Badge
                  label={laundry?.isActive !== false ? 'ACTIVE STORE' : 'INACTIVE STORE'}
                  variant={laundry?.isActive !== false ? 'success' : 'neutral'}
                  size="sm"
                />
                {laundry?.city ? (
                  <Badge
                    label={laundry.city.toUpperCase()}
                    variant="neutral"
                    size="sm"
                    style={{ marginLeft: 6 }}
                  />
                ) : null}
              </View>
              <Text variant="caption" colorVariant="muted" style={{ marginTop: 4 }}>
                {laundry?.isActive !== false ? '🟢 Visible to customers' : '🔴 Store is offline'}
              </Text>
            </View>

            <View style={styles.toggleWrapper}>
              <Switch
                value={laundry?.isActive !== false}
                disabled={toggleStoreActiveMutation.isPending}
                onValueChange={(val) => toggleStoreActiveMutation.mutate(val)}
                trackColor={{ false: colors.borderLight, true: colors.primary }}
                thumbColor="#FFFFFF"
                style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
              />
            </View>
          </View>

          <View style={styles.storeHeader}>
            {laundry?.logo ? (
              <Image
                source={{ uri: laundry.logo }}
                style={{ width: 56, height: 56, borderRadius: 12, marginRight: 12 }}
                resizeMode="cover"
              />
            ) : null}
            <View style={{ flex: 1 }}>
              <Text variant="h2" weight="bold" colorVariant="primary">
                {laundry?.name || 'Laundry Business'}
              </Text>
              {laundry?.description ? (
                <Text variant="caption" colorVariant="muted" style={{ marginTop: 2 }}>
                  {laundry.description}
                </Text>
              ) : null}
            </View>
          </View>

          <Divider style={{ marginVertical: spacing.sm }} />

          {/* Details Grid */}
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text variant="caption" colorVariant="secondary">📞 Phone</Text>
              <Text variant="caption" weight="bold" colorVariant="primary" style={styles.detailValue}>
                {laundry?.phone || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text variant="caption" colorVariant="secondary">🕒 Hours</Text>
              <Text variant="caption" weight="bold" colorVariant="primary" style={styles.detailValue}>
                {laundry?.openTime || '09:00'} – {laundry?.closeTime || '21:00'}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text variant="caption" colorVariant="secondary">📍 Delivery Radius</Text>
              <Text variant="caption" weight="bold" colorVariant="primary" style={styles.detailValue}>
                {laundry?.serviceRadius || 5} km
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text variant="caption" colorVariant="secondary">💰 Driver Pay/Order</Text>
              <Text variant="caption" weight="bold" colorVariant="primary" style={styles.detailValue}>
                ₹{laundry?.deliveryPartnerEarningPerOrder || 50}
              </Text>
            </View>
          </View>

          {/* Address — full row so it can wrap */}
          <View style={[styles.detailItem, { marginTop: 6 }]}>
            <Text variant="caption" colorVariant="secondary">🏠 Address</Text>
            <Text
              variant="caption"
              colorVariant="primary"
              style={[styles.detailValue, { flexShrink: 1, textAlign: 'right' }]}
            >
              {[laundry?.address, laundry?.city, laundry?.pincode].filter(Boolean).join(', ') || 'N/A'}
            </Text>
          </View>

          {/* Working Days */}
          {laundry?.workingDays && laundry.workingDays.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text variant="caption" colorVariant="secondary" style={{ marginBottom: 4 }}>📅 Working Days</Text>
              <View style={styles.daysWrap}>
                {laundry.workingDays.map((day) => (
                  <View key={day} style={[styles.dayChip, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
                    <Text variant="caption" weight="bold" colorVariant="primary">{day.slice(0, 3)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Button
            title="Edit Store Profile"
            variant="outline"
            size="md"
            onPress={() => navigation.navigate('AdminEditProfile', { laundry })}
            style={{ marginTop: spacing.md }}
          />
        </Card>

        {/* Operational Modules Navigation */}
        <Text variant="subtitle" weight="bold" colorVariant="primary" style={{ marginTop: spacing.md, marginBottom: 8 }}>
          Business Operations
        </Text>

        <Card variant="elevated" style={[styles.menuCard, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => navigation.navigate('AdminTimeSlots')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>🕒</Text>
              <View style={{ marginLeft: 12 }}>
                <Text variant="body" weight="medium" colorVariant="primary">Weekly Time Slots</Text>
                <Text variant="caption" colorVariant="muted">Configure customer pickup time windows</Text>
              </View>
            </View>
            <Text style={{ color: colors.textSecondary }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => navigation.navigate('AdminCustomers')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>👥</Text>
              <View style={{ marginLeft: 12 }}>
                <Text variant="body" weight="medium" colorVariant="primary">Store Customers</Text>
                <Text variant="caption" colorVariant="muted">Client directory, order counts & lifetime spend</Text>
              </View>
            </View>
            <Text style={{ color: colors.textSecondary }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => navigation.navigate('AdminNotifications')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>🔔</Text>
              <View style={{ marginLeft: 12 }}>
                <Text variant="body" weight="medium" colorVariant="primary">Store Notifications</Text>
                <Text variant="caption" colorVariant="muted">System alerts, new orders & dispatch logs</Text>
              </View>
            </View>
            <Text style={{ color: colors.textSecondary }}>→</Text>
          </TouchableOpacity>
        </Card>

        {/* App Preferences */}
        <Text variant="subtitle" weight="bold" colorVariant="primary" style={{ marginTop: spacing.md, marginBottom: 8 }}>
          Preferences
        </Text>

        <Card variant="elevated" style={[styles.menuCard, { backgroundColor: colors.surface }]}>
          <View style={styles.preferenceRow}>
            <View>
              <Text variant="body" weight="medium" colorVariant="primary">
                Dark Mode
              </Text>
              <Text variant="caption" colorVariant="muted">
                Switch between Light (default) and Dark theme
              </Text>
            </View>

            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Sign Out Button */}
        <Button
          title="Sign Out of Admin"
          variant="outline"
          size="lg"
          onPress={() => setSignOutModalVisible(true)}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={signOutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSignOutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text variant="h3" weight="bold" colorVariant="primary" style={{ textAlign: 'center' }}>
              Sign out?
            </Text>
            <Text
              variant="body"
              colorVariant="secondary"
              style={{ textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg }}
            >
              Are you sure you want to sign out?
            </Text>
            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setSignOutModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Sign Out"
                variant="primary"
                size="md"
                onPress={handleLogout}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  storeStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  toggleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  detailItem: {
    width: '50%',
    paddingVertical: 5,
    paddingRight: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailValue: {
    marginLeft: 4,
    flexShrink: 1,
    textAlign: 'right',
  },
  daysWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  menuCard: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 20,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalBtnRow: {
    flexDirection: 'row',
  },
});

export default AdminProfileScreen;
