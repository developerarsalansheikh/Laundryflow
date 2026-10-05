import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { customerService } from '../../services/customerService';
import { useAuthStore } from '../../store/authStore';

// RN-2 Design System Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

export const AddressListScreen = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const { isSelectMode = false, selectedAddressId = null } = route.params || {};

  // Fetch addresses (strictly scoped to authenticated user)
  const {
    data: addressData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['addresses', user?._id],
    queryFn: customerService.getAddresses,
  });

  const addresses = Array.isArray(addressData?.data)
    ? addressData.data
    : (Array.isArray(addressData) ? addressData : []);

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: (id) => customerService.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?._id] });
    },
    onError: (err) => {
      Alert.alert('Error', err?.message || 'Failed to set default address.');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => customerService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err) => {
      Alert.alert('Error', err?.message || 'Failed to delete address.');
    },
  });

  const handleSelect = (addr) => {
    if (isSelectMode) {
      navigation.navigate({
        name: 'Checkout',
        params: { selectedAddress: addr },
        merge: true,
      });
    }
  };

  const handleDelete = (addr) => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete "${addr.label?.toUpperCase() || 'this'}" address?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(addr._id),
        },
      ]
    );
  };

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: colors.background }}>
      <Header
        title={isSelectMode ? 'Select Address' : 'Saved Addresses'}
        showBack
        onBackPress={() => navigation.goBack()}
        rightElement={
          <Button
            title="+ Add"
            variant="outline"
            size="sm"
            onPress={() => navigation.navigate('AddEditAddress')}
          />
        }
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading && (
          <View style={styles.loaderArea}>
            <Loader size="small" message="Loading your addresses..." />
          </View>
        )}

        {isError && !isLoading && (
          <ErrorState
            title="Could not load addresses"
            message={error?.message || 'Please check your connection and retry.'}
            retryAction={refetch}
          />
        )}

        {!isLoading && !isError && addresses.length === 0 && (
          <EmptyState
            title="No addresses saved yet"
            message="Add your delivery address to proceed with checkout and scheduling."
            actionLabel="+ Add New Address"
            onAction={() => navigation.navigate('AddEditAddress')}
          />
        )}

        {!isLoading && addresses.length > 0 && (
          <View style={styles.listContainer}>
            {addresses.map((addr) => {
              const isSelected = isSelectMode && selectedAddressId === addr._id;

              return (
                <TouchableOpacity
                  key={addr._id}
                  activeOpacity={isSelectMode ? 0.7 : 1}
                  onPress={() => handleSelect(addr)}
                >
                  <Card
                    variant="elevated"
                    style={[
                      styles.addressCard,
                      isSelected && { borderColor: colors.primary, borderWidth: 2 },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.labelRow}>
                        <Badge
                          label={addr.label ? addr.label.toUpperCase() : 'HOME'}
                          variant="primary"
                          size="sm"
                        />
                        {addr.isDefault && (
                          <View style={{ marginLeft: 6 }}>
                            <Badge label="DEFAULT" variant="success" size="sm" />
                          </View>
                        )}
                        {isSelected && (
                          <View style={{ marginLeft: 6 }}>
                            <Badge label="SELECTED" variant="info" size="sm" />
                          </View>
                        )}
                      </View>

                      {/* Action buttons */}
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('AddEditAddress', { address: addr })}
                          style={styles.iconAction}
                        >
                          <Text variant="caption" weight="bold" style={{ color: colors.primary }}>
                            Edit
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(addr)}
                          style={[styles.iconAction, { marginLeft: 12 }]}
                        >
                          <Text variant="caption" weight="bold" colorVariant="danger">
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text variant="bodyLarge" weight="semibold" colorVariant="primary" style={{ marginTop: 8 }}>
                      {addr.fullAddress}
                    </Text>

                    {addr.landmark ? (
                      <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
                        Landmark: {addr.landmark}
                      </Text>
                    ) : null}

                    <Text variant="bodySmall" colorVariant="secondary" style={{ marginTop: 4 }}>
                      {addr.city}, {addr.state} - {addr.pincode}
                    </Text>

                    {/* Set Default Action */}
                    {!addr.isDefault && (
                      <TouchableOpacity
                        style={styles.setDefaultBtn}
                        onPress={() => setDefaultMutation.mutate(addr._id)}
                      >
                        <Text variant="caption" weight="bold" style={{ color: colors.textSecondary }}>
                          ☆ Set as Default Address
                        </Text>
                      </TouchableOpacity>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Add Address Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.borderLight }]}>
        <Button
          title="+ Add New Address"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('AddEditAddress')}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  loaderArea: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  listContainer: {
    gap: 12,
  },
  addressCard: {
    padding: 16,
    borderRadius: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconAction: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  setDefaultBtn: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F020',
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

export default AddressListScreen;
