import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useFavoriteStore } from '../../store/favoriteStore';
import { useLocationStore } from '../../store/locationStore';
import { customerService } from '../../services/customerService';
import { ASSETS } from '../../assets';

// UI Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Loader from '../../components/ui/Loader';
import AuthGateModal from '../../components/AuthGateModal';
import SingleLaundryConflictModal from '../../components/SingleLaundryConflictModal';
import Icon from '../../components/ui/Icon';

const getClothingImage = (clothingType = '') => {
  const t = (clothingType || '').toLowerCase();
  const c = ASSETS.clothes || {};
  if (t.includes('shirt') && !t.includes('t-shirt') && !t.includes('tshirt')) return c.shirt;
  if (t.includes('t-shirt') || t.includes('tshirt')) return c.tshirt;
  if (t.includes('suit') || t.includes('blazer') || t.includes('coat') || t.includes('sherwani')) return c.suit;
  if (t.includes('saree') || t.includes('dress') || t.includes('kurta')) return c.saree;
  if (t.includes('jean') || t.includes('trouser') || t.includes('pant')) return c.jeans;
  if (t.includes('bedsheet') || t.includes('blanket') || t.includes('quilt') || t.includes('linen') || t.includes('duvet')) return c.bedsheet;
  if (t.includes('shoe') || t.includes('sneaker')) return c.shoes;
  return c.shirt;
};

const BRAND_PRIMARY = '#0284C7';
const BRAND_ORANGE = '#FF7A00';
const BRAND_LIGHT = '#F0F9FF';
const BRAND_BORDER = '#BAE6FD';

const SERVICE_CATEGORIES = [
  {
    id: 'wash',
    label: 'Wash & Fold',
    sub: 'Everyday wear',
    iconName: 'shirt',
    image: (ASSETS.clothes && ASSETS.clothes.tshirt) || null,
  },
  {
    id: 'dry_clean',
    label: 'Dry Clean',
    sub: 'Suits & silks',
    iconName: 'suit',
    image: (ASSETS.clothes && ASSETS.clothes.suit) || null,
  },
  {
    id: 'iron',
    label: 'Iron Only',
    sub: 'Crisp & pressed',
    iconName: 'iron',
    image: (ASSETS.clothes && ASSETS.clothes.shirt) || null,
  },
  {
    id: 'shoe',
    label: 'Shoe Care',
    sub: 'Clean & polish',
    iconName: 'shoe',
    image: (ASSETS.clothes && ASSETS.clothes.shoes) || null,
  },
];

const POPULAR_GARMENTS = [
  { id: 'shirt', name: "Men's Shirt", price: 80, category: 'dry_clean', clothingType: 'Shirt', image: (ASSETS.clothes && ASSETS.clothes.shirt) || null },
  { id: 'saree', name: 'Silk Saree', price: 180, category: 'dry_clean', clothingType: 'Saree', image: (ASSETS.clothes && ASSETS.clothes.saree) || null },
  { id: 'jeans', name: 'Denim Jeans', price: 110, category: 'wash', clothingType: 'Jeans', image: (ASSETS.clothes && ASSETS.clothes.jeans) || null },
  { id: 'suit', name: '2-Piece Suit', price: 280, category: 'dry_clean', clothingType: 'Suit', image: (ASSETS.clothes && ASSETS.clothes.suit) || null },
  { id: 'tshirt', name: 'Cotton T-Shirt', price: 70, category: 'wash', clothingType: 'T-Shirt', image: (ASSETS.clothes && ASSETS.clothes.tshirt) || null },
  { id: 'bedsheet', name: 'Bedsheet / Quilt', price: 150, category: 'premium', clothingType: 'Bedsheet', image: (ASSETS.clothes && ASSETS.clothes.bedsheet) || null },
];

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance', icon: '⚡' },
  { id: 'distance', label: 'Distance', icon: '📍' },
  { id: 'rating', label: 'Rating', icon: '⭐' },
  { id: 'price', label: 'Price', icon: '🏷️' },
  { id: 'turnaround', label: 'Fastest', icon: '⏱️' },
];

const StoreLogoImage = ({ uri, name, style, colors }) => {
  const [hasError, setHasError] = useState(false);

  if (uri && !hasError) {
    return (
      <Image
        source={{ uri }}
        style={style}
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    );
  }

  const initial = name ? name.charAt(0).toUpperCase() : 'L';
  return (
    <View
      style={[
        style,
        styles.fallbackLogo,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
      ]}
    >
      <Text variant="h2" weight="bold" style={{ color: colors.primary }}>
        {initial}
      </Text>
    </View>
  );
};

