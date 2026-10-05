import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { adminService } from '../../services/adminService';

// RN-2 Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Divider from '../../components/ui/Divider';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

export const AdminNotificationsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  // Fetch Notifications Query
  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: adminService.getNotifications,
    staleTime: 1000 * 20,
  });

  // Mark Single as Read Mutation
  const markReadMutation = useMutation({
    mutationFn: (id) => adminService.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  // Mark All Read Mutation
  const markAllReadMutation = useMutation({
    mutationFn: adminService.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      Alert.alert('Updated', 'All notifications marked as read.');
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderNotificationItem = ({ item }) => {
    const isUnread = !item.isRead;
    const timeFormatted = new Date(item.createdAt).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        onPress={() => {
          if (isUnread) markReadMutation.mutate(item._id);
          const orderId = item.orderId || item.data?.orderId || item.metadata?.orderId || item.relatedId;
          if (orderId) {
            navigation.navigate('AdminOrderDetail', { orderId });
          }
        }}
        activeOpacity={0.7}
      >
        <Card
          variant="elevated"
          style={[
            styles.notifCard,
            {
              backgroundColor: isUnread ? colors.surface : colors.background,
              borderColor: isUnread ? colors.primary : colors.borderLight,
              borderWidth: isUnread ? 1.5 : 1,
            },
          ]}
        >
          <View style={styles.notifHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>🔔</Text>
              <Text variant="subtitle" weight={isUnread ? 'bold' : 'medium'} colorVariant="primary">
                {item.title || 'Store Update'}
              </Text>
            </View>

            {isUnread && <Badge label="NEW" variant="warning" size="sm" />}
          </View>

          <Text variant="body" colorVariant="secondary" style={{ marginTop: 6 }}>
            {item.message || item.body || ''}
          </Text>

          <Text variant="caption" colorVariant="muted" style={{ marginTop: 6 }}>
            {timeFormatted}
          </Text>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={{ fontSize: 18, color: colors.primary }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text variant="h2" weight="bold" colorVariant="primary">
              Notifications
            </Text>
            <Text variant="caption" colorVariant="secondary">
              {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
            </Text>
          </View>

          {unreadCount > 0 && (
            <Button
              title="Mark All Read"
              variant="outline"
              size="sm"
              isLoading={markAllReadMutation.isPending}
              onPress={() => markAllReadMutation.mutate()}
            />
          )}
        </View>
      </View>

      {/* Notifications List */}
      {isLoading && !isRefetching ? (
        <View style={styles.centerContainer}>
          <Loader size="large" />
          <Text variant="body" colorVariant="secondary" style={{ marginTop: spacing.md }}>
            Loading store notifications...
          </Text>
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <ErrorState
            title="Failed to load notifications"
            message={error?.message || 'Could not fetch notification feed.'}
            onRetry={refetch}
          />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No notifications yet"
              description="New order alerts, customer notes, and delivery updates will appear here."
            />
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 6,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notifCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default AdminNotificationsScreen;
