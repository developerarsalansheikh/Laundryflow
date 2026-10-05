import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { adminService } from '../../services/adminService';

// RN-2 Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Divider from '../../components/ui/Divider';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

export const AdminCustomersScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();

  const [search, setSearch] = useState('');

  // Fetch Customers Query
  const {
    data: customers = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-customers', search],
    queryFn: () => adminService.getCustomers({ search, limit: 100 }),
    staleTime: 1000 * 30,
  });

  const renderCustomerItem = ({ item }) => {
    const lastDate = item.lastOrderDate
      ? new Date(item.lastOrderDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'N/A';

    return (
      <Card variant="elevated" style={[styles.customerCard, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="subtitle" weight="bold" colorVariant="primary">
              {item.name || 'Customer'}
            </Text>
            {item.phone ? (
              <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
                📞 {item.phone}
              </Text>
            ) : null}
            {item.email ? (
              <Text variant="caption" colorVariant="muted">
                ✉️ {item.email}
              </Text>
            ) : null}
          </View>
        </View>

        <Divider style={{ marginVertical: spacing.xs }} />

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text variant="caption" colorVariant="muted">Total Orders</Text>
            <Text variant="body" weight="bold" colorVariant="primary">
              {item.orderCount || 0}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text variant="caption" colorVariant="muted">Total Spent</Text>
            <Text variant="body" weight="bold" style={{ color: colors.status.success || '#16A34A' }}>
              ₹{(item.totalSpent || 0).toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text variant="caption" colorVariant="muted">Last Order</Text>
            <Text variant="caption" weight="medium" colorVariant="primary">
              {lastDate}
            </Text>
          </View>
        </View>
      </Card>
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
          <View style={{ marginLeft: 8 }}>
            <Text variant="h2" weight="bold" colorVariant="primary">
              Store Customers
            </Text>
            <Text variant="caption" colorVariant="secondary">
              {customers.length} clients ordered from your store
            </Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search by customer name or phone..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Customer List */}
      {isLoading && !isRefetching ? (
        <View style={styles.centerContainer}>
          <Loader size="large" />
          <Text variant="body" colorVariant="secondary" style={{ marginTop: spacing.md }}>
            Loading store customers...
          </Text>
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <ErrorState
            title="Failed to load customers"
            message={error?.message || 'Could not fetch customer directory.'}
            onRetry={refetch}
          />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item._id}
          renderItem={renderCustomerItem}
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
              title={search ? 'No matching customers' : 'No customers yet'}
              description={
                search
                  ? `No clients found matching "${search}".`
                  : 'Customers who place orders with your laundry will be cataloged here automatically.'
              }
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
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backBtn: {
    padding: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
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
  customerCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statBox: {
    flex: 1,
  },
});

export default AdminCustomersScreen;
