import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { deliveryService } from '../../services/deliveryService';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';

export const DeliveryNotificationsScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();

  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['deliveryNotifications'],
    queryFn: deliveryService.getNotifications,
  });

  const renderItem = ({ item }) => {
    return (
      <Card variant="outlined" style={styles.notificationCard}>
        <View style={styles.cardHeader}>
          <Text variant="bodyMedium" weight="bold" colorVariant="primary">
            {item.title || 'Dispatch Alert'}
          </Text>
          <Badge label={item.type || 'SYSTEM'} variant="neutral" size="xs" />
        </View>

        <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4 }}>
          {item.message || item.body || 'No description provided.'}
        </Text>

        <Text variant="caption" colorVariant="muted" style={{ marginTop: 8 }}>
          {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
        </Text>
      </Card>
    );
  };

  return (
    <ScreenContainer>
      <Header
        title="Notifications"
        showBack
        onBack={() => navigation.goBack()}
      />

      {isLoading && notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Loader size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Notifications"
              message="You have no new alerts or order dispatch notifications."
            />
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default DeliveryNotificationsScreen;
