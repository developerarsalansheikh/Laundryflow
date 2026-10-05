import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { useCartStore } from '../../store/cartStore';
import { useFavoriteStore } from '../../store/favoriteStore';
import { useLocationStore } from '../../store/locationStore';
import { customerService } from '../../services/customerService';
import { ASSETS } from '../../assets';

// UI Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Divider from '../../components/ui/Divider';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import SingleLaundryConflictModal from '../../components/SingleLaundryConflictModal';

const CATEGORY_NAMES = {
  wash: 'Wash & Fold',
  dry_clean: 'Dry Cleaning',
  iron: 'Steam Ironing',
  wash_iron: 'Wash & Iron',
  premium: 'Premium Fabric Care',
};

// Standard Dry Cleaning clothing types
const DEFAULT_DRY_CLEAN_ITEMS = [
  { clothingType: 'Shirt', name: 'Shirt', price: 80 },
  { clothingType: 'T-Shirt', name: 'T-Shirt', price: 70 },
  { clothingType: 'Trouser', name: 'Trouser', price: 100 },
  { clothingType: 'Jeans', name: 'Jeans', price: 110 },
  { clothingType: 'Suit', name: 'Suit (2-Piece)', price: 280 },
  { clothingType: 'Blazer', name: 'Blazer', price: 180 },
  { clothingType: 'Coat', name: 'Coat / Jacket', price: 220 },
  { clothingType: 'Dress', name: 'Dress / Gown', price: 190 },
  { clothingType: 'Saree', name: 'Saree (Silk / Designer)', price: 180 },
  { clothingType: 'Kurta', name: 'Kurta / Pyjama', price: 120 },
  { clothingType: 'Sherwani', name: 'Sherwani', price: 350 },
  { clothingType: 'Bedsheet', name: 'Bedsheet', price: 150 },
  { clothingType: 'Blanket', name: 'Blanket / Quilt', price: 250 },
  { clothingType: 'Other', name: 'Other Delicate Item', price: 120 },
];

const DEFAULT_FALLBACK_SERVICES = [
  {
    _id: 'def_1',
    name: 'Standard Everyday Wash & Fold',
    category: 'wash',
    price: 79,
    unit: 'per_kg',
    estimatedHours: 24,
    description: 'Fresh, sanitized clothes washed, tumble dried and neatly folded.',
  },
  {
    _id: 'def_2',
    name: 'Executive Steam Ironing',
    category: 'iron',
    price: 25,
    unit: 'per_piece',
    estimatedHours: 12,
    description: 'Crisp, wrinkle-free high-pressure steam press.',
  },
  {
    _id: 'def_3',
    name: 'Gentle Dry Cleaning',
    category: 'dry_clean',
    price: 80,
    unit: 'per_piece',
    estimatedHours: 48,
    description: 'Eco-solvent stain removal and specialized fabric care.',
    items: DEFAULT_DRY_CLEAN_ITEMS,
  },
  {
    _id: 'def_4',
    name: 'Bed Linens & Duvet Deep Clean',
    category: 'premium',
    price: 349,
    unit: 'per_piece',
    estimatedHours: 48,
    description: 'Sanitized hot wash & dry for comforters, blankets, and bedsheets.',
  },
];

