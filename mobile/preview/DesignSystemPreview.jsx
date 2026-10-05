import React, { useState } from 'react';
import { View, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../src/theme';
import { useUIStore } from '../src/store/uiStore';
import { illustrations } from '../src/assets';
import {
  Text,
  Button,
  Input,
  Card,
  Badge,
  Header,
  Divider,
  Modal,
  Loader,
  EmptyState,
  ErrorState,
} from '../src/components/ui';
import { useAuthStore } from '../src/store/authStore';
import { useCartStore } from '../src/store/cartStore';
import { authService } from '../src/services/authService';
import AuthGateModal from '../src/components/AuthGateModal';
import SuperAdminBlockedScreen from '../src/screens/auth/SuperAdminBlockedScreen';
import AdminHomeScreen from '../src/screens/admin/AdminHomeScreen';
import DeliveryHomeScreen from '../src/screens/delivery/DeliveryHomeScreen';

/**
 * LaundryFlow Ultra-Premium Mobile App & Design System Showcase (RN-2 & RN-3)
 * High-fidelity interactive mobile experience with realistic device frame,
 * dynamic tabs, live order telemetry, guest marketplace, and role-based access.
 */
export const DesignSystemPreview = () => {
  const { colors, spacing, radius, isDark } = useTheme();
  const themePreference = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  // Auth & Cart stores
  const auth = useAuthStore();
  const cart = useCartStore();
  const cartSummary = cart.getCartSummary();

  // Shell controls
  const [deviceFrame, setDeviceFrame] = useState(true); // Phone mockup vs expanded canvas
  const [currentTab, setCurrentTab] = useState('marketplace'); // 'marketplace' | 'home' | 'tracking' | 'services' | 'orders' | 'tokens'
  const [emptyOrdersToggle, setEmptyOrdersToggle] = useState(false);

  // RN-3 Marketplace & Auth States
  const [rn3AuthScreen, setRn3AuthScreen] = useState(null); // null | 'login' | 'register' | 'otp'
  const [rn3AuthGateVisible, setRn3AuthGateVisible] = useState(false);
  const [rn3CheckoutModalVisible, setRn3CheckoutModalVisible] = useState(false);
  const [rn3OrderSuccessVisible, setRn3OrderSuccessVisible] = useState(false);
  const [rn3Phone, setRn3Phone] = useState('9876543210');
  const [rn3Otp, setRn3Otp] = useState('123456');
  const [rn3StaffEmail, setRn3StaffEmail] = useState('admin@laundryflow.com');
  const [rn3StaffPassword, setRn3StaffPassword] = useState('admin123');
  const [rn3StaffTab, setRn3StaffTab] = useState('customer'); // 'customer' | 'staff'
  const [rn3SelectedCategory, setRn3SelectedCategory] = useState('All');
  const [rn3SearchQuery, setRn3SearchQuery] = useState('');
  const [rn3DeliveryAddress, setRn3DeliveryAddress] = useState('42 Palm Meadows, Indiranagar');

  // Interactive component states
  const [inputText, setInputText] = useState('123 Clean Way, Suite 4B');
  const [password, setPassword] = useState('Secret123!');
  const [centerModalVisible, setCenterModalVisible] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [overlayLoaderVisible, setOverlayLoaderVisible] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [selectedService, setSelectedService] = useState('wash_fold');

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const triggerLoaderOverlay = () => {
    setOverlayLoaderVisible(true);
    setTimeout(() => {
      setOverlayLoaderVisible(false);
    }, 1800);
  };

  const resolveImg = (img) => (typeof img === 'string' ? { uri: img } : img);

  // Sub-render: Mobile App Top Bar inside Phone
  const renderAppHeader = () => (
    <View style={[styles.appHeader, { borderBottomColor: colors.cardBorder }]}>
      <View style={styles.appHeaderUserRow}>
        <View style={styles.userAvatarContainer}>
          <View style={[styles.userAvatarCircle, { backgroundColor: colors.primary }]}>
            <Text variant="bodyMedium" weight="bold" colorVariant="inverse">S</Text>
          </View>
          <View>
            <View style={styles.greetingRow}>
              <Text variant="caption" colorVariant="secondary">Welcome back</Text>
              <View style={[styles.vipBadge, { backgroundColor: isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)' }]}>
                <Text variant="caption" weight="bold" colorVariant="brand">✦ VIP</Text>
              </View>
            </View>
            <Text variant="bodyMedium" weight="bold">Sarah Jenkins</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable
            onPress={toggleTheme}
            style={[styles.headerIconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}
          >
            <Text variant="bodySmall">{isDark ? '☀️' : '🌙'}</Text>
          </Pressable>
          <View style={[styles.headerIconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
            <Text variant="bodySmall">🔔</Text>
            <View style={[styles.notificationDot, { backgroundColor: colors.status.danger }]} />
          </View>
        </View>
      </View>

      {/* Address bar pill */}
      <View style={[styles.addressPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
        <Text variant="caption">📍</Text>
        <Text variant="caption" weight="semibold" numberOfLines={1} style={{ flex: 1 }}>
          742 Evergreen Terrace, Apt 3B
        </Text>
        <Text variant="caption" colorVariant="secondary">▼</Text>
      </View>
    </View>
  );

  // Sub-render: Realistic Bottom Tab Bar inside Phone
  const renderBottomNav = () => {
    const tabs = [
      { key: 'marketplace', label: 'RN-3 App', icon: '🛍️', badge: 'LIVE' },
      { key: 'home', label: 'Home', icon: '🏠' },
      { key: 'tracking', label: 'Tracking', icon: '📍', badge: '1' },
      { key: 'services', label: 'Services', icon: '✨' },
      { key: 'orders', label: 'Orders', icon: '🧺' },
      { key: 'tokens', label: 'System', icon: '📐' },
    ];

    return (
      <View style={[styles.bottomTabBar, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.cardBorder }]}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setCurrentTab(tab.key)}
              style={styles.tabItem}
            >
              <View style={styles.tabIconWrapper}>
                <Text style={{ fontSize: 18 }}>{tab.icon}</Text>
                {tab.badge && (
                  <View style={[styles.tabBadgeDot, { backgroundColor: colors.primary }]}>
                    <Text variant="caption" weight="bold" colorVariant="inverse" style={{ fontSize: 9 }}>
                      {tab.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                variant="caption"
                weight={isActive ? 'bold' : 'regular'}
                colorVariant={isActive ? 'brand' : 'muted'}
                style={{ fontSize: 10, marginTop: 2 }}
              >
                {tab.label}
              </Text>
              {isActive && <View style={[styles.activeTabIndicator, { backgroundColor: colors.primary }]} />}
            </Pressable>
          );
        })}
      </View>
    );
  };

  // Content 1: HOME TAB
  const renderHomeTab = () => (
    <View style={styles.tabContentContainer}>
      {/* Quick Service Chips */}
      <View style={styles.quickChipsRow}>
        <View style={[styles.quickChip, { backgroundColor: isDark ? 'rgba(124,58,237,0.18)' : '#F3E8FF', borderColor: colors.primary }]}>
          <Text variant="caption" weight="bold" colorVariant="brand">⚡ 24h Express</Text>
        </View>
        <View style={[styles.quickChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
          <Text variant="caption" colorVariant="secondary">👔 Dry Clean</Text>
        </View>
        <View style={[styles.quickChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
          <Text variant="caption" colorVariant="secondary">🧺 Wash & Fold</Text>
        </View>
        <View style={[styles.quickChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
          <Text variant="caption" colorVariant="secondary">👟 Sneakers</Text>
        </View>
      </View>

      {/* LIVE ACTIVE ORDER CARD */}
      <Card variant="elevated" padding="base" style={[styles.luxuryCard, { borderColor: isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.2)' }]}>
        <View style={styles.cardHeaderRow}>
          <View>
            <View style={styles.livePulseRow}>
              <View style={[styles.pulsingDot, { backgroundColor: colors.status.warning }]} />
              <Text variant="overline" colorVariant="brand">LIVE ORDER IN PROGRESS</Text>
            </View>
            <Text variant="title" weight="bold">Express Wash & Steam</Text>
          </View>
          <Badge variant="warning" size="sm" label="WASHING (2/3)" />
        </View>

        <View style={styles.mediaDetailsRow}>
          <Image
            source={resolveImg(illustrations.laundryWashing)}
            style={styles.cardMediaThumb}
            resizeMode="cover"
          />
          <View style={styles.mediaDetailsText}>
            <Text variant="bodySmall" weight="semibold">Garments: 6x Shirts, 2x Chinos</Text>
            <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
              Hypoallergenic wash • Ozone sanitization
            </Text>
            <View style={styles.etaRow}>
              <Text variant="caption" colorVariant="muted">Doorstep ETA:</Text>
              <Text variant="caption" weight="bold" colorVariant="primary"> Today, 5:45 PM</Text>
            </View>

            {/* Micro Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceElevated }]}>
                <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: '68%' }]} />
              </View>
              <View style={styles.progressLabelRow}>
                <Text variant="caption" colorVariant="muted" style={{ fontSize: 10 }}>Wash Cycle 2</Text>
                <Text variant="caption" weight="bold" colorVariant="brand" style={{ fontSize: 10 }}>68%</Text>
              </View>
            </View>
          </View>
        </View>

        <Divider spacing="sm" />

        <View style={styles.cardBottomActions}>
          <Button
            title="Track Washer Live"
            variant="primary"
            size="sm"
            onPress={() => setCurrentTab('tracking')}
            style={{ flex: 1 }}
          />
          <Button
            title="View Receipt"
            variant="surface"
            size="sm"
            onPress={() => alert('Order #LF-8492 Total: $32.50')}
            style={{ flex: 1 }}
          />
        </View>
      </Card>

      {/* QUICK STATS WIDGET */}
      <View style={[styles.quickStatsRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
        <View style={styles.quickStatItem}>
          <Text variant="title" weight="bold" colorVariant="brand">18</Text>
          <Text variant="caption" colorVariant="secondary">Washes Done</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
        <View style={styles.quickStatItem}>
          <Text variant="title" weight="bold" colorVariant="success">4.9 ★</Text>
          <Text variant="caption" colorVariant="secondary">User Rating</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
        <View style={styles.quickStatItem}>
          <Text variant="title" weight="bold" colorVariant="primary">38 kg</Text>
          <Text variant="caption" colorVariant="secondary">CO₂ Saved 🌱</Text>
        </View>
      </View>

      {/* COURIER DISPATCH PREVIEW */}
      <Card variant="default" padding="base" style={styles.luxuryCard}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text variant="overline" colorVariant="brand">ASSIGNED COURIER</Text>
            <Text variant="title" weight="bold">Pickup & Delivery</Text>
          </View>
          <Badge variant="info" size="sm" label="1.4 mi Away" />
        </View>

        <Image
          source={resolveImg(illustrations.pickupDelivery)}
          style={styles.heroBannerImage}
          resizeMode="cover"
        />

        <View style={styles.courierProfileRow}>
          <View style={[styles.driverAvatarBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
            <Text style={{ fontSize: 20 }}>🚚</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" weight="bold">Marcus Vance</Text>
            <Text variant="caption" colorVariant="secondary">EV Delivery Van #08 • 4.9 ★ (1.2k+ drops)</Text>
          </View>
          <Button
            title="Call"
            variant="surface"
            size="sm"
            onPress={() => alert('Calling driver Marcus (+1 555-0199)...')}
          />
        </View>

        <View style={[styles.metaInfoBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
          <Text variant="caption" colorVariant="muted">DELIVERY WINDOW</Text>
          <Text variant="bodySmall" weight="semibold">Today, 2:00 PM – 3:30 PM (in 25 mins)</Text>
        </View>
      </Card>

      {/* FEATURED SERVICES ROW */}
      <View style={styles.sectionHeaderRow}>
        <Text variant="title" weight="bold">Popular Services</Text>
        <Pressable onPress={() => setCurrentTab('services')}>
          <Text variant="caption" weight="bold" colorVariant="brand">See All →</Text>
        </Pressable>
      </View>

      <View style={styles.servicesRow}>
        {/* Service 1 */}
        <Card variant="elevated" padding="base" style={styles.serviceMiniCard}>
          <Image
            source={resolveImg(illustrations.washingMachine)}
            style={styles.serviceMiniImage}
            resizeMode="cover"
          />
          <Badge variant="primary" size="sm" label="TOP CHOICE" style={{ alignSelf: 'flex-start', marginVertical: 4 }} />
          <Text variant="bodyMedium" weight="bold">Smart Wash & Fold</Text>
          <Text variant="caption" colorVariant="secondary">Sanitized & bundled</Text>
          <Text variant="title" weight="bold" colorVariant="primary" style={{ marginTop: 6 }}>
            $2.49 <Text variant="caption" colorVariant="muted">/ lb</Text>
          </Text>
          <Button
            title="Book"
            variant="primary"
            size="sm"
            fullWidth
            style={{ marginTop: 8 }}
            onPress={() => alert('Booked Wash & Fold')}
          />
        </Card>

        {/* Service 2 */}
        <Card variant="elevated" padding="base" style={styles.serviceMiniCard}>
          <Image
            source={resolveImg(illustrations.foldedClothes)}
            style={styles.serviceMiniImage}
            resizeMode="cover"
          />
          <Badge variant="info" size="sm" label="PREMIUM" style={{ alignSelf: 'flex-start', marginVertical: 4 }} />
          <Text variant="bodyMedium" weight="bold">Deluxe Dry Cleaning</Text>
          <Text variant="caption" colorVariant="secondary">Hand pressed & bagged</Text>
          <Text variant="title" weight="bold" colorVariant="primary" style={{ marginTop: 6 }}>
            $4.99 <Text variant="caption" colorVariant="muted">/ item</Text>
          </Text>
          <Button
            title="Book"
            variant="outline"
            size="sm"
            fullWidth
            style={{ marginTop: 8 }}
            onPress={() => alert('Booked Dry Cleaning')}
          />
        </Card>
      </View>
    </View>
  );

  // Content 2: TRACKING TAB
  const renderTrackingTab = () => (
    <View style={styles.tabContentContainer}>
      <Card variant="glass" padding="base" style={styles.luxuryCard}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text variant="overline" colorVariant="brand">REAL-TIME GPS TELEMETRY</Text>
            <Text variant="title" weight="bold">Order #LF-8492 Tracking</Text>
          </View>
          <Badge variant="success" size="sm" label="ETA: 14 MINS" />
        </View>

        <Image
          source={resolveImg(illustrations.orderTracking)}
          style={styles.heroBannerImage}
          resizeMode="cover"
        />

        {/* Milestones Stepper */}
        <View style={styles.stepperBox}>
          {/* Step 1 */}
          <View style={styles.stepperRow}>
            <View style={[styles.stepCircleIcon, { backgroundColor: colors.status.success }]}>
              <Text variant="caption" colorVariant="inverse">✓</Text>
            </View>
            <View style={styles.stepTextContent}>
              <Text variant="bodySmall" weight="bold">1. Clothes Picked Up</Text>
              <Text variant="caption" colorVariant="muted">742 Evergreen Terrace (9:15 AM)</Text>
            </View>
          </View>
          <View style={[styles.stepperLine, { backgroundColor: colors.status.success }]} />

          {/* Step 2 */}
          <View style={styles.stepperRow}>
            <View style={[styles.stepCircleIcon, { backgroundColor: colors.status.success }]}>
              <Text variant="caption" colorVariant="inverse">✓</Text>
            </View>
            <View style={styles.stepTextContent}>
              <Text variant="bodySmall" weight="bold">2. Washed, Dried & Steam-Folded</Text>
              <Text variant="caption" colorVariant="muted">Quality inspection verified at Hub #4</Text>
            </View>
          </View>
          <View style={[styles.stepperLine, { backgroundColor: colors.primary }]} />

          {/* Step 3 */}
          <View style={styles.stepperRow}>
            <View style={[styles.stepCircleIcon, { backgroundColor: colors.primary }]}>
              <Text variant="caption" colorVariant="inverse">●</Text>
            </View>
            <View style={styles.stepTextContent}>
              <Text variant="bodySmall" weight="bold" colorVariant="brand">3. Out for Doorstep Delivery</Text>
              <Text variant="caption" colorVariant="secondary">Courier Marcus Vance is 1.4 mi away</Text>
            </View>
          </View>
          <View style={[styles.stepperLine, { backgroundColor: colors.cardBorder }]} />

          {/* Step 4 */}
          <View style={styles.stepperRow}>
            <View style={[styles.stepCircleIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder, borderWidth: 1 }]}>
              <Text variant="caption" colorVariant="muted">4</Text>
            </View>
            <View style={styles.stepTextContent}>
              <Text variant="bodySmall" colorVariant="muted">4. Delivered & Verified</Text>
              <Text variant="caption" colorVariant="muted">Estimated arrival today at 2:15 PM</Text>
            </View>
          </View>
        </View>

        <Divider spacing="sm" />

        <View style={styles.cardBottomActions}>
          <Button
            title="Message Courier"
            variant="surface"
            size="sm"
            onPress={() => alert('Messaging driver Marcus...')}
            style={{ flex: 1 }}
          />
          <Button
            title="Call Courier"
            variant="primary"
            size="sm"
            onPress={() => alert('Calling Marcus Vance...')}
            style={{ flex: 1 }}
          />
        </View>
      </Card>
    </View>
  );

  // Content 3: SERVICES TAB
  const renderServicesTab = () => (
    <View style={styles.tabContentContainer}>
      <Text variant="title" weight="bold" style={{ marginBottom: 4 }}>Full Service Catalog</Text>
      <Text variant="bodySmall" colorVariant="secondary" style={{ marginBottom: 16 }}>
        Professional garment care with zero carbon footprint & ozone sanitization.
      </Text>

      {/* Service A */}
      <Card variant="elevated" padding="base" style={styles.luxuryCard}>
        <Image
          source={resolveImg(illustrations.washingMachine)}
          style={styles.heroBannerImage}
          resizeMode="cover"
        />
        <View style={styles.cardHeaderRow}>
          <View>
            <Badge variant="primary" size="sm" label="MOST REQUESTED" style={{ alignSelf: 'flex-start', marginBottom: 4 }} />
            <Text variant="h3" weight="bold">Smart Wash & Fold</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="h2" weight="bold" colorVariant="primary">$2.49</Text>
            <Text variant="caption" colorVariant="muted">per pound</Text>
          </View>
        </View>
        <Text variant="bodySmall" colorVariant="secondary" style={{ marginVertical: 8 }}>
          Everyday clothes washed in gentle cold water, scented with natural lavender or fragrance-free detergent, and neatly stacked.
        </Text>
        <Button
          title="Schedule Wash & Fold Pickup"
          variant="primary"
          size="md"
          fullWidth
          onPress={() => alert('Opening Wash & Fold scheduler...')}
        />
      </Card>

      {/* Service B */}
      <Card variant="elevated" padding="base" style={styles.luxuryCard}>
        <Image
          source={resolveImg(illustrations.foldedClothes)}
          style={styles.heroBannerImage}
          resizeMode="cover"
        />
        <View style={styles.cardHeaderRow}>
          <View>
            <Badge variant="info" size="sm" label="EXECUTIVE CARE" style={{ alignSelf: 'flex-start', marginBottom: 4 }} />
            <Text variant="h3" weight="bold">Deluxe Dry Cleaning</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="h2" weight="bold" colorVariant="primary">$4.99</Text>
            <Text variant="caption" colorVariant="muted">per garment</Text>
          </View>
        </View>
        <Text variant="bodySmall" colorVariant="secondary" style={{ marginVertical: 8 }}>
          Suits, dresses, silks and delicate garments hand-inspected, stain-lifted, steam-pressed and returned on eco wooden hangers.
        </Text>
        <Button
          title="Schedule Dry Cleaning"
          variant="outline"
          size="md"
          fullWidth
          onPress={() => alert('Opening Dry Cleaning scheduler...')}
        />
      </Card>
    </View>
  );

  // Content 4: ORDERS TAB
  const renderOrdersTab = () => (
    <View style={styles.tabContentContainer}>
      {/* Toggle between Filled & Empty state */}
      <View style={[styles.stateSwitchBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
        <Button
          size="sm"
          variant={!emptyOrdersToggle ? 'primary' : 'ghost'}
          title="Completed & Active"
          onPress={() => setEmptyOrdersToggle(false)}
          style={{ flex: 1 }}
        />
        <Button
          size="sm"
          variant={emptyOrdersToggle ? 'primary' : 'ghost'}
          title="Empty Hamper State"
          onPress={() => setEmptyOrdersToggle(true)}
          style={{ flex: 1 }}
        />
      </View>

      {emptyOrdersToggle ? (
        <Card variant="glass" padding="base" style={styles.luxuryCard}>
          <EmptyState
            image={resolveImg(illustrations.emptyOrders)}
            title="Your Laundry Hamper is Empty"
            description="No active pickups or pending washes. Tap below to book a contactless doorstep pickup."
            actionLabel="Book a New Pickup"
            onActionPress={() => setEmptyOrdersToggle(false)}
          />
        </Card>
      ) : (
        <Card variant="default" padding="base" style={[styles.luxuryCard, { alignItems: 'center' }]}>
          <Image
            source={resolveImg(illustrations.orderSuccess)}
            style={styles.successImageLarge}
            resizeMode="contain"
          />
          <Badge variant="success" size="md" label="DELIVERY VERIFIED" style={{ marginTop: 12, marginBottom: 6 }} />
          <Text variant="h2" weight="bold" align="center">
            Laundry Delivered Fresh!
          </Text>
          <Text variant="bodySmall" colorVariant="secondary" align="center" style={{ maxWidth: 360, marginVertical: 6 }}>
            Order #LF-8420 was delivered to your front door. All items have been sanitized, inspected, and crisp-folded.
          </Text>

          <View style={[styles.receiptBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
            <View style={styles.receiptLine}>
              <Text variant="bodySmall" colorVariant="secondary">Total Weight / Items:</Text>
              <Text variant="bodySmall" weight="bold">14.2 lbs (12 Items)</Text>
            </View>
            <View style={styles.receiptLine}>
              <Text variant="bodySmall" colorVariant="secondary">Cleaning Duration:</Text>
              <Text variant="bodySmall" weight="bold">21 Hours 40 Mins</Text>
            </View>
            <View style={styles.receiptLine}>
              <Text variant="bodySmall" colorVariant="secondary">Total Paid:</Text>
              <Text variant="bodyMedium" weight="bold" colorVariant="brand">$35.35</Text>
            </View>
          </View>

          <View style={[styles.cardBottomActions, { width: '100%', marginTop: 12 }]}>
            <Button
              title="Download Receipt"
              variant="surface"
              size="sm"
              onPress={() => alert('Downloading receipt PDF...')}
              style={{ flex: 1 }}
            />
            <Button
              title="Tip Courier ($3)"
              variant="primary"
              size="sm"
              onPress={() => alert('Thank you for tipping Marcus!')}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      )}
    </View>
  );

  // ========================================================
  // RN-3 ROLE SIMULATOR & MULTI-LAUNDRY MARKETPLACE FLOW
  // ========================================================
  const PREVIEW_LAUNDRIES = [
    {
      id: 'laundry_1',
      name: 'Sparkle Express Laundry',
      rating: 4.8,
      reviewsCount: 312,
      eta: '24-48 hrs',
      distance: '1.2 km',
      tag: 'Popular',
      address: 'Shop 4, Sunrise Complex, Indiranagar',
      illustration: illustrations.washingMachine,
      services: [
        { id: 'srv_101', name: 'Wash & Fold Everyday Wear', category: 'Wash & Fold', price: 79, unit: 'kg', turnaround: '24h' },
        { id: 'srv_102', name: 'Premium Steam Ironing', category: 'Ironing', price: 25, unit: 'piece', turnaround: '12h' },
        { id: 'srv_103', name: 'Woolen & Suit Dry Cleaning', category: 'Dry Cleaning', price: 299, unit: 'piece', turnaround: '48h' },
      ],
    },
    {
      id: 'laundry_2',
      name: 'The Royal Laundry Club',
      rating: 4.9,
      reviewsCount: 480,
      eta: 'Next Day',
      distance: '2.4 km',
      tag: 'Eco-Care',
      address: 'Plot 18, Green Valley Avenue, Koramangala',
      illustration: illustrations.laundryWashing,
      services: [
        { id: 'srv_201', name: 'Organic Gentle Wash & Fold', category: 'Wash & Fold', price: 95, unit: 'kg', turnaround: '24h' },
        { id: 'srv_202', name: 'Delicate Silk & Saree Care', category: 'Dry Cleaning', price: 349, unit: 'piece', turnaround: '48h' },
        { id: 'srv_203', name: 'Premium Heavy Duvet & Comforter', category: 'Duvet & Bedding', price: 399, unit: 'piece', turnaround: '72h' },
      ],
    },
    {
      id: 'laundry_3',
      name: 'Urban Fabricators & Dry Cleaners',
      rating: 4.7,
      reviewsCount: 195,
      eta: '24-36 hrs',
      distance: '3.1 km',
      tag: 'Best Value',
      address: '22 Metro Station Road, HSR Layout',
      illustration: illustrations.foldedClothes,
      services: [
        { id: 'srv_301', name: 'Campus Student Wash & Iron', category: 'Wash & Fold', price: 69, unit: 'kg', turnaround: '24h' },
        { id: 'srv_302', name: 'Blazer & Formal Trouser Care', category: 'Dry Cleaning', price: 249, unit: 'piece', turnaround: '48h' },
        { id: 'srv_303', name: 'Designer Sneaker Deep Spa', category: 'Shoe Care', price: 399, unit: 'pair', turnaround: '48h' },
      ],
    },
  ];

  const renderRoleSimulatorBar = () => {
    const activeRole = !auth.isAuthenticated ? 'guest' : auth.role;

    return (
      <View style={[styles.roleBarContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
        <View style={styles.roleBarHeader}>
          <Text variant="caption" weight="bold" colorVariant="secondary">
            SIMULATE USER ROLE (RN-3):
          </Text>
          <Badge
            label={activeRole.toUpperCase()}
            variant={activeRole === 'guest' ? 'neutral' : activeRole === 'superadmin' ? 'danger' : 'success'}
            size="sm"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleBtnRow}>
          <Button
            size="sm"
            variant={activeRole === 'guest' ? 'primary' : 'ghost'}
            title="👤 Guest"
            onPress={() => {
              auth.logout();
              setRn3AuthScreen(null);
            }}
          />
          <Button
            size="sm"
            variant={activeRole === 'user' ? 'primary' : 'ghost'}
            title="👕 Customer"
            onPress={() => {
              auth.setAuth({
                accessToken: 'mock_jwt_customer',
                user: { name: 'Alex Johnson', email: 'alex@example.com', phone: '9876543210', role: 'user' },
              });
              setRn3AuthScreen(null);
            }}
          />
          <Button
            size="sm"
            variant={activeRole === 'admin' ? 'primary' : 'ghost'}
            title="🏪 Admin"
            onPress={() => {
              auth.setAuth({
                accessToken: 'mock_jwt_admin',
                user: { name: 'Rajesh Sharma', email: 'admin@sparklelaundry.com', phone: '9876543211', role: 'admin' },
              });
              setRn3AuthScreen(null);
            }}
          />
          <Button
            size="sm"
            variant={activeRole === 'delivery' ? 'primary' : 'ghost'}
            title="🛵 Delivery"
            onPress={() => {
              auth.setAuth({
                accessToken: 'mock_jwt_delivery',
                user: { name: 'Vikram Singh', email: 'delivery@laundryflow.com', phone: '9876543212', role: 'delivery' },
              });
              setRn3AuthScreen(null);
            }}
          />
          <Button
            size="sm"
            variant={activeRole === 'superadmin' ? 'primary' : 'ghost'}
            title="🛑 Superadmin"
            onPress={() => {
              auth.setAuth({
                accessToken: 'mock_jwt_super',
                user: { name: 'Platform Admin', email: 'superadmin@laundryflow.com', phone: '9876543213', role: 'superadmin' },
              });
              setRn3AuthScreen(null);
            }}
          />
        </ScrollView>
      </View>
    );
  };

  const renderMarketplaceTab = () => {
    // 1. Role Check: Superadmin (Mobile access blocked -> directs to Web Portal)
    if (auth.isAuthenticated && auth.role === 'superadmin') {
      return (
        <View style={styles.tabContentContainer}>
          {renderRoleSimulatorBar()}
          <Card variant="elevated" padding="base" style={[styles.luxuryCard, { alignItems: 'center', paddingVertical: 32 }]}>
            <Badge label="WEB PORTAL ONLY" variant="danger" size="md" style={{ marginBottom: 12 }} />
            <Text variant="h2" weight="bold" align="center" style={{ marginBottom: 4 }}>
              Super Admin Access
            </Text>
            <Text variant="bodySmall" colorVariant="secondary" align="center" style={{ maxWidth: 320, marginBottom: 20 }}>
              Super Admin privileges and multi-laundry governance are managed exclusively via the desktop Web Application.
            </Text>
            <View style={[styles.portalBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
              <Text variant="caption" colorVariant="muted" align="center">Please open from desktop:</Text>
              <Text variant="bodyMedium" weight="bold" colorVariant="brand" align="center" style={{ marginTop: 2 }}>
                https://superadmin.laundryflow.com
              </Text>
            </View>
            <Button
              title="Sign Out to Guest Marketplace"
              variant="outline"
              size="md"
              fullWidth
              onPress={() => auth.logout()}
              style={{ marginTop: 20 }}
            />
          </Card>
        </View>
      );
    }

    // 2. Role Check: Store Admin
    if (auth.isAuthenticated && auth.role === 'admin') {
      return (
        <View style={styles.tabContentContainer}>
          {renderRoleSimulatorBar()}
          <Card variant="elevated" padding="base" style={styles.luxuryCard}>
            <View style={styles.storeHeaderRow}>
              <View>
                <Text variant="h2" weight="bold">Store Manager Dashboard</Text>
                <Text variant="bodySmall" colorVariant="secondary">{auth.user?.name} ({auth.user?.email})</Text>
              </View>
              <Button title="Sign Out" variant="outline" size="sm" onPress={() => auth.logout()} />
            </View>
            <Divider spacing="md" />
            <View style={styles.adminStatsRow}>
              <View style={[styles.adminStatCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
                <Text variant="h2" weight="bold" colorVariant="brand">14</Text>
                <Text variant="caption" colorVariant="secondary">Active Washes</Text>
              </View>
              <View style={[styles.adminStatCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
                <Text variant="h2" weight="bold" colorVariant="success">6</Text>
                <Text variant="caption" colorVariant="secondary">Ready for Pickup</Text>
              </View>
              <View style={[styles.adminStatCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
                <Text variant="h2" weight="bold">₹8,450</Text>
                <Text variant="caption" colorVariant="secondary">Today's Revenue</Text>
              </View>
            </View>
          </Card>
        </View>
      );
    }

    // 3. Role Check: Delivery Partner
    if (auth.isAuthenticated && auth.role === 'delivery') {
      return (
        <View style={styles.tabContentContainer}>
          {renderRoleSimulatorBar()}
          <Card variant="elevated" padding="base" style={styles.luxuryCard}>
            <View style={styles.storeHeaderRow}>
              <View>
                <Text variant="h2" weight="bold">Delivery Captain</Text>
                <Text variant="bodySmall" colorVariant="secondary">{auth.user?.name} ({auth.user?.phone})</Text>
              </View>
              <Button title="Sign Out" variant="outline" size="sm" onPress={() => auth.logout()} />
            </View>
            <Divider spacing="md" />
            <View style={[styles.deliveryActiveBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
              <Badge label="NEXT PICKUP • 1.4 KM" variant="primary" size="sm" style={{ marginBottom: 6 }} />
              <Text variant="title" weight="bold">Flat 402, Sunrise Apartments</Text>
              <Text variant="bodySmall" colorVariant="secondary">Customer: Ananya S. • 2 Bags (Wash & Fold)</Text>
              <Button title="Start Navigation" variant="primary" size="sm" style={{ marginTop: 12 }} />
            </View>
          </Card>
        </View>
      );
    }

    // 4. In-Mockup Auth Screen: LOGIN
    if (rn3AuthScreen === 'login') {
      return (
        <View style={styles.tabContentContainer}>
          {renderRoleSimulatorBar()}
          <Card variant="elevated" padding="base" style={styles.luxuryCard}>
            <Text variant="h2" weight="bold" align="center">Sign In</Text>
            <Text variant="bodySmall" colorVariant="secondary" align="center" style={{ marginTop: 4, marginBottom: 16 }}>
              Access your LaundryFlow account & orders
            </Text>

            {auth.pendingIntent && (
              <View style={[styles.intentAlertBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
                <Badge label="BASKET PRESERVED" variant="success" size="sm" />
                <Text variant="bodySmall" style={{ marginTop: 4 }}>
                  Sign in to complete your order. Selected laundry and services are saved!
                </Text>
              </View>
            )}

            <View style={[styles.tabSwitchPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
              <Pressable
                style={[styles.subTabItem, rn3StaffTab === 'customer' && styles.subTabActive]}
                onPress={() => setRn3StaffTab('customer')}
              >
                <Text variant="buttonSmall" weight={rn3StaffTab === 'customer' ? 'bold' : 'normal'}>Customer (OTP)</Text>
              </Pressable>
              <Pressable
                style={[styles.subTabItem, rn3StaffTab === 'staff' && styles.subTabActive]}
                onPress={() => setRn3StaffTab('staff')}
              >
                <Text variant="buttonSmall" weight={rn3StaffTab === 'staff' ? 'bold' : 'normal'}>Staff / Admin</Text>
              </Pressable>
            </View>

            {rn3StaffTab === 'customer' ? (
              <View style={{ gap: 12 }}>
                <Input
                  label="Mobile Number"
                  value={rn3Phone}
                  onChangeText={setRn3Phone}
                  placeholder="10-digit phone number"
                  helperText="We'll send a 6-digit verification code"
                />
                <Button
                  title="Send Verification Code"
                  variant="primary"
                  size="md"
                  fullWidth
                  onPress={() => setRn3AuthScreen('otp')}
                />
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <Input label="Email" value={rn3StaffEmail} onChangeText={setRn3StaffEmail} placeholder="admin@laundryflow.com" />
                <Input label="Password" value={rn3StaffPassword} onChangeText={setRn3StaffPassword} secureTextEntry placeholder="••••••••" />
                <Button
                  title="Sign In as Staff"
                  variant="primary"
                  size="md"
                  fullWidth
                  onPress={() => {
                    auth.setAuth({
                      accessToken: 'mock_jwt_admin',
                      user: { name: 'Store Admin', email: rn3StaffEmail, role: 'admin' },
                    });
                    setRn3AuthScreen(null);
                  }}
                />
              </View>
            )}

            <Divider spacing="md" />
            <Button
              title="Continue Browsing as Guest"
              variant="ghost"
              size="sm"
              fullWidth
              onPress={() => setRn3AuthScreen(null)}
            />
          </Card>
        </View>
      );
    }

    // 5. In-Mockup Auth Screen: OTP VERIFY
    if (rn3AuthScreen === 'otp') {
      return (
        <View style={styles.tabContentContainer}>
          {renderRoleSimulatorBar()}
          <Card variant="elevated" padding="base" style={styles.luxuryCard}>
            <Badge label="SMS DISPATCHED" variant="primary" size="sm" style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text variant="h2" weight="bold" align="center">Verify Mobile</Text>
            <Text variant="bodySmall" colorVariant="secondary" align="center" style={{ marginTop: 4, marginBottom: 16 }}>
              Enter 6-digit code sent to +91 {rn3Phone}
            </Text>

            <Input
              label="6-Digit Verification Code"
              value={rn3Otp}
              onChangeText={setRn3Otp}
              placeholder="123456"
              helperText="Demo code: 123456"
            />

            <Button
              title="Verify & Continue"
              variant="primary"
              size="md"
              fullWidth
              style={{ marginTop: 16 }}
              onPress={() => {
                auth.setAuth({
                  accessToken: 'mock_jwt_verified',
                  user: { name: 'Alex Johnson', email: 'alex@example.com', phone: rn3Phone, role: 'user' },
                });
                const intent = auth.consumePendingIntent();
                setRn3AuthScreen(null);
                if (intent?.action === 'checkout') {
                  setRn3CheckoutModalVisible(true);
                }
              }}
            />

            <Button
              title="← Back to Login"
              variant="ghost"
              size="sm"
              fullWidth
              style={{ marginTop: 8 }}
              onPress={() => setRn3AuthScreen('login')}
            />
          </Card>
        </View>
      );
    }

    // 6. DEFAULT: Customer Multi-Laundry Marketplace (Guest Browsing Enabled)
    const filteredStores = PREVIEW_LAUNDRIES.filter((laundry) => {
      const matchesSearch =
        laundry.name.toLowerCase().includes(rn3SearchQuery.toLowerCase()) ||
        laundry.services.some((s) => s.name.toLowerCase().includes(rn3SearchQuery.toLowerCase()));
      const matchesCat =
        rn3SelectedCategory === 'All' ||
        laundry.services.some((s) => s.category === rn3SelectedCategory);
      return matchesSearch && matchesCat;
    });

    return (
      <View style={styles.tabContentContainer}>
        {renderRoleSimulatorBar()}

        {/* Marketplace Banner */}
        <Card variant="elevated" padding="base" style={styles.marketplaceBannerCard}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Badge label="GUEST BROWSING READY" variant="success" size="sm" style={{ marginBottom: 4 }} />
            <Text variant="h3" weight="bold">Multi-Laundry Marketplace</Text>
            <Text variant="bodySmall" colorVariant="secondary" style={{ marginTop: 2 }}>
              Browse nearby stores, compare prices, and add items freely. Login only needed when checking out!
            </Text>
          </View>
          <Image source={resolveImg(illustrations.pickupDelivery)} style={styles.bannerImgThumb} />
        </Card>

        {/* Search Input */}
        <Input
          placeholder="Search laundries, wash & fold, dry cleaning..."
          value={rn3SearchQuery}
          onChangeText={setRn3SearchQuery}
        />

        {/* Category Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catPillRow}>
          {['All', 'Wash & Fold', 'Dry Cleaning', 'Ironing', 'Duvet & Bedding', 'Shoe Care'].map((cat) => {
            const isSelected = rn3SelectedCategory === cat;
            return (
              <Pressable
                key={cat}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceElevated,
                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                  },
                ]}
                onPress={() => setRn3SelectedCategory(cat)}
              >
                <Text
                  variant="caption"
                  weight={isSelected ? 'bold' : 'normal'}
                  style={{ color: isSelected ? '#FFFFFF' : colors.textSecondary }}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Store Cards */}
        <View style={styles.marketplaceHeaderRow}>
          <Text variant="title" weight="bold">Nearby Laundries ({filteredStores.length})</Text>
          <Text variant="caption" colorVariant="secondary">Instant Doorstep Pickup</Text>
        </View>

        {filteredStores.map((laundry) => (
          <Card key={laundry.id} variant="elevated" padding="base" style={styles.storeCard}>
            <View style={styles.storeHeaderRow}>
              <Image source={resolveImg(laundry.illustration)} style={styles.storeLogo} />
              <View style={{ flex: 1 }}>
                <Text variant="h3" weight="bold">{laundry.name}</Text>
                <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
                  📍 {laundry.distance} • {laundry.address}
                </Text>
                <View style={styles.storeTagsRow}>
                  <Text variant="caption" weight="bold" style={{ color: colors.status.warning }}>★ {laundry.rating}</Text>
                  <Badge label={`⚡ ${laundry.eta}`} variant="info" size="sm" />
                  <Badge label={laundry.tag} variant="neutral" size="sm" />
                </View>
              </View>
            </View>

            <Divider spacing="sm" />
            <Text variant="caption" weight="bold" colorVariant="muted" style={{ marginBottom: 6 }}>
              POPULAR SERVICES
            </Text>

            {laundry.services.map((service) => {
              const inCartItem = cart.items.find((i) => i.id === service.id);
              const qty = inCartItem?.quantity || 0;

              return (
                <View key={service.id} style={[styles.serviceItemRow, { borderBottomColor: colors.cardBorder }]}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" weight="semibold">{service.name}</Text>
                    <Text variant="caption" colorVariant="secondary">
                      ₹{service.price} / {service.unit} • {service.turnaround}
                    </Text>
                  </View>

                  {qty > 0 ? (
                    <View style={[styles.qtyCounterBox, { borderColor: colors.primary, backgroundColor: colors.surfaceElevated }]}>
                      <Pressable style={styles.qtyActionBtn} onPress={() => cart.decrementItem(service.id)}>
                        <Text variant="bodySmall" weight="bold" style={{ color: colors.primary }}>−</Text>
                      </Pressable>
                      <Text variant="bodySmall" weight="bold" style={styles.qtyNum}>{qty}</Text>
                      <Pressable style={styles.qtyActionBtn} onPress={() => cart.incrementItem(service.id)}>
                        <Text variant="bodySmall" weight="bold" style={{ color: colors.primary }}>+</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      title="+ Add"
                      onPress={() =>
                        cart.addItem({
                          laundryId: laundry.id,
                          laundryName: laundry.name,
                          laundryAddress: laundry.address,
                          service,
                        })
                      }
                    />
                  )}
                </View>
              );
            })}
          </Card>
        ))}

        {/* Floating Basket Bar */}
        {cartSummary.totalItems > 0 && (
          <View style={[styles.cartFloatingBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
            <View style={{ flex: 1 }}>
              <Badge label={`${cartSummary.totalItems} ITEMS SELECTED`} variant="primary" size="sm" />
              <Text variant="title" weight="bold" style={{ marginTop: 2 }}>
                ₹{cartSummary.grandTotal}
              </Text>
              <Text variant="caption" colorVariant="secondary" numberOfLines={1}>{cart.laundryName}</Text>
            </View>
            <Button
              title="Place Order →"
              variant="primary"
              size="md"
              onPress={() => {
                if (!auth.isAuthenticated) {
                  auth.setPendingIntent({ action: 'checkout' });
                  setRn3AuthGateVisible(true);
                } else {
                  setRn3CheckoutModalVisible(true);
                }
              }}
            />
          </View>
        )}

        {/* Reusable Auth Gate Modal */}
        <AuthGateModal
          visible={rn3AuthGateVisible}
          onClose={() => setRn3AuthGateVisible(false)}
          onLogin={() => {
            setRn3AuthGateVisible(false);
            setRn3AuthScreen('login');
          }}
          onRegister={() => {
            setRn3AuthGateVisible(false);
            setRn3AuthScreen('login');
          }}
          title="Sign in to continue"
          description="Create an account or sign in to place your laundry order."
          pendingIntent={{ action: 'checkout' }}
        />

        {/* Checkout Order Review Modal */}
        <Modal
          visible={rn3CheckoutModalVisible}
          onClose={() => setRn3CheckoutModalVisible(false)}
          position="bottom"
          title="Review & Confirm Order"
          description={`Pickup from ${cart.laundryName || 'Selected Store'}`}
          footer={
            <View style={{ gap: 8 }}>
              <Button
                title={`Confirm & Book Pickup • ₹${cartSummary.grandTotal}`}
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => {
                  setRn3CheckoutModalVisible(false);
                  cart.clearCart();
                  setRn3OrderSuccessVisible(true);
                }}
              />
              <Button
                title="Continue Shopping"
                variant="ghost"
                size="sm"
                fullWidth
                onPress={() => setRn3CheckoutModalVisible(false)}
              />
            </View>
          }
        >
          <View style={{ gap: 10 }}>
            <View style={[styles.checkoutBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
              <Text variant="caption" weight="bold" colorVariant="muted">DELIVERY ADDRESS</Text>
              <Input
                value={rn3DeliveryAddress}
                onChangeText={setRn3DeliveryAddress}
                placeholder="Enter pickup address"
              />
            </View>

            <View style={[styles.checkoutBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
              <Text variant="caption" weight="bold" colorVariant="muted" style={{ marginBottom: 6 }}>
                ORDER BASKET ({cartSummary.totalItems} Items)
              </Text>
              {cart.items.map((it) => (
                <View key={it.id} style={styles.checkoutItemLine}>
                  <Text variant="bodySmall">{it.quantity}x {it.name}</Text>
                  <Text variant="bodySmall" weight="bold">₹{it.price * it.quantity}</Text>
                </View>
              ))}
              <Divider spacing="xs" />
              <View style={styles.checkoutItemLine}>
                <Text variant="caption" colorVariant="secondary">Item Subtotal:</Text>
                <Text variant="caption">₹{cartSummary.subtotal}</Text>
              </View>
              <View style={styles.checkoutItemLine}>
                <Text variant="caption" colorVariant="secondary">Pickup & Delivery Fee:</Text>
                <Text variant="caption">₹{cartSummary.deliveryFee}</Text>
              </View>
              <View style={styles.checkoutItemLine}>
                <Text variant="caption" colorVariant="secondary">Taxes & Packaging (5%):</Text>
                <Text variant="caption">₹{cartSummary.tax}</Text>
              </View>
              <Divider spacing="xs" />
              <View style={styles.checkoutItemLine}>
                <Text variant="bodyMedium" weight="bold">Grand Total:</Text>
                <Text variant="title" weight="bold" colorVariant="brand">₹{cartSummary.grandTotal}</Text>
              </View>
            </View>
          </View>
        </Modal>

        {/* Order Success Confirmation */}
        <Modal
          visible={rn3OrderSuccessVisible}
          onClose={() => setRn3OrderSuccessVisible(false)}
          title="Order Booked Successfully!"
          description="Your laundry pickup is confirmed and scheduled."
          footer={
            <Button
              title="Done & Back to Marketplace"
              variant="primary"
              size="md"
              fullWidth
              onPress={() => setRn3OrderSuccessVisible(false)}
            />
          }
        >
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Image source={resolveImg(illustrations.orderSuccess)} style={styles.successThumb} />
            <Badge label="PICKUP IN 45 MINS" variant="success" size="md" style={{ marginTop: 12 }} />
            <Text variant="bodySmall" colorVariant="secondary" align="center" style={{ marginTop: 8 }}>
              A verified delivery captain will arrive at your address to collect your clothes.
            </Text>
          </View>
        </Modal>
      </View>
    );
  };

  // Content 5: DESIGN TOKENS & SYSTEM SPECS
  const renderTokensTab = () => (
    <View style={styles.tabContentContainer}>
      {/* 1. TYPOGRAPHY */}
      <View style={styles.specSection}>
        <Text variant="h3" weight="bold">1. Typography Hierarchy</Text>
        <Text variant="bodySmall" colorVariant="secondary" style={{ marginBottom: 12 }}>
          Inter / System modern sans-serif stack across Android & Web.
        </Text>

        <Card variant="glass" padding="base" style={{ gap: 8 }}>
          <Text variant="h1">h1: Premium Laundry</Text>
          <Text variant="h2">h2: Express Cleaning</Text>
          <Text variant="h3">h3: Order Summary</Text>
          <Text variant="title">title: Schedule Pickup</Text>
          <Text variant="subtitle">subtitle: 2 Business Days Delivery</Text>
          <Text variant="body">body: Regular body typography for order breakdowns.</Text>
          <Text variant="bodyMedium">bodyMedium: Medium weight summary copy.</Text>
          <Text variant="bodySmall" colorVariant="secondary">bodySmall: Secondary caption details and microcopy.</Text>
          <Text variant="button">button: Button Callout Label</Text>
          <Text variant="caption" colorVariant="muted">caption: Micro timestamps and auxiliary meta</Text>
          <Text variant="overline" colorVariant="muted">OVERLINE: STATUS TRACKING</Text>
          <Text variant="label" colorVariant="brand">label: Semantic Brand Violet Label</Text>

          <Divider spacing="sm" />
          <Text variant="subtitle" weight="semibold">Semantic Text Colors:</Text>
          <View style={styles.rowWrap}>
            <Text colorVariant="primary">Primary</Text>
            <Text colorVariant="secondary">Secondary</Text>
            <Text colorVariant="muted">Muted</Text>
            <Text colorVariant="brand">Brand Violet</Text>
            <Text colorVariant="success">Success</Text>
            <Text colorVariant="warning">Warning</Text>
            <Text colorVariant="error">Error</Text>
            <Text colorVariant="info">Info</Text>
          </View>
        </Card>
      </View>

      {/* 2. BUTTONS */}
      <View style={styles.specSection}>
        <Text variant="h3" weight="bold">2. Button Components</Text>
        <Card variant="default" padding="base">
          <View style={[styles.rowWrap, { marginBottom: 12 }]}>
            <Button title="Primary" variant="primary" size="md" onPress={() => {}} />
            <Button title="Secondary" variant="secondary" size="md" onPress={() => {}} />
            <Button title="Outline" variant="outline" size="md" onPress={() => {}} />
            <Button title="Ghost" variant="ghost" size="md" onPress={() => {}} />
            <Button title="Surface" variant="surface" size="md" onPress={() => {}} />
            <Button title="Danger" variant="danger" size="md" onPress={() => {}} />
          </View>
          <View style={styles.rowWrap}>
            <Button title="Small" size="sm" variant="primary" onPress={() => {}} />
            <Button title="Medium" size="md" variant="primary" onPress={() => {}} />
            <Button title="Large" size="lg" variant="primary" onPress={() => {}} />
            <Button
              title={buttonLoading ? 'Loading...' : 'Toggle Load'}
              loading={buttonLoading}
              onPress={() => setButtonLoading(!buttonLoading)}
              variant="primary"
              size="md"
            />
          </View>
        </Card>
      </View>

      {/* 3. INPUTS */}
      <View style={styles.specSection}>
        <Text variant="h3" weight="bold">3. Form Inputs</Text>
        <Card variant="glass" padding="base">
          <Input
            label="Pickup Address"
            value={inputText}
            onChangeText={setInputText}
            placeholder="Enter address"
            helperText="Include unit or building"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Input
            label="Validation Error"
            value="invalid@"
            error="Please provide a valid email format"
          />
        </Card>
      </View>

      {/* 4. BADGES */}
      <View style={styles.specSection}>
        <Text variant="h3" weight="bold">4. Badges & Status</Text>
        <Card variant="default" padding="base">
          <View style={styles.rowWrap}>
            <Badge variant="primary" label="Ready for Pickup" />
            <Badge variant="success" label="Delivered" />
            <Badge variant="warning" label="In Washing" />
            <Badge variant="error" label="Payment Failed" />
            <Badge variant="info" label="Driver Dispatched" />
            <Badge variant="neutral" label="Archived" />
          </View>
        </Card>
      </View>

      {/* 5. MODALS & LOADERS */}
      <View style={styles.specSection}>
        <Text variant="h3" weight="bold">5. Modals & Loaders</Text>
        <Card variant="glass" padding="base">
          <View style={styles.rowWrap}>
            <Button
              title="Open Center Modal"
              variant="primary"
              size="md"
              onPress={() => setCenterModalVisible(true)}
            />
            <Button
              title="Open Bottom Sheet"
              variant="secondary"
              size="md"
              onPress={() => setBottomSheetVisible(true)}
            />
            <Button
              title="Trigger Full Loader"
              variant="surface"
              size="md"
              onPress={triggerLoaderOverlay}
            />
          </View>
        </Card>
      </View>
    </View>
  );

  return (
    <View style={[styles.rootBackdrop, { backgroundColor: isDark ? '#05070E' : '#E2E8F0' }]}>
      {/* Top Studio Control Bar */}
      <View style={[styles.studioControlBar, { backgroundColor: isDark ? '#090D16' : '#FFFFFF', borderBottomColor: isDark ? '#1E293B' : '#CBD5E1' }]}>
        <View style={styles.studioBrand}>
          <Text variant="h3" weight="bold" colorVariant="primary">
            LaundryFlow <Text variant="title" weight="regular" colorVariant="brand">Studio</Text>
          </Text>
          <Badge
            variant={isDark ? 'primary' : 'warning'}
            size="sm"
            label={isDark ? 'DARK NAVY' : 'CLEAN LIGHT'}
            style={{ marginLeft: 8 }}
          />
        </View>

        <View style={styles.studioControlsRight}>
          <Button
            size="sm"
            variant="surface"
            title={deviceFrame ? '🖥️ Full Width View' : '📱 Phone Mockup'}
            onPress={() => setDeviceFrame(!deviceFrame)}
            style={{ marginRight: 8 }}
          />
          <Button
            size="sm"
            variant="primary"
            title={isDark ? '☀️ Light Theme' : '🌙 Dark Theme'}
            onPress={toggleTheme}
          />
        </View>
      </View>

      {/* MAIN CONTENT AREA */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {deviceFrame ? (
          /* ========================================================
             LUXURY SMARTPHONE MOCKUP FRAME (iPhone 16 Pro styling)
             ======================================================== */
          <View style={[styles.phoneShell, { borderColor: isDark ? '#1E293B' : '#94A3B8', backgroundColor: colors.background }]}>
            {/* Realistic Status Bar */}
            <View style={styles.phoneStatusBar}>
              <Text variant="caption" weight="bold" style={styles.statusTime}>9:41</Text>
              {/* Dynamic Island */}
              <View style={styles.dynamicIsland}>
                <View style={styles.dynamicCamera} />
                <View style={styles.dynamicSensor} />
              </View>
              <View style={styles.statusIcons}>
                <Text style={{ fontSize: 11 }}>5G </Text>
                <Text style={{ fontSize: 11 }}>􀙇 </Text>
                <Text style={{ fontSize: 11 }}>🔋</Text>
              </View>
            </View>

            {/* App In-Screen Header */}
            {renderAppHeader()}

            {/* Scrollable Screen Content */}
            <ScrollView style={styles.phoneScrollArea} showsVerticalScrollIndicator={false}>
              {currentTab === 'marketplace' && renderMarketplaceTab()}
              {currentTab === 'home' && renderHomeTab()}
              {currentTab === 'tracking' && renderTrackingTab()}
              {currentTab === 'services' && renderServicesTab()}
              {currentTab === 'orders' && renderOrdersTab()}
              {currentTab === 'tokens' && renderTokensTab()}
            </ScrollView>

            {/* Realistic Bottom Tab Navigation */}
            {renderBottomNav()}

            {/* Bottom Home Indicator Bar */}
            <View style={styles.phoneHomeBarContainer}>
              <View style={[styles.phoneHomeBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' }]} />
            </View>
          </View>
        ) : (
          /* ========================================================
             EXPANDED FULL-WIDTH CANVAS MODE
             ======================================================== */
          <View style={[styles.expandedCanvas, { backgroundColor: colors.background }]}>
            {renderAppHeader()}

            {/* View switcher bar */}
            <View style={[styles.canvasTabsRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
              {['marketplace', 'home', 'tracking', 'services', 'orders', 'tokens'].map((key) => (
                <Button
                  key={key}
                  size="sm"
                  variant={currentTab === key ? 'primary' : 'ghost'}
                  title={key === 'marketplace' ? 'RN-3 APP' : key.toUpperCase()}
                  onPress={() => setCurrentTab(key)}
                  style={{ flex: 1 }}
                />
              ))}
            </View>

            {currentTab === 'marketplace' && renderMarketplaceTab()}
            {currentTab === 'home' && renderHomeTab()}
            {currentTab === 'tracking' && renderTrackingTab()}
            {currentTab === 'services' && renderServicesTab()}
            {currentTab === 'orders' && renderOrdersTab()}
            {currentTab === 'tokens' && renderTokensTab()}
          </View>
        )}
      </ScrollView>

      {/* INTERACTIVE CENTER MODAL */}
      <Modal
        visible={centerModalVisible}
        onClose={() => setCenterModalVisible(false)}
        title="Confirm Laundry Order"
        description="Please review your pickup details before confirming."
        footer={
          <View style={{ gap: 8 }}>
            <Button
              title="Confirm Order ($24.50)"
              variant="primary"
              size="md"
              onPress={() => setCenterModalVisible(false)}
            />
            <Button
              title="Cancel"
              variant="ghost"
              size="md"
              onPress={() => setCenterModalVisible(false)}
            />
          </View>
        }
      >
        <Text variant="body">Pickup: Tomorrow at 9:00 AM</Text>
        <Text variant="bodySmall" colorVariant="secondary" style={{ marginTop: 4 }}>
          Service: Express Wash & Fold (2 Bags)
        </Text>
      </Modal>

      {/* INTERACTIVE BOTTOM SHEET MODAL */}
      <Modal
        visible={bottomSheetVisible}
        position="bottom"
        onClose={() => setBottomSheetVisible(false)}
        title="Select Cleaning Preference"
        description="Customize detergent and fabric care preferences."
        footer={
          <Button
            title="Save Preferences"
            variant="primary"
            size="md"
            onPress={() => setBottomSheetVisible(false)}
          />
        }
      >
        <View style={{ gap: 8 }}>
          <Badge variant="primary" label="Hypoallergenic Detergent (Selected)" />
          <Badge variant="neutral" label="Cold Water Only" />
          <Badge variant="neutral" label="Low Heat Tumble Dry" />
        </View>
      </Modal>

      {/* FULL-SCREEN OVERLAY LOADER */}
      {overlayLoaderVisible && (
        <Loader overlay size="large" message="Processing order..." />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootBackdrop: {
    width: '100%',
    minHeight: '100%',
    flex: 1,
  },
  studioControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  studioBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studioControlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  /* PHONE MOCKUP SHELL (iPhone 16 Pro) */
  phoneShell: {
    width: '100%',
    maxWidth: 410,
    height: 760,
    borderRadius: 50,
    borderWidth: 10,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 24,
    display: 'flex',
    flexDirection: 'column',
  },
  phoneStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 4,
    zIndex: 10,
  },
  statusTime: {
    fontSize: 14,
    width: 44,
  },
  dynamicIsland: {
    width: 108,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    gap: 6,
  },
  dynamicCamera: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E1E24',
  },
  dynamicSensor: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F172A',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 44,
    justifyContent: 'flex-end',
  },
  appHeader: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  appHeaderUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 6,
    right: 6,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  phoneScrollArea: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 54,
  },
  tabIconWrapper: {
    position: 'relative',
  },
  tabBadgeDot: {
    position: 'absolute',
    top: -4,
    right: -8,
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabIndicator: {
    width: 16,
    height: 3,
    borderRadius: 2,
    marginTop: 3,
  },
  phoneHomeBarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  phoneHomeBar: {
    width: 130,
    height: 5,
    borderRadius: 3,
  },
  /* EXPANDED CANVAS MODE */
  expandedCanvas: {
    width: '100%',
    maxWidth: 720,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    overflow: 'hidden',
  },
  canvasTabsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginVertical: 16,
    gap: 4,
  },
  /* CONTENT STYLES */
  tabContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 16,
  },
  quickChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  luxuryCard: {
    borderRadius: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  livePulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mediaDetailsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cardMediaThumb: {
    width: 90,
    height: 90,
    borderRadius: 14,
  },
  mediaDetailsText: {
    flex: 1,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  cardBottomActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  heroBannerImage: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    marginBottom: 12,
  },
  courierProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  driverAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaInfoBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 2,
  },
  quickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  servicesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceMiniCard: {
    flex: 1,
    borderRadius: 16,
  },
  serviceMiniImage: {
    width: '100%',
    height: 90,
    borderRadius: 12,
  },
  stepperBox: {
    paddingLeft: 4,
    marginVertical: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepCircleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextContent: {
    flex: 1,
  },
  stepperLine: {
    width: 2,
    height: 16,
    marginLeft: 11,
    marginVertical: 2,
  },
  stateSwitchBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  successImageLarge: {
    width: 140,
    height: 140,
  },
  receiptBox: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    marginVertical: 8,
  },
  receiptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specSection: {
    marginBottom: 18,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  // RN-3 Marketplace & Role Simulator Styles
  roleBarContainer: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  roleBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  portalBox: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  adminStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  adminStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  deliveryActiveBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  intentAlertBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  tabSwitchPill: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  subTabActive: {
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  marketplaceBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bannerImgThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  catPillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  marketplaceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  storeCard: {
    marginBottom: 14,
  },
  storeHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  storeLogo: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  storeTagsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  serviceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  qtyCounterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  qtyActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qtyNum: {
    paddingHorizontal: 4,
  },
  cartFloatingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  checkoutBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  checkoutItemLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  successThumb: {
    width: 100,
    height: 100,
    borderRadius: 14,
  },
});

export default DesignSystemPreview;
