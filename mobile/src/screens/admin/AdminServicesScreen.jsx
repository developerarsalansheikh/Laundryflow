import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
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

const CATEGORIES = [
  { id: 'all', label: 'All Services' },
  { id: 'wash', label: 'Wash & Fold' },
  { id: 'dry_clean', label: 'Dry Clean' },
  { id: 'iron', label: 'Steam Iron' },
  { id: 'wash_iron', label: 'Wash & Iron' },
  { id: 'premium', label: 'Premium' },
];

export const AdminServicesScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const laundryId = user?.laundryId;

  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch Services Query (all=true to include inactive services)
  const {
    data: services = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-services', laundryId, selectedCategory],
    queryFn: () => adminService.getServices(laundryId, { all: true, category: selectedCategory }),
    staleTime: 1000 * 30,
  });

  // Toggle Service Active Mutation
  const toggleMutation = useMutation({
    mutationFn: (id) => adminService.toggleService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err) => {
      Alert.alert('Update Failed', err.response?.data?.message || err.message);
    },
  });

  // Delete Service Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      Alert.alert('Deleted', 'Service deleted successfully.');
    },
    onError: (err) => {
      Alert.alert('Delete Failed', err.response?.data?.message || err.message);
    },
  });

  const handleDeleteService = (service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(service._id),
        },
      ]
    );
  };

  const renderServiceItem = ({ item }) => {
    const unitLabel = item.unit === 'per_kg' ? 'per kg' : 'per piece';

    return (
      <Card
        variant="elevated"
        style={[
          styles.serviceCard,
          { backgroundColor: colors.surface, opacity: item.isActive ? 1 : 0.65 },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={styles.badgeRow}>
              <Badge
                label={item.category?.replace('_', ' ').toUpperCase()}
                variant="neutral"
                size="sm"
              />
              <Badge
                label={item.isActive ? 'ACTIVE' : 'INACTIVE'}
                variant={item.isActive ? 'success' : 'neutral'}
                size="sm"
                style={{ marginLeft: 6 }}
              />
            </View>
            <Text variant="subtitle" weight="bold" colorVariant="primary" style={{ marginTop: 4 }}>
              {item.name}
            </Text>
            {item.description ? (
              <Text variant="caption" colorVariant="muted" numberOfLines={2} style={{ marginTop: 2 }}>
                {item.description}
              </Text>
            ) : null}
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="title" weight="bold" colorVariant="primary">
              ₹{item.price}
            </Text>
            <Text variant="caption" colorVariant="muted">
              {unitLabel}
            </Text>
          </View>
        </View>

        <Divider style={{ marginVertical: spacing.xs }} />

        <View style={styles.cardActions}>
          <View style={styles.switchRow}>
            <Text variant="caption" colorVariant="secondary">
              Available to Customers:
            </Text>
            <Switch
              value={item.isActive}
              onValueChange={() => toggleMutation.mutate(item._id)}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#FFFFFF"
              style={{ marginLeft: 8, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>

          <View style={styles.btnRow}>
            <Button
              title="Edit"
              size="sm"
              variant="outline"
              onPress={() => navigation.navigate('AdminAddEditService', { serviceId: item._id })}
              style={{ marginRight: 6 }}
            />
            <Button
              title="Delete"
              size="sm"
              variant="ghost"
              onPress={() => handleDeleteService(item)}
            />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={styles.titleRow}>
          <View>
            <Text variant="h2" weight="bold" colorVariant="primary">
              Services Catalog
            </Text>
            <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
              {services.length} services configured for your store
            </Text>
          </View>

          <Button
            title="+ Add Service"
            variant="primary"
            size="sm"
            onPress={() => navigation.navigate('AdminAddEditService')}
          />
        </View>

        {/* Category Filter Chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryChips}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.id;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item.id)}
                style={[
                  styles.chip,
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
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Services List Content */}
      {isLoading && !isRefetching ? (
        <View style={styles.centerContainer}>
          <Loader size="large" />
          <Text variant="body" colorVariant="secondary" style={{ marginTop: spacing.md }}>
            Loading store services...
          </Text>
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <ErrorState
            title="Failed to load services"
            message={error?.message || 'Could not fetch catalog from backend.'}
            onRetry={refetch}
          />
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item._id}
          renderItem={renderServiceItem}
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
              title="No services in this category"
              description="Tap '+ Add Service' above to add pricing and laundry offerings to your catalog."
              actionLabel="+ Add New Service"
              onAction={() => navigation.navigate('AdminAddEditService')}
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
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryChips: {
    paddingVertical: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
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
  serviceCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AdminServicesScreen;