export const LaundryDetailScreen = () => {
  const { colors, spacing, radius, shadows } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();

  const { laundryId, laundry: initialLaundry } = route.params || {};

  const cart = useCartStore();
  const cartSummary = cart.getCartSummary();

  const userCity = useLocationStore((state) => state.city);
  const userLat = useLocationStore((state) => state.latitude);
  const userLng = useLocationStore((state) => state.longitude);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [imageError, setImageError] = useState(false);

  // Conflict Modal State
  const [conflictState, setConflictState] = useState({
    visible: false,
    currentLaundryName: '',
    pendingService: null,
    pendingClothingItem: null,
  });

  // Query single laundry details and services from backend
  const {
    data: detailData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['laundryDetail', laundryId],
    queryFn: () => customerService.getLaundryById(laundryId),
    enabled: Boolean(laundryId),
  });

  const laundry = detailData?.data?.laundry || initialLaundry || {};
  const rawServices = detailData?.data?.services;

  const services = useMemo(() => {
    if (Array.isArray(rawServices) && rawServices.length > 0) {
      return rawServices;
    }
    return DEFAULT_FALLBACK_SERVICES;
  }, [rawServices]);

  const categories = useMemo(() => {
    const cats = new Set(services.map((s) => s.category || 'wash'));
    return ['all', ...Array.from(cats)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'all') {
      return services;
    }
    return services.filter((s) => (s.category || 'wash') === selectedCategory);
  }, [services, selectedCategory]);

  const targetLaundryId = laundry._id || laundry.id || laundryId;
  const isCartFromThisLaundry = cart.laundryId === targetLaundryId;

  // Favorites
  const isFavorite = useFavoriteStore((state) => state.isFavorite);
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const isFav = isFavorite(targetLaundryId);

  // Distance & Serviceability Checks
  const distKm = typeof laundry.distanceKm === 'number'
    ? laundry.distanceKm
    : (laundry.distance ? Number(laundry.distance) / 1000 : null);
  const maxDist = laundry.maxServiceDistanceKm || 20;

  const isCityMismatch = Boolean(
    userCity && laundry.city && userCity.toLowerCase() !== laundry.city.toLowerCase()
  );
  const isBeyond20Km = distKm !== null && distKm > 20;
  const isUnserviceable = isCityMismatch || isBeyond20Km;

  // Add standard service to cart
  const handleAddService = (service) => {
    if (isUnserviceable) {
      Alert.alert(
        'Outside Service Area',
        `This laundry only services ${laundry.city || 'its local city'} within 20 KM. It cannot fulfill orders from ${userCity || 'your selected location'}.`
      );
      return;
    }

    const targetName = laundry.name || 'Laundry Store';
    const targetAddress = laundry.address || laundry.city || '';

    const result = cart.addItem({
      laundryId: targetLaundryId,
      laundryName: targetName,
      laundryAddress: targetAddress,
      service,
    });

    if (result.conflict) {
      setConflictState({
        visible: true,
        currentLaundryName: result.currentLaundry?.name || 'Another Laundry',
        pendingService: service,
        pendingClothingItem: null,
      });
    }
  };

  // Add specific dry-cleaning clothing item to cart
  const handleAddClothingItem = (service, clothingItem) => {
    if (isUnserviceable) {
      Alert.alert(
        'Outside Service Area',
        `This laundry only services ${laundry.city || 'its local city'} within 20 KM. It cannot fulfill orders from ${userCity || 'your selected location'}.`
      );
      return;
    }

    const targetName = laundry.name || 'Laundry Store';
    const targetAddress = laundry.address || laundry.city || '';

    const result = cart.addItem({
      laundryId: targetLaundryId,
      laundryName: targetName,
      laundryAddress: targetAddress,
      service,
      clothingItem,
    });

    if (result.conflict) {
      setConflictState({
        visible: true,
        currentLaundryName: result.currentLaundry?.name || 'Another Laundry',
        pendingService: service,
        pendingClothingItem: clothingItem,
      });
    }
  };

  // Switch cart laundry and add item
  const handleConfirmSwitch = () => {
    if (!conflictState.pendingService) return;

    const targetName = laundry.name || 'Laundry Store';
    const targetAddress = laundry.address || laundry.city || '';

    cart.clearAndAddItem({
      laundryId: targetLaundryId,
      laundryName: targetName,
      laundryAddress: targetAddress,
      service: conflictState.pendingService,
      clothingItem: conflictState.pendingClothingItem,
    });

    setConflictState({
      visible: false,
      currentLaundryName: '',
      pendingService: null,
      pendingClothingItem: null,
    });
  };

  const handleDismissConflict = () => {
    setConflictState({
      visible: false,
      currentLaundryName: '',
      pendingService: null,
      pendingClothingItem: null,
    });
  };

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: colors.background }}>
      {/* Header Bar */}
      <Header
        title={laundry.name || 'Store Details'}
        showBack
        onBackPress={() => navigation.goBack()}
        rightElement={
          <Pressable
            style={[styles.cartIconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text variant="caption" weight="bold">
              🧺 {cartSummary.totalItems}
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: cartSummary.totalItems > 0 ? 110 : 30 },
        ]}
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
        {/* Store Info Card */}
        <Card variant="elevated" style={styles.storeHeroCard}>
          <View style={styles.storeHeaderRow}>
            {laundry.logo && !imageError ? (
              <Image
                source={{ uri: laundry.logo }}
                style={styles.heroThumbnail}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.heroThumbnail, styles.fallbackThumbnail, { backgroundColor: colors.surfaceElevated }]}>
                <Text variant="h1" weight="bold" style={{ color: colors.primary }}>
                  {laundry.name ? laundry.name.charAt(0).toUpperCase() : 'L'}
                </Text>
              </View>
            )}

            <View style={styles.heroInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Text variant="h3" weight="bold" colorVariant="primary" numberOfLines={2} style={{ flex: 1 }}>
                  {laundry.name || 'Laundry Store'}
                </Text>
                <TouchableOpacity
                  onPress={() => toggleFavorite(laundry)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ padding: 4, marginLeft: 8 }}
                >
                  <Text style={{ fontSize: 20 }}>{isFav ? '❤️' : '🤍'}</Text>
                </TouchableOpacity>
              </View>

              <Text variant="bodySmall" colorVariant="secondary" style={{ marginTop: 2 }}>
                📍 {laundry.address ? `${laundry.address}, ${laundry.city || ''}` : (laundry.city || 'Doorstep Pickup')}
              </Text>

              {/* Rating & Hours Badges */}
              <View style={styles.heroBadges}>
                <Badge label={`★ ${Number(laundry.rating || 4.8).toFixed(1)}`} variant="warning" size="sm" />
                <Badge label={`Radius: ${maxDist} KM`} variant="info" size="sm" />
                {distKm !== null && distKm <= 3.0 ? (
                  <Badge label="FREE Pickup (≥ ₹100)" variant="success" size="sm" />
                ) : null}
              </View>
            </View>
          </View>

          <Divider style={{ marginVertical: spacing.sm }} />

          {/* Operational Details Row */}
          <View style={styles.hoursRow}>
            <View style={styles.hourItem}>
              <Text variant="caption" colorVariant="muted">HOURS</Text>
              <Text variant="bodySmall" weight="bold" colorVariant="primary">
                {laundry.openTime || '09:00'} - {laundry.closeTime || '21:00'}
              </Text>
            </View>
            <View style={styles.hourItem}>
              <Text variant="caption" colorVariant="muted">AVG TURNAROUND</Text>
              <Text variant="bodySmall" weight="bold" colorVariant="primary">
                {laundry.defaultTurnaroundHours ? `${laundry.defaultTurnaroundHours} Hours` : '24 - 48 Hours'}
              </Text>
            </View>
            <View style={styles.hourItem}>
              <Text variant="caption" colorVariant="muted">STATUS</Text>
              <Badge label={laundry.isActive !== false ? 'Open Now' : 'Closed'} variant={laundry.isActive !== false ? 'success' : 'neutral'} size="sm" />
            </View>
          </View>
        </Card>

        {/* Unserviceable Warning Banner */}
        {isUnserviceable && (
          <Card
            variant="outlined"
            style={{
              padding: 12,
              marginBottom: 16,
              borderRadius: 12,
              backgroundColor: colors.status.error + '15',
              borderColor: colors.status.error,
            }}
          >
            <Text variant="bodySmall" weight="bold" style={{ color: colors.status.error }}>
              ⚠️ Store Not Serviceable for Your Location
            </Text>
            <Text variant="caption" colorVariant="secondary" style={{ marginTop: 4 }}>
              {isCityMismatch
                ? `This laundry operates in ${laundry.city}, but your selected location is ${userCity}. Laundries from another city cannot be ordered.`
                : `This laundry is ${distKm?.toFixed(1)} KM away, which exceeds the maximum allowable distance of 20 KM.`}
            </Text>
          </Card>
        )}

        {/* Categories Tab Bar */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map((catKey) => {
              const isSelected = selectedCategory === catKey;
              const displayName = catKey === 'all' ? 'All Services' : (CATEGORY_NAMES[catKey] || catKey);
              return (
                <Pressable
                  key={catKey}
                  style={[
                    styles.categoryTab,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.borderLight,
                    },
                  ]}
                  onPress={() => setSelectedCategory(catKey)}
                >
                  <Text
                    variant="bodySmall"
                    weight={isSelected ? 'bold' : 'medium'}
                    style={{ color: isSelected ? '#FFFFFF' : colors.textSecondary }}
                  >
                    {displayName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loaderArea}>
            <Loader size="small" message="Fetching services & prices..." />
          </View>
        )}

        {/* Error View */}
        {isError && !isLoading && (
          <ErrorState
            title="Could not load services"
            message={error?.message || 'Failed to fetch catalog from this laundry.'}
            retryAction={refetch}
          />
        )}

        {/* Services List */}
        {!isLoading && filteredServices.length > 0 && (
          <View style={styles.servicesSection}>
            <Text variant="title" weight="bold" colorVariant="primary" style={{ marginBottom: spacing.sm }}>
              Services & Pricing ({filteredServices.length})
            </Text>

            {filteredServices.map((service) => {
              const baseServiceId = service._id || service.id;
              const isDryClean = service.category === 'dry_clean';
              const clothingItems = (isDryClean && (!service.items || service.items.length === 0))
                ? DEFAULT_DRY_CLEAN_ITEMS
                : (service.items && service.items.length > 0 ? service.items : null);

              // ── SPECIALIZED DRY CLEANING: ITEM-BASED CLOTHING TYPES (Req 18, 19, 20) ──
              if (clothingItems && clothingItems.length > 0) {
                // Calculate total dry cleaning amount for this service
                let serviceTotalAmount = 0;
                let serviceTotalCount = 0;

                clothingItems.forEach((ci) => {
                  const itemId = `${baseServiceId}_${(ci.name || ci.clothingType).toLowerCase().replace(/\s+/g, '_')}`;
                  const qty = isCartFromThisLaundry ? cart.getItemQuantity(itemId) : 0;
                  serviceTotalAmount += qty * Number(ci.price);
                  serviceTotalCount += qty;
                });

                return (
                  <Card key={baseServiceId} variant="elevated" style={styles.dryCleanServiceCard}>
                    <View style={styles.serviceHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text variant="bodyLarge" weight="bold" colorVariant="primary">
                            {service.name}
                          </Text>
                          <Badge label="Dry Cleaning" variant="primary" size="sm" />
                        </View>
                        <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
                          {service.description || 'Specialized solvent cleaning for premium fabrics & garments.'}
                        </Text>
                      </View>

                      {serviceTotalCount > 0 && (
                        <View style={styles.serviceTotalBadge}>
                          <Text variant="caption" weight="bold" style={{ color: colors.primary }}>
                            {serviceTotalCount} items • ₹{serviceTotalAmount}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Divider style={{ marginVertical: 10 }} />

                    <Text variant="caption" weight="bold" colorVariant="muted" style={{ marginBottom: 8 }}>
                      SELECT CLOTHING TYPES & QUANTITY
                    </Text>

                    {/* Itemized Clothing Types List */}
                    <View style={styles.clothingItemsList}>
                      {clothingItems.map((cItem) => {
                        const itemId = `${baseServiceId}_${(cItem.name || cItem.clothingType).toLowerCase().replace(/\s+/g, '_')}`;
                        const qty = isCartFromThisLaundry ? cart.getItemQuantity(itemId) : 0;
                        const lineTotal = qty * Number(cItem.price);

                        return (
                          <View
                            key={cItem.name || cItem.clothingType}
                            style={[styles.clothingItemRow, { borderBottomColor: colors.borderLight }]}
                          >
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <Text variant="bodySmall" weight="bold" colorVariant="primary">
                                {cItem.name || cItem.clothingType}
                              </Text>
                              <Text variant="caption" colorVariant="secondary">
                                ₹{cItem.price} / piece
                                {qty > 0 ? `  •  Line Total: ₹${lineTotal}` : ''}
                              </Text>
                            </View>

                            {/* Stepper / Add button */}
                            {qty > 0 ? (
                              <View style={[styles.stepperContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
                                <TouchableOpacity
                                  style={styles.stepperBtn}
                                  onPress={() => cart.decrementItem(itemId)}
                                  activeOpacity={0.7}
                                >
                                  <Text variant="bodyLarge" weight="bold" style={{ color: colors.primary }}>
                                    −
                                  </Text>
                                </TouchableOpacity>
                                <Text variant="bodyMedium" weight="bold" colorVariant="primary" style={styles.stepperQty}>
                                  {qty}
                                </Text>
                                <TouchableOpacity
                                  style={styles.stepperBtn}
                                  onPress={() => handleAddClothingItem(service, cItem)}
                                  activeOpacity={0.7}
                                >
                                  <Text variant="bodyLarge" weight="bold" style={{ color: colors.primary }}>
                                    +
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <Button
                                title="+ Add"
                                variant="outline"
                                size="sm"
                                onPress={() => handleAddClothingItem(service, cItem)}
                              />
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </Card>
                );
              }

              // ── STANDARD SERVICE CARD (Wash & Fold, Ironing, etc.) ──
              const qtyInCart = isCartFromThisLaundry ? cart.getItemQuantity(baseServiceId) : 0;
              const unitDisplay = service.unit === 'per_kg' ? 'kg' : 'piece';
              const turnaround = service.estimatedHours ? `${service.estimatedHours} hrs` : '24 hrs';

              return (
                <Card key={baseServiceId} variant="elevated" style={styles.serviceCard}>
                  <View style={styles.serviceRow}>
                    <View style={styles.serviceInfo}>
                      <View style={styles.serviceHeader}>
                        <Text variant="bodyLarge" weight="bold" colorVariant="primary">
                          {service.name}
                        </Text>
                        <Badge
                          label={CATEGORY_NAMES[service.category] || service.category || 'Wash'}
                          variant="neutral"
                          size="sm"
                        />
                      </View>

                      {service.description ? (
                        <Text variant="caption" colorVariant="secondary" style={{ marginTop: 3 }}>
                          {service.description}
                        </Text>
                      ) : null}

                      <View style={styles.priceMetaRow}>
                        <Text variant="bodyMedium" weight="bold" style={{ color: colors.primary }}>
                          ₹{service.price}
                        </Text>
                        <Text variant="caption" colorVariant="muted">
                          {' '}/ {unitDisplay} • ⚡ {turnaround}
                        </Text>
                      </View>
                    </View>

                    {/* Quantity Counter or Add Button */}
                    <View style={styles.actionContainer}>
                      {qtyInCart > 0 ? (
                        <View style={[styles.stepperContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => cart.decrementItem(baseServiceId)}
                            activeOpacity={0.7}
                          >
                            <Text variant="bodyLarge" weight="bold" style={{ color: colors.primary }}>
                              −
                            </Text>
                          </TouchableOpacity>
                          <Text variant="bodyMedium" weight="bold" colorVariant="primary" style={styles.stepperQty}>
                            {qtyInCart}
                          </Text>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => handleAddService(service)}
                            activeOpacity={0.7}
                          >
                            <Text variant="bodyLarge" weight="bold" style={{ color: colors.primary }}>
                              +
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Button
                          title="+ Add"
                          variant="primary"
                          size="sm"
                          onPress={() => handleAddService(service)}
                        />
                      )}
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* Empty Category View */}
        {!isLoading && filteredServices.length === 0 && (
          <EmptyState
            title="No services in this category"
            message="Please select another service category tab above."
            actionLabel="View All Services"
            onAction={() => setSelectedCategory('all')}
          />
        )}
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      {cartSummary.totalItems > 0 && (
        <View
          style={[
            styles.floatingCartBar,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder },
            shadows.lg,
          ]}
        >
          <View style={styles.cartBarInfo}>
            <Badge
              label={`${cartSummary.totalItems} ITEM${cartSummary.totalItems > 1 ? 'S' : ''}`}
              variant="primary"
              size="sm"
            />
            <Text variant="title" weight="bold" colorVariant="primary" style={{ marginTop: 2 }}>
              ₹{cartSummary.grandTotal}
            </Text>
            <Text variant="caption" colorVariant="secondary" numberOfLines={1}>
              {cart.laundryName || laundry.name}
            </Text>
          </View>

          <Button
            title="View Cart →"
            variant="primary"
            size="md"
            onPress={() => navigation.navigate('Cart')}
          />
        </View>
      )}

      {/* Single Laundry Conflict Modal */}
      <SingleLaundryConflictModal
        visible={conflictState.visible}
        currentLaundryName={conflictState.currentLaundryName}
        onClearAndSwitch={handleConfirmSwitch}
        onCancel={handleDismissConflict}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  cartIconBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  storeHeroCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  storeHeaderRow: {
    flexDirection: 'row',
  },
  heroThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  fallbackThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    flex: 1,
    marginLeft: 14,
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hourItem: {
    alignItems: 'center',
  },
  categoriesContainer: {
    marginBottom: 14,
  },
  categoryScroll: {
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  loaderArea: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  servicesSection: {
    marginBottom: 16,
  },
  serviceCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  dryCleanServiceCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceTotalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  clothingItemsList: {
    marginTop: 4,
  },
  clothingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  priceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  actionContainer: {
    alignItems: 'flex-end',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepperQty: {
    paddingHorizontal: 8,
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  cartBarInfo: {
    flex: 1,
    marginRight: 12,
  },
});

export default LaundryDetailScreen;