export const CustomerHomeScreen = () => {
  const { colors, spacing, radius, shadows } = useTheme();
  const navigation = useNavigation();
  const scrollRef = useRef(null);

  // Global Stores
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const cart = useCartStore();
  const cartSummary = cart.getCartSummary();

  // Reactive favorites subscriptions
  const favoriteIds = useFavoriteStore((state) => state.favoriteIds);
  const favoritesMap = useFavoriteStore((state) => state.favoritesMap);
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const refreshFavorites = useFavoriteStore((state) => state.refreshFavorites);

  const activeFavoriteLaundryId = favoriteIds.length > 0 ? favoriteIds[0] : null;

  // Real Favorite Laundry Data Query
  const { data: favoriteLaundryDetailRes, isLoading: isFavoriteLaundryLoading } = useQuery({
    queryKey: ['favoriteLaundryDetail', activeFavoriteLaundryId],
    queryFn: () => customerService.getLaundryById(activeFavoriteLaundryId),
    enabled: Boolean(activeFavoriteLaundryId),
    staleTime: 1000 * 60 * 3,
  });

  const favoriteLaundryStore = favoriteLaundryDetailRes?.data?.laundry || (activeFavoriteLaundryId ? favoritesMap[activeFavoriteLaundryId] : null);
  const favoriteServices = favoriteLaundryDetailRes?.data?.services || [];

  const favoriteGarments = useMemo(() => {
    if (!favoriteServices || favoriteServices.length === 0) return [];
    const list = [];
    favoriteServices.forEach((service) => {
      if (Array.isArray(service.items) && service.items.length > 0) {
        service.items.forEach((item) => {
          if (item.isActive !== false) {
            const rawName = item.name || item.clothingType || '';
            list.push({
              id: `${service._id}_${item._id || rawName.toLowerCase().replace(/\s+/g, '_')}`,
              serviceId: service._id,
              serviceName: service.name,
              category: service.category,
              name: rawName,
              clothingType: item.clothingType || rawName,
              price: item.price,
              serviceObj: service,
              clothingItemObj: item,
              image: getClothingImage(item.clothingType || rawName),
            });
          }
        });
      } else {
        const rawName = service.clothingType || service.name;
        list.push({
          id: service._id,
          serviceId: service._id,
          serviceName: service.name,
          category: service.category,
          name: rawName,
          clothingType: service.clothingType || service.name,
          price: service.price,
          serviceObj: service,
          clothingItemObj: {
            name: rawName,
            clothingType: service.clothingType || service.name,
            price: service.price,
          },
          image: getClothingImage(service.clothingType || service.name) || (service.image ? { uri: service.image } : null),
        });
      }
    });
    return list;
  }, [favoriteServices]);

  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [pendingConflictData, setPendingConflictData] = useState(null);

  const city = useLocationStore((state) => state.city);
  const latitude = useLocationStore((state) => state.latitude);
  const longitude = useLocationStore((state) => state.longitude);
  const isLocationEstablished = useLocationStore((state) => state.isLocationEstablished);
  const isLocationHydrated = useLocationStore((state) => state.isHydrated);

  useEffect(() => {
    if (isAuthenticated) {
      refreshFavorites();
    }
  }, [isAuthenticated, refreshFavorites]);

  // Back handler
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  // Local Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('relevance');
  const [authGateVisible, setAuthGateVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch laundries from Backend API
  const {
    data: laundriesData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['laundries', city, latitude, longitude, selectedCategory, debouncedSearch, selectedSort],
    queryFn: () => {
      if (!city) return { data: [] };
      return customerService.getLaundries({
        city,
        lat: latitude || undefined,
        lng: longitude || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: debouncedSearch || undefined,
        sort: selectedSort,
      });
    },
    enabled: Boolean(isLocationEstablished && city),
    staleTime: 1000 * 60 * 2,
  });

  // Fetch active/recent orders if authenticated
  const { data: myOrdersData } = useQuery({
    queryKey: ['customerRecentOrders', isAuthenticated],
    queryFn: () => customerService.getMyOrders({ limit: 3 }),
    enabled: Boolean(isAuthenticated),
    staleTime: 1000 * 30,
  });

  const rawLaundries = useMemo(() => {
    if (Array.isArray(laundriesData?.data)) return laundriesData.data;
    if (Array.isArray(laundriesData)) return laundriesData;
    return [];
  }, [laundriesData]);

  const activeOrder = useMemo(() => {
    const list = myOrdersData?.data || myOrdersData || [];
    if (!Array.isArray(list) || list.length === 0) return null;
    return list.find((o) => !['delivered', 'cancelled'].includes(o.status?.toLowerCase())) || list[0];
  }, [myOrdersData]);

  const handleOpenLaundry = (laundry) => {
    navigation.navigate('LaundryDetail', {
      laundryId: laundry._id || laundry.id,
      laundry,
    });
  };

  const handleViewCart = () => {
    navigation.navigate('Cart');
  };

  const handleMyOrders = () => {
    if (!isAuthenticated) {
      setAuthGateVisible(true);
      return;
    }
    navigation.navigate('MyOrders');
  };

  const handleBookPickupBanner = () => {
    if (favoriteLaundryStore) {
      handleOpenLaundry(favoriteLaundryStore);
    } else if (rawLaundries.length > 0) {
      handleOpenLaundry(rawLaundries[0]);
    } else {
      navigation.navigate('SelectLocation', { isMandatory: false });
    }
  };

  const handleQuickAddGarment = (garment) => {
    const targetLaundry = favoriteLaundryStore || (rawLaundries.length > 0 ? rawLaundries[0] : null);
    if (!targetLaundry) {
      navigation.navigate('SelectLocation', { isMandatory: false });
      return;
    }
    const targetLaundryId = targetLaundry._id || targetLaundry.id;
    const targetName = targetLaundry.name || 'Laundry Store';
    const targetAddress = targetLaundry.address || targetLaundry.city || '';

    const result = cart.addItem({
      laundryId: targetLaundryId,
      laundryName: targetName,
      laundryAddress: targetAddress,
      service: garment.serviceObj,
      clothingItem: garment.clothingItemObj,
    });

    if (result?.conflict) {
      setPendingConflictData({
        laundryId: targetLaundryId,
        laundryName: targetName,
        laundryAddress: targetAddress,
        service: garment.serviceObj,
        clothingItem: garment.clothingItemObj,
        currentLaundryName: result.currentLaundry?.name || 'Another Laundry',
      });
      setConflictModalVisible(true);
    }
  };

  const handleConfirmSwitch = () => {
    if (!pendingConflictData) return;
    cart.clearAndAddItem({
      laundryId: pendingConflictData.laundryId,
      laundryName: pendingConflictData.laundryName,
      laundryAddress: pendingConflictData.laundryAddress,
      service: pendingConflictData.service,
      clothingItem: pendingConflictData.clothingItem,
    });
    setConflictModalVisible(false);
    setPendingConflictData(null);
  };

  const handleDismissConflict = () => {
    setConflictModalVisible(false);
    setPendingConflictData(null);
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Sarah';

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: colors.background }}>
      {/* ── Modern Real-App Top Header Bar ── */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerLeft}>
          <View style={styles.brandRow}>
            <Image source={ASSETS.logo} style={styles.headerLogo} resizeMode="cover" />
            <View style={styles.brandTextColumn}>
              <View style={styles.brandTitleContainer}>
                <Text style={styles.brandTitleFirst}>Laundry</Text>
                <Text style={styles.brandTitleSecond}>Wave</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.locationSelector}
                onPress={() => navigation.navigate('SelectLocation', { isMandatory: false })}
              >
                <Icon name="map-pin" size={12} color={BRAND_PRIMARY} />
                <Text variant="caption" weight="semibold" style={{ color: colors.textSecondary, marginLeft: 3 }} numberOfLines={1}>
                  {city ? `${city}, MP` : 'Indore, MP'}
                </Text>
                <Icon name="chevron-down" size={11} color={colors.textSecondary} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Cart Icon with badge */}
          <Pressable
            style={[styles.actionIconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
            onPress={handleViewCart}
            accessibilityLabel="Shopping Cart"
          >
            <Icon name="shopping-bag" size={18} color={colors.textPrimary} />
            {cartSummary.totalItems > 0 && (
              <View style={[styles.badgeCounter, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{cartSummary.totalItems}</Text>
              </View>
            )}
          </Pressable>

          {/* Notification Bell */}
          <Pressable
            style={[styles.actionIconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
            onPress={handleMyOrders}
            accessibilityLabel="Notifications"
          >
            <Icon name="bell" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* ── Main Marketplace Scroll Content ── */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: cartSummary.totalItems > 0 ? 120 : 80 },
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
        {/* FIRST OPEN: Location Required Block */}
        {isLocationHydrated && !isLocationEstablished ? (
          <Card variant="elevated" style={styles.locationPromptCard}>
            <Icon name="map-pin" size={32} color={colors.primary} />
            <Text variant="h3" weight="bold" colorVariant="primary" style={{ marginTop: 8, marginBottom: 4 }}>
              Set Your Delivery Location
            </Text>
            <Text variant="bodySmall" colorVariant="secondary" align="center" style={{ marginBottom: 16 }}>
              LaundryWave pairs you exclusively with verified laundries in your city within 20 KM.
            </Text>
            <Button
              title="Select Location / Use GPS"
              variant="primary"
              size="md"
              onPress={() => navigation.navigate('SelectLocation', { isMandatory: true })}
            />
          </Card>
        ) : (
          <>
            {/* ── HERO BANNER: Schedule Your Pickup Today! ── */}
            <View style={styles.heroBanner}>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>Schedule Your Pickup Today!</Text>
                <Text style={styles.heroSubtitle}>Fast, Clean, Fresh Laundry</Text>
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.heroCtaBtn}
                  onPress={handleBookPickupBanner}
                >
                  <Text style={styles.heroCtaText}>Book a Pickup 📅</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dotsRow}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>

            {/* ── 4 SERVICE CATEGORIES GRID (Unified Brand Theme) ── */}
            <View style={styles.servicesGrid}>
              {SERVICE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.8}
                    style={[
                      styles.serviceCategoryCard,
                      {
                        backgroundColor: isSelected ? BRAND_PRIMARY : BRAND_LIGHT,
                        borderColor: isSelected ? BRAND_PRIMARY : BRAND_BORDER,
                        borderWidth: 1.5,
                      },
                    ]}
                    onPress={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
                  >
                    <View
                      style={[
                        styles.categoryIconCircle,
                        { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#FFFFFF' },
                      ]}
                    >
                      {cat.image ? (
                        <Image source={cat.image} style={styles.catImageThumb} resizeMode="cover" />
                      ) : (
                        <Icon
                          name={cat.iconName}
                          size={22}
                          color={isSelected ? '#FFFFFF' : BRAND_PRIMARY}
                        />
                      )}
                    </View>
                    <Text
                      variant="caption"
                      weight="bold"
                      style={[
                        styles.categoryLabel,
                        { color: isSelected ? '#FFFFFF' : '#0F172A' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                    <Text
                      variant="caption"
                      style={[
                        styles.categorySub,
                        { color: isSelected ? 'rgba(255,255,255,0.85)' : '#64748B' },
                      ]}
                    >
                      {cat.sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>


            {/* ── ACTIVE ORDERS CARD ── */}
            {activeOrder ? (
              <View style={styles.activeOrdersSection}>
                <Text variant="bodyMedium" weight="bold" colorVariant="primary" style={{ marginBottom: 8 }}>
                  Active Orders
                </Text>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('OrderDetail', { orderId: activeOrder._id || activeOrder.id })}
                >
                  <Card variant="elevated" style={styles.activeOrderCard}>
                    <View style={styles.orderHeaderRow}>
                      <Text variant="bodySmall" weight="bold" colorVariant="primary">
                        Order #{activeOrder.orderNumber || (activeOrder._id || '').slice(-5).toUpperCase() || 'W7834'}
                      </Text>
                      <Badge
                        label={activeOrder.status?.replace('_', ' ').toUpperCase() || 'IN PROGRESS'}
                        variant={['delivered', 'ready_for_delivery'].includes(activeOrder.status) ? 'success' : 'info'}
                        size="sm"
                      />
                    </View>

                    {/* Stepper Pipeline */}
                    <View style={styles.stepperContainer}>
                      <View style={[styles.stepPill, styles.stepPillDone]}>
                        <Text style={styles.stepPillDoneText}>Picked Up</Text>
                      </View>
                      <Text style={styles.stepArrow}>➔</Text>
                      <View
                        style={[
                          styles.stepPill,
                          ['processing', 'in_progress', 'ready_for_delivery', 'out_for_delivery'].includes(activeOrder.status)
                            ? styles.stepPillActive
                            : styles.stepPillDefault,
                        ]}
                      >
                        <Text
                          style={
                            ['processing', 'in_progress', 'ready_for_delivery', 'out_for_delivery'].includes(activeOrder.status)
                              ? styles.stepPillActiveText
                              : styles.stepPillDefaultText
                          }
                        >
                          Washing
                        </Text>
                      </View>
                      <Text style={styles.stepArrow}>➔</Text>
                      <View
                        style={[
                          styles.stepPill,
                          ['out_for_delivery', 'delivered'].includes(activeOrder.status)
                            ? styles.stepPillActive
                            : styles.stepPillDefault,
                        ]}
                      >
                        <Text
                          style={
                            ['out_for_delivery', 'delivered'].includes(activeOrder.status)
                              ? styles.stepPillActiveText
                              : styles.stepPillDefaultText
                          }
                        >
                          Delivery
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* ── SEARCH INPUT BAR ── */}
            <View style={styles.searchContainer}>
              <Input
                placeholder={`Search laundries or services in ${city || 'Indore'}...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
                containerStyle={{ marginBottom: spacing.xs }}
              />
            </View>

            {/* ── SORT LAUNDRIES SELECTOR ── */}
            <View style={styles.sortSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={false}
                contentContainerStyle={styles.sortScroll}
              >
                {SORT_OPTIONS.map((sort) => {
                  const isSelected = selectedSort === sort.id;
                  return (
                    <TouchableOpacity
                      key={sort.id}
                      activeOpacity={0.7}
                      style={[
                        styles.sortPill,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.borderLight,
                        },
                      ]}
                      onPress={() => setSelectedSort(sort.id)}
                    >
                      <Text style={{ fontSize: 12, marginRight: 4 }}>{sort.icon}</Text>
                      <Text
                        variant="caption"
                        weight={isSelected ? 'bold' : 'medium'}
                        style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary }}
                      >
                        {sort.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Loading State */}
            {isLoading && (
              <View style={styles.loaderContainer}>
                <Loader size="large" message={`Discovering verified laundries in ${city}...`} />
              </View>
            )}

            {/* Error State */}
            {isError && !isLoading && (
              <ErrorState
                title="Unable to load laundries"
                message={error?.message || 'Could not connect to the laundry service. Please check your network connection.'}
                retryAction={refetch}
              />
            )}

            {/* Empty State */}
            {!isLoading && !isError && rawLaundries.length === 0 && (
              <EmptyState
                title="No Serviceable Laundries Found"
                message={
                  debouncedSearch
                    ? `No laundries in ${city} match "${debouncedSearch}". Try another keyword or clear filters.`
                    : `No active laundries are currently operating within 20 KM of ${city}.`
                }
                actionLabel={debouncedSearch ? 'Clear Search' : 'Change Location'}
                onAction={
                  debouncedSearch
                    ? () => setSearchQuery('')
                    : () => navigation.navigate('SelectLocation', { isMandatory: false })
                }
              />
            )}

            {/* ── VERIFIED LAUNDRIES LIST ── */}
            {!isLoading && rawLaundries.length > 0 && (
              <View style={styles.sectionArea}>
                <View style={styles.sectionHeader}>
                  <Text variant="title" weight="bold" colorVariant="primary">
                    Verified Stores ({rawLaundries.length})
                  </Text>
                  <Text variant="caption" colorVariant="muted">
                    Within 20 KM of {city || 'Indore'}
                  </Text>
                </View>

                {rawLaundries.map((laundry, index) => {
                  const distKm =
                    typeof laundry.distanceKm === 'number'
                      ? laundry.distanceKm
                      : laundry.distance
                      ? Number(laundry.distance) / 1000
                      : null;

                  const formattedDistance = distKm !== null ? `${distKm.toFixed(1)} km` : 'Near you';
                  const isUnder3Km = distKm !== null && distKm <= 3.0;
                  const laundryId = String(laundry._id || laundry.id);
                  const isFav = favoriteIds.includes(laundryId);
                  const storeRating = laundry.rating || 4.8;
                  const ordersCount = laundry.totalOrders || 8;

                  return (
                    <TouchableOpacity
                      key={laundry._id || laundry.id || `laundry_${index}`}
                      activeOpacity={0.9}
                      onPress={() => handleOpenLaundry(laundry)}
                      style={{ marginBottom: 14 }}
                    >
                      <View style={styles.storeCardWrapper}>
                        <View style={styles.storeCardHeader}>
                          {/* Store Image with Open status dot */}
                          <View style={styles.thumbnailContainer}>
                            <StoreLogoImage
                              uri={laundry.logo || laundry.coverImage}
                              name={laundry.name}
                              style={styles.storeThumbnail}
                              colors={colors}
                            />
                            <View style={styles.storeLiveTag}>
                              <View style={styles.storeLiveDot} />
                              <Text style={styles.storeLiveText}>OPEN</Text>
                            </View>
                          </View>

                          <View style={styles.storeInfo}>
                            {/* Store Name + Verified Badge + Heart */}
                            <View style={styles.storeTitleRow}>
                              <View style={styles.storeNameWithBadge}>
                                <Text
                                  variant="bodyMedium"
                                  weight="bold"
                                  colorVariant="primary"
                                  numberOfLines={1}
                                  style={styles.storeNameTitle}
                                >
                                  {laundry.name}
                                </Text>
                                <View style={styles.verifiedShield}>
                                  <Text style={styles.verifiedShieldIcon}>✓</Text>
                                </View>
                              </View>

                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation?.();
                                  toggleFavorite(laundry);
                                }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={{ padding: 4 }}
                              >
                                <Icon name="heart" size={20} color={isFav ? '#EF4444' : '#94A3B8'} />
                              </TouchableOpacity>
                            </View>

                            {/* Location & Distance with Pin */}
                            <Text variant="caption" colorVariant="secondary" numberOfLines={1} style={styles.storeAddressText}>
                              📍 {formattedDistance} • {laundry.address || laundry.city}
                            </Text>

                            {/* Rating and Features */}
                            <View style={styles.badgesRow}>
                              <View style={styles.storeRatingBadge}>
                                <Text style={styles.storeRatingStar}>★</Text>
                                <Text style={styles.storeRatingValue}>{Number(storeRating).toFixed(1)}</Text>
                                <Text style={styles.storeRatingCount}>({ordersCount}+)</Text>
                              </View>

                              <View style={styles.expressTurnaroundBadge}>
                                <Text style={styles.expressTurnaroundText}>⚡ {laundry.defaultTurnaroundHours || 24}h</Text>
                              </View>

                              {isUnder3Km && (
                                <View style={styles.freePickupBadge}>
                                  <Text style={styles.freePickupText}>FREE Pickup</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>

                        {/* Store Footer */}
                        <View style={styles.storeCardFooter}>
                          <Text style={styles.storeTimingText}>
                            🕒 {laundry.openTime || '09:00'} - {laundry.closeTime || '21:00'}
                          </Text>
                          <View style={styles.viewMenuButton}>
                            <Text style={styles.viewMenuButtonText}>View Services & Prices</Text>
                            <Text style={styles.viewMenuArrow}>›</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── FLOATING BOTTOM CART BAR (if items) ── */}
      {cartSummary.totalItems > 0 && (
        <View
          style={[
            styles.floatingCartBar,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder },
            shadows.lg,
          ]}
        >
          <View style={styles.cartBarInfo}>
            <Badge label={`${cartSummary.totalItems} ITEM${cartSummary.totalItems > 1 ? 'S' : ''}`} variant="primary" size="sm" />
            <Text variant="title" weight="bold" colorVariant="primary" style={{ marginTop: 2 }}>
              ₹{cartSummary.grandTotal}
            </Text>
            <Text variant="caption" colorVariant="secondary" numberOfLines={1}>
              {cart.laundryName || 'Selected Laundry'}
            </Text>
          </View>

          <Button title="View Cart →" variant="primary" size="md" onPress={handleViewCart} />
        </View>
      )}

      {/* ── MODERN BOTTOM NAVIGATION BAR ── */}
      <View style={[styles.bottomTabBar, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => {
            setActiveTab('home');
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          }}
        >
          <Icon name="home" size={20} color={activeTab === 'home' ? colors.primary : colors.textMuted} />
          <Text
            variant="caption"
            weight={activeTab === 'home' ? 'bold' : 'normal'}
            style={{ color: activeTab === 'home' ? colors.primary : colors.textMuted, marginTop: 2, fontSize: 11 }}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => {
            setActiveTab('services');
            setSelectedCategory('wash');
          }}
        >
          <Icon name="services" size={20} color={activeTab === 'services' ? colors.primary : colors.textMuted} />
          <Text
            variant="caption"
            weight={activeTab === 'services' ? 'bold' : 'normal'}
            style={{ color: activeTab === 'services' ? colors.primary : colors.textMuted, marginTop: 2, fontSize: 11 }}
          >
            Services
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={handleMyOrders}
        >
          <Icon name="orders" size={20} color={colors.textMuted} />
          <Text variant="caption" style={{ color: colors.textMuted, marginTop: 2, fontSize: 11 }}>
            My Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CustomerSettings')}
        >
          <Icon name="user" size={20} color={colors.textMuted} />
          <Text variant="caption" style={{ color: colors.textMuted, marginTop: 2, fontSize: 11 }}>
            Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Single Laundry Conflict Modal */}
      <SingleLaundryConflictModal
        visible={conflictModalVisible}
        currentLaundryName={pendingConflictData?.currentLaundryName || 'Another Laundry'}
        onClearAndSwitch={handleConfirmSwitch}
        onCancel={handleDismissConflict}
      />

      {/* Auth Gate Modal for Guest */}
      <AuthGateModal
        visible={authGateVisible}
        onClose={() => setAuthGateVisible(false)}
        title="Sign in to view orders"
        description="Login or register to track your live laundry pickups and previous bookings."
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  headerLogo: {
    width: 38,
    height: 38,
    borderRadius: 9,
  },
  brandTextColumn: {
    justifyContent: 'center',
  },
  brandTitleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandTitleFirst: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND_PRIMARY,
    letterSpacing: -0.3,
  },
  brandTitleSecond: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND_ORANGE,
    letterSpacing: -0.3,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCounter: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  heroBanner: {
    backgroundColor: '#F0F9FF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  heroTextContainer: {
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#0284C7',
    marginTop: 2,
    marginBottom: 14,
    fontWeight: '500',
  },
  heroCtaBtn: {
    backgroundColor: '#0284C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  heroCtaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    opacity: 0.4,
  },
  dotActive: {
    width: 16,
    backgroundColor: '#0284C7',
    opacity: 1,
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  serviceCategoryCard: {
    width: '23%',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  categoryLabel: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '700',
  },
  categorySub: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 1,
  },
  activeOrdersSection: {
    marginBottom: 16,
  },
  activeOrderCard: {
    padding: 14,
    borderRadius: 14,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  stepPillDone: {
    backgroundColor: '#E2E8F0',
  },
  stepPillDoneText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  stepPillActive: {
    backgroundColor: '#0284C7',
  },
  stepPillActiveText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepPillDefault: {
    backgroundColor: '#F1F5F9',
  },
  stepPillDefaultText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  stepArrow: {
    fontSize: 12,
    color: '#94A3B8',
  },
  searchContainer: {
    marginBottom: 10,
  },
  sortSection: {
    marginBottom: 14,
  },
  sortScroll: {
    gap: 8,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  sectionArea: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  storeCardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  storeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumbnailContainer: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 12,
    overflow: 'hidden',
  },
  storeThumbnail: {
    width: 76,
    height: 76,
    borderRadius: 12,
  },
  storeLiveTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  storeLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#22C55E',
  },
  storeLiveText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  fallbackLogo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  storeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeNameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  storeNameTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  verifiedShield: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  verifiedShieldIcon: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  storeAddressText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  storeRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  storeRatingStar: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: 'bold',
  },
  storeRatingValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#16A34A',
  },
  storeRatingCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803D',
  },
  expressTurnaroundBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  expressTurnaroundText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  freePickupBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freePickupText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  storeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  storeTimingText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
  },
  viewMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewMenuButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  viewMenuArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: -1,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 64,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    zIndex: 99,
  },
  cartBarInfo: {
    flex: 1,
    marginRight: 12,
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 60,
  },
  catImageThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  garmentSection: {
    marginTop: 14,
    marginBottom: 6,
  },
  garmentScroll: {
    paddingHorizontal: 2,
    gap: 12,
  },
  garmentCard: {
    width: 140,
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    overflow: 'hidden',
  },
  garmentPhoto: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  garmentInfo: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  garmentPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  garmentActionArea: {
    marginTop: 4,
  },
  garmentAddBtn: {
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  garmentAddBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  miniStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  miniStepperBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  locationPromptCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
    marginVertical: 20,
  },
  favoriteEmptyCard: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 4,
  },
});

export default CustomerHomeScreen;
