import React from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { deliveryService } from '../../services/deliveryService';
import { socketService } from '../../services/socketService';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Divider from '../../components/ui/Divider';

export const DeliveryProfileScreen = () => {
  const { colors, spacing } = useTheme();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // Fetch Delivery Partner Stats
  const { data: stats } = useQuery({
    queryKey: ['deliveryStats'],
    queryFn: deliveryService.getStats,
  });

  const currentStatus = user?.availabilityStatus || (user?.isAvailable ? 'available' : 'offline');

  const availabilityMutation = useMutation({
    mutationFn: (newStatus) => deliveryService.updateAvailability(newStatus),
    onMutate: async (newStatus) => {
      const prevUser = useAuthStore.getState().user;
      useAuthStore.getState().setUser({
        ...prevUser,
        availabilityStatus: newStatus,
        isAvailable: newStatus === 'available',
      });
      return { prevUser };
    },
    onSuccess: (data, newStatus) => {
      if (data?.data) {
        useAuthStore.getState().setUser(data.data);
      }
      socketService.setDriverAvailability(newStatus, newStatus === 'available');
      queryClient.invalidateQueries({ queryKey: ['deliveryStats'] });
      Alert.alert(
        'Status Updated',
        `Your duty status is now set to ${newStatus === 'available' ? 'ONLINE' : newStatus === 'busy' ? 'BUSY' : 'OFFLINE'}.`
      );
    },
    onError: (err, _vars, context) => {
      if (context?.prevUser) {
        useAuthStore.getState().setUser(context.prevUser);
      }
      Alert.alert('Error', err?.response?.data?.message || 'Could not update status.');
    },
  });

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <Header title="Delivery Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card variant="elevated" style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
              <Text variant="h2" weight="bold" style={{ color: colors.primary }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'D'}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text variant="title" weight="bold" colorVariant="primary">
                {user?.name || 'Delivery Partner'}
              </Text>
              <Text variant="caption" colorVariant="secondary">
                +91 {user?.phone || 'Phone not set'}
              </Text>
              {Boolean(user?.email) && (
                <Text variant="caption" colorVariant="muted" numberOfLines={1}>
                  {user.email}
                </Text>
              )}
            </View>

            <Badge label="DELIVERY" variant="primary" size="sm" />
          </View>
        </Card>

        {/* Availability Controls */}
        <Card variant="elevated" style={styles.card}>
          <View style={styles.dutyHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Badge
                  label={currentStatus === 'available' ? 'ONLINE • AVAILABLE' : currentStatus === 'busy' ? 'BUSY' : 'OFFLINE'}
                  variant={currentStatus === 'available' ? 'success' : currentStatus === 'busy' ? 'warning' : 'neutral'}
                  size="sm"
                />
              </View>
              <Text variant="caption" colorVariant="muted" style={{ marginTop: 4 }}>
                {currentStatus === 'available' ? 'Receiving Assignments' : currentStatus === 'busy' ? 'Temporarily Busy' : 'Assignments Paused'}
              </Text>
            </View>

            <Button
              title={currentStatus === 'available' ? 'Go Offline' : 'Go Online'}
              variant={currentStatus === 'available' ? 'outline' : 'primary'}
              size="sm"
              loading={availabilityMutation.isPending}
              onPress={() => {
                const next = currentStatus === 'available' ? 'offline' : 'available';
                availabilityMutation.mutate(next);
              }}
            />
          </View>

          <Divider style={{ marginVertical: spacing.sm }} />

          <View style={styles.statusButtonsRow}>
            <Button
              title="Online"
              variant={currentStatus === 'available' ? 'primary' : 'outline'}
              size="sm"
              style={{ flex: 1 }}
              loading={availabilityMutation.isPending && availabilityMutation.variables === 'available'}
              onPress={() => availabilityMutation.mutate('available')}
            />
            <Button
              title="Busy"
              variant={currentStatus === 'busy' ? 'secondary' : 'outline'}
              size="sm"
              style={{ flex: 1 }}
              loading={availabilityMutation.isPending && availabilityMutation.variables === 'busy'}
              onPress={() => availabilityMutation.mutate('busy')}
            />
            <Button
              title="Offline"
              variant={currentStatus === 'offline' ? 'neutral' : 'outline'}
              size="sm"
              style={{ flex: 1 }}
              loading={availabilityMutation.isPending && availabilityMutation.variables === 'offline'}
              onPress={() => availabilityMutation.mutate('offline')}
            />
          </View>
        </Card>

        {/* Performance Statistics Card */}
        <Card variant="outlined" style={styles.card}>
          <Text variant="title" weight="bold" colorVariant="primary" style={{ marginBottom: spacing.sm }}>
            Lifetime Performance
          </Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { borderColor: colors.borderLight }]}>
              <Text variant="h2" weight="bold" colorVariant="primary">
                {stats?.totalDeliveries !== undefined ? stats.totalDeliveries : user?.totalDeliveries || 0}
              </Text>
              <Text variant="caption" colorVariant="secondary">
                Deliveries
              </Text>
            </View>

            <View style={[styles.statBox, { borderColor: colors.borderLight }]}>
              <Text variant="h2" weight="bold" style={{ color: colors.status.success }}>
                ₹{stats?.totalEarnings !== undefined ? stats.totalEarnings : user?.totalEarnings || 0}
              </Text>
              <Text variant="caption" colorVariant="secondary">
                Earnings
              </Text>
            </View>

            <View style={[styles.statBox, { borderColor: colors.borderLight }]}>
              <Text variant="h2" weight="bold" style={{ color: colors.status.warning }}>
                {stats?.averageRating ? `${stats.averageRating}★` : '5.0★'}
              </Text>
              <Text variant="caption" colorVariant="secondary">
                Rating
              </Text>
            </View>
          </View>
        </Card>

        {/* Account Actions */}
        <Card variant="default" style={styles.card}>
          <Button
            title="Sign Out"
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleLogout}
          />
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    marginBottom: 14,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dutyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DeliveryProfileScreen;
