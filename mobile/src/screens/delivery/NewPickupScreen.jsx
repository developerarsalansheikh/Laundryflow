import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { deliveryService } from '../../services/deliveryService';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Divider from '../../components/ui/Divider';
import Loader from '../../components/ui/Loader';
import ErrorState from '../../components/ui/ErrorState';

export const NewPickupScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { previousOrderId, order: initialOrder } = route.params || {};

  // If order object wasn't passed directly in route, fetch it
  const {
    data: fetchedOrder,
    isLoading: orderLoading,
  } = useQuery({
    queryKey: ['deliveryOrder', previousOrderId],
    queryFn: () => deliveryService.getOrderById(previousOrderId),
    enabled: !initialOrder && Boolean(previousOrderId),
  });

  const previousOrder = initialOrder || fetchedOrder;
  const laundryId = previousOrder?.laundryId?._id || previousOrder?.laundryId;

  // Fetch active services belonging specifically to this laundry
  const {
    data: servicesList = [],
    isLoading: servicesLoading,
    error: servicesError,
  } = useQuery({
    queryKey: ['laundryServices', laundryId],
    queryFn: () => deliveryService.getLaundryServices(laundryId),
    enabled: Boolean(laundryId),
  });

  // New Pickup Items State
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [currentQty, setCurrentQty] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [items, setItems] = useState([]); // Array of { serviceId, serviceName, price, quantity, notes }
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [validationError, setValidationError] = useState('');

  // Auto-select first service once loaded
  React.useEffect(() => {
    if (servicesList.length > 0 && !selectedServiceId) {
      setSelectedServiceId(servicesList[0]._id);
    }
  }, [servicesList]);

  // Create New Pickup Order Mutation
  const createPickupMutation = useMutation({
    mutationFn: (payload) => deliveryService.createDeliveryPickupOrder(payload),
    onSuccess: (response) => {
      const newOrder = response?.data || response;
      queryClient.invalidateQueries({ queryKey: ['deliveryActiveOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryCompletedOrders'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryStats'] });

      Alert.alert(
        'Pickup Order Created!',
        `New Order #${String(newOrder._id).slice(-6).toUpperCase()} has been created and assigned to you.`,
        [
          {
            text: 'View New Order',
            onPress: () => {
              navigation.replace('DeliveryOrderDetail', { orderId: newOrder._id });
            },
          },
        ]
      );
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create new pickup order.';
      setValidationError(msg);
      Alert.alert('Pickup Creation Failed', msg);
    },
  });

  const handleAddItem = () => {
    if (!selectedServiceId) {
      setValidationError('Please select a laundry service.');
      return;
    }
    if (currentQty <= 0) {
      setValidationError('Quantity must be at least 1.');
      return;
    }

    const serviceDoc = servicesList.find((s) => s._id === selectedServiceId);
    if (!serviceDoc) {
      setValidationError('Selected service is not valid.');
      return;
    }

    setValidationError('');

    // Check if item for this service already exists in list
    const existingIndex = items.findIndex((i) => i.serviceId === selectedServiceId);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += currentQty;
      if (itemNotes) {
        updated[existingIndex].notes = itemNotes;
      }
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          serviceId: serviceDoc._id,
          serviceName: serviceDoc.name,
          price: serviceDoc.price,
          quantity: currentQty,
          notes: itemNotes,
        },
      ]);
    }

    // Reset current item builder
    setCurrentQty(1);
    setItemNotes('');
  };

  const handleRemoveItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const handleConfirmPickup = () => {
    if (createPickupMutation.isPending) return;
    if (items.length === 0) {
      setValidationError('Cannot create empty pickup. Please add at least 1 item.');
      return;
    }

    setValidationError('');

    const payload = {
      previousOrderId,
      services: items.map((i) => ({
        serviceId: i.serviceId,
        quantity: i.quantity,
      })),
      specialInstructions: specialInstructions.trim() || undefined,
      pickupAddressId: previousOrder?.deliveryAddress?._id || previousOrder?.pickupAddress?._id,
    };

    createPickupMutation.mutate(payload);
  };

  if (orderLoading || !previousOrder) {
    return (
      <ScreenContainer>
        <Header title="New Pickup" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <Loader size="large" />
        </View>
      </ScreenContainer>
    );
  }

  const customerName = previousOrder?.user?.name || 'Customer';
  const customerPhone = previousOrder?.user?.phone || '';
  const customerAddress =
    previousOrder?.deliveryAddress?.fullAddress ||
    previousOrder?.deliveryAddress?.street ||
    previousOrder?.pickupAddress?.fullAddress ||
    previousOrder?.pickupAddress?.street ||
    previousOrder?.address ||
    'Customer Address';

  const laundryName = previousOrder?.laundryId?.name || 'Assigned Laundry';

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalEstimatedPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <ScreenContainer>
      <Header
        title="Direct New Pickup"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Real-world context banner */}
        <Card variant="elevated" style={styles.bannerCard}>
          <Badge label="SAME CUSTOMER • NEW ORDER" variant="primary" size="sm" />
          <Text variant="h3" weight="bold" colorVariant="primary" style={{ marginTop: 8 }}>
            Collecting New Clothes
          </Text>
          <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
            Collected directly from customer after delivery of Order #{String(previousOrderId).slice(-6).toUpperCase()}.
          </Text>

          <Divider style={{ marginVertical: spacing.sm }} />

          {/* Prefilled Customer & Laundry Data */}
          <View style={styles.prefillGrid}>
            <View>
              <Text variant="caption" colorVariant="muted">Customer</Text>
              <Text variant="bodySmall" weight="bold" colorVariant="primary">
                {customerName} {customerPhone ? `(+91 ${customerPhone})` : ''}
              </Text>
            </View>

            <View style={{ marginTop: 6 }}>
              <Text variant="caption" colorVariant="muted">Pickup Address</Text>
              <Text variant="caption" colorVariant="primary" numberOfLines={2}>
                {customerAddress}
              </Text>
            </View>

            <View style={{ marginTop: 6 }}>
              <Text variant="caption" colorVariant="muted">Store / Laundry</Text>
              <Text variant="bodySmall" weight="semibold" style={{ color: colors.primary }}>
                {laundryName}
              </Text>
            </View>
          </View>
        </Card>

        {/* Validation Alert */}
        {Boolean(validationError) && (
          <View style={{ marginBottom: spacing.md }}>
            <ErrorState title="Validation Error" message={validationError} />
          </View>
        )}

        {/* ITEM ENTRY BUILDER */}
        <Card variant="outlined" style={styles.card}>
          <Text variant="title" weight="bold" colorVariant="primary" style={{ marginBottom: spacing.sm }}>
            Add Clothes & Services
          </Text>

          {servicesLoading ? (
            <Loader size="small" />
          ) : servicesError ? (
            <Text variant="caption" style={{ color: colors.status.error }}>
              Failed to load store services.
            </Text>
          ) : (
            <View>
              <Text variant="caption" weight="semibold" colorVariant="secondary" style={{ marginBottom: 6 }}>
                Select Service
              </Text>

              {/* Service Selection Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesChipScroll}>
                {servicesList.map((service) => {
                  const isSelected = selectedServiceId === service._id;
                  return (
                    <Pressable
                      key={service._id}
                      style={[
                        styles.serviceChip,
                        { borderColor: colors.borderLight, backgroundColor: colors.surface },
                        isSelected && { borderColor: colors.primary, backgroundColor: colors.primaryLight || colors.surface },
                      ]}
                      onPress={() => setSelectedServiceId(service._id)}
                    >
                      <Text
                        variant="bodySmall"
                        weight={isSelected ? 'bold' : 'normal'}
                        style={{ color: isSelected ? colors.primary : colors.textPrimary }}
                      >
                        {service.name}
                      </Text>
                      <Text variant="caption" colorVariant="secondary">
                        ₹{service.price} / item
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Quantity Stepper */}
              <View style={styles.stepperRow}>
                <Text variant="bodyMedium" weight="semibold" colorVariant="primary">
                  Quantity
                </Text>

                <View style={styles.stepperControls}>
                  <Pressable
                    style={[styles.stepperButton, { borderColor: colors.borderLight }]}
                    onPress={() => setCurrentQty((q) => Math.max(1, q - 1))}
                  >
                    <Text variant="h3" weight="bold" colorVariant="primary">-</Text>
                  </Pressable>

                  <Text variant="h3" weight="bold" colorVariant="primary" style={styles.qtyDisplay}>
                    {currentQty}
                  </Text>

                  <Pressable
                    style={[styles.stepperButton, { borderColor: colors.borderLight }]}
                    onPress={() => setCurrentQty((q) => q + 1)}
                  >
                    <Text variant="h3" weight="bold" colorVariant="primary">+</Text>
                  </Pressable>
                </View>
              </View>

              <Input
                label="Item Notes (Optional)"
                placeholder="e.g. 3 Cotton shirts, 2 Silk trousers"
                value={itemNotes}
                onChangeText={setItemNotes}
                containerStyle={{ marginTop: spacing.sm, marginBottom: spacing.md }}
              />

              <Button
                title="+ Add To Pickup List"
                variant="outline"
                size="md"
                onPress={handleAddItem}
              />
            </View>
          )}
        </Card>

        {/* COLLECTED ITEMS LIST */}
        <Card variant="outlined" style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text variant="title" weight="bold" colorVariant="primary">
              Pickup Item List ({totalItemCount} clothes)
            </Text>
            <Badge label={`₹${totalEstimatedPrice}`} variant="success" size="sm" />
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyItemsBox}>
              <Text variant="bodySmall" colorVariant="muted" align="center">
                No items added yet. Use the selector above to log collected clothes.
              </Text>
            </View>
          ) : (
            items.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.collectedItemRow,
                  index < items.length - 1 && { borderBottomColor: colors.borderLight, borderBottomWidth: 1 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" weight="bold" colorVariant="primary">
                    {item.serviceName} × {item.quantity}
                  </Text>
                  {Boolean(item.notes) && (
                    <Text variant="caption" colorVariant="secondary">
                      Note: {item.notes}
                    </Text>
                  )}
                  <Text variant="caption" colorVariant="muted">
                    ₹{item.price * item.quantity} (₹{item.price} each)
                  </Text>
                </View>

                <Button
                  title="Remove"
                  variant="ghost"
                  size="xs"
                  onPress={() => handleRemoveItem(index)}
                />
              </View>
            ))
          )}
        </Card>

        {/* Special Instructions */}
        <Card variant="default" style={styles.card}>
          <Input
            label="Pickup Instructions / Remarks"
            placeholder="e.g. Handle silk with care, separate whites"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
          />
        </Card>

        {/* SUBMISSION BUTTON */}
        <View style={styles.submitSection}>
          <Button
            title={`Create Pickup (${totalItemCount} Clothes • ₹${totalEstimatedPrice})`}
            variant="primary"
            size="lg"
            fullWidth
            disabled={items.length === 0 || createPickupMutation.isPending}
            loading={createPickupMutation.isPending}
            onPress={handleConfirmPickup}
          />
          <Text variant="caption" colorVariant="muted" align="center" style={{ marginTop: 8 }}>
            Will generate a completely new order assigned to you with status Picked Up.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  bannerCard: {
    padding: 16,
    marginBottom: 14,
  },
  prefillGrid: {
    gap: 4,
  },
  card: {
    padding: 16,
    marginBottom: 14,
  },
  servicesChipScroll: {
    marginBottom: 14,
  },
  serviceChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyDisplay: {
    minWidth: 32,
    textAlign: 'center',
  },
  emptyItemsBox: {
    padding: 16,
    alignItems: 'center',
  },
  collectedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  submitSection: {
    marginTop: 10,
  },
});

export default NewPickupScreen;
