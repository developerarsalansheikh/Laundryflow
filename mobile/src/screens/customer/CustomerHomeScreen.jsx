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
import Icon from '../../components/ui/Icon';

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
  },
  {
    id: 'dry_clean',
    label: 'Dry Clean',
    sub: 'Suits & silks',
    iconName: 'suit',
  },
  {
    id: 'iron',
    label: 'Iron Only',
    sub: 'Crisp & pressed',
    iconName: 'iron',
  },
  {
    id: 'shoe',
    label: 'Shoe Care',
    sub: 'Clean & polish',
    iconName: 'shoe',
  },
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

  const isFavorite = useFavoriteStore((state) => state.isFavorite);
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const refreshFavorites = useFavoriteStore((state) => state.refreshFavorites);

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
    if (rawLaundries.length > 0) {
      handleOpenLaundry(rawLaundries[0]);
    } else {
      navigation.navigate('SelectLocation', { isMandatory: false });
    }
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
                <Text style={styles.brandTitleSecond}>Flow</Text>
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
              LaundryFlow pairs you exclusively with verified laundries in your city within 20 KM.
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
                      <Icon
                        name={cat.iconName}
                        size={22}
                        color={isSelected ? '#FFFFFF' : BRAND_PRIMARY}
                      />
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
                  const isFav = isFavorite(laundry._id || laundry.id);
                  const storeRating = laundry.rating || 4.8;
                  const ordersCount = laundry.totalOrders || 8;

                  return (
                    <TouchableOpacity
                      key={laundry._id || laundry.id || `laundry_${index}`}
                      activeOpacity={0.88}
                      onPress={() => handleOpenLaundry(laundry)}
                    >
                      <Card variant="elevated" style={styles.storeCard}>
                        <View style={styles.storeCardHeader}>
                          {/* Store Image or Branded Initial */}
                          <StoreLogoImage
                            uri={laundry.logo || laundry.coverImage}
                            name={laundry.name}
                            style={styles.storeThumbnail}
                            colors={colors}
                          />

                          <View style={styles.storeInfo}>
                            <View style={styles.storeTitleRow}>
                              <Text
                                variant="bodyMedium"
                                weight="bold"
                                colorVariant="primary"
                                numberOfLines={1}
                                style={{ flex: 1, marginRight: 8 }}
                              >
                                {laundry.name}
                              </Text>

                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation?.();
                                  toggleFavorite(laundry);
                                }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={{ paddingHorizontal: 4 }}
                              >
                                <Icon name="heart" size={20} color={isFav ? '#EF4444' : colors.textMuted} />
                              </TouchableOpacity>
                            </View>

                            <Text variant="caption" colorVariant="secondary" numberOfLines={1} style={{ marginTop: 2 }}>
                              📍 {formattedDistance} • {laundry.address || laundry.city}
                            </Text>

                            {/* Service and Price Badges */}
                            <View style={styles.badgesRow}>
                              <View style={[styles.ratingPill, { backgroundColor: colors.surface }]}>
                                <Text variant="caption" weight="bold" style={{ color: colors.status.warning }}>
                                  ★ {Number(storeRating).toFixed(1)}
                                </Text>
                                <Text variant="caption" colorVariant="muted">
                                  {' '}
                                  ({ordersCount}+)
                                </Text>
                              </View>

                              {isUnder3Km ? (
                                <Badge label="FREE Pickup (≥ ₹100)" variant="success" size="sm" />
                              ) : (
                                <Badge label="Standard Distance Rates" variant="neutral" size="sm" />
                              )}

                              <Badge label={`⚡ ${laundry.defaultTurnaroundHours || 24}h`} variant="info" size="sm" />
                            </View>
                          </View>
                        </View>

                        {/* Store Footer */}
                        <View style={[styles.storeFooter, { borderTopColor: colors.borderLight }]}>
                          <Text variant="caption" colorVariant="muted">
                            🕒 {laundry.openTime || '10:00'} - {laundry.closeTime || '21:00'}
                          </Text>
                          <Text variant="bodySmall" weight="bold" style={{ color: colors.primary }}>
                            View Services & Prices →
                          </Text>
                        </View>
                      </Card>
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
  storeCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  storeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeThumbnail: {
    width: 68,
    height: 68,
    borderRadius: 10,
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
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  storeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
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
  locationPromptCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
    marginVertical: 20,
  },
});

export default CustomerHomeScreen;
