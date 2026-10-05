import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
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
import Input from '../../components/ui/Input';
import Divider from '../../components/ui/Divider';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

export const AdminDeliveryScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('partners'); // 'partners' | 'queue' | 'zones'
  const [addPartnerModalVisible, setAddPartnerModalVisible] = useState(false);
  const [assignOrderModalVisible, setAssignOrderModalVisible] = useState(false);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState(null);

  // Delivery Zone Modal & Form State
  const [zoneModalVisible, setZoneModalVisible] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneDeliveryFee, setZoneDeliveryFee] = useState('0');
  const [zoneMinOrderAmount, setZoneMinOrderAmount] = useState('0');
  const [zoneEstimatedHours, setZoneEstimatedHours] = useState('24');
  const [zonePincodes, setZonePincodes] = useState('');
  const [zoneRadiusKm, setZoneRadiusKm] = useState('10');
  const [zoneErrors, setZoneErrors] = useState({});

  // New Partner Form State
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerPassword, setPartnerPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Laundry Profile (for assignment mode)
  const {
    data: laundryProfile,
    refetch: refetchLaundry,
  } = useQuery({
    queryKey: ['admin-my-laundry'],
    queryFn: adminService.getMyLaundry,
    staleTime: 1000 * 60,
  });

  // Fetch Delivery Partners Query
  const {
    data: partners = [],
    isLoading: isPartnersLoading,
    isError: isPartnersError,
    error: partnersError,
    refetch: refetchPartners,
    isRefetching: isPartnersRefetching,
  } = useQuery({
    queryKey: ['admin-delivery-partners'],
    queryFn: adminService.getDeliveryPartners,
    staleTime: 1000 * 30,
  });

  const onlinePartnersCount = partners.filter(
    (p) => p.availabilityStatus === 'available' || (p.isActive && p.availabilityStatus !== 'offline')
  ).length;

  // Fetch Active Dispatch Queue Orders (pending, ready, out_for_delivery)
  const {
    data: allOrdersData,
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
    isRefetching: isOrdersRefetching,
  } = useQuery({
    queryKey: ['admin-orders', 'dispatch-queue'],
    queryFn: () => adminService.getOrders({ limit: 100 }),
    staleTime: 1000 * 20,
  });

  // Fetch Delivery Zones Query
  const {
    data: deliveryZones = [],
    isLoading: isZonesLoading,
    isError: isZonesError,
    error: zonesError,
    refetch: refetchZones,
    isRefetching: isZonesRefetching,
  } = useQuery({
    queryKey: ['admin-delivery-zones'],
    queryFn: adminService.getDeliveryZones,
    staleTime: 1000 * 30,
  });

  // Assignment Mode Mutation
  const updateAssignmentModeMutation = useMutation({
    mutationFn: ({ mode, autoAssignRadiusKm }) =>
      adminService.updateAssignmentMode({ mode, autoAssignRadiusKm }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-my-laundry'] });
      Alert.alert('Success', `Driver assignment mode set to "${data.driverAssignmentMode?.toUpperCase() || 'AUTOMATIC'}".`);
    },
    onError: (err) => {
      Alert.alert('Update Failed', err.response?.data?.message || err.message);
    },
  });

  // Auto-Assign Single Order Mutation
  const autoAssignOrderMutation = useMutation({
    mutationFn: (orderId) => adminService.autoAssignOrder(orderId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      const driverName = res.data?.deliveryPartner?.name || 'Partner';
      Alert.alert('Auto-Assigned', `Order successfully assigned to ${driverName}.`);
    },
    onError: (err) => {
      Alert.alert('Auto-Assignment Notice', err.response?.data?.message || err.message || 'No driver could be assigned.');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  // Create / Update Delivery Zone Mutation
  const saveZoneMutation = useMutation({
    mutationFn: (payload) => {
      if (editingZone) {
        return adminService.updateDeliveryZone(editingZone._id, payload);
      }
      return adminService.createDeliveryZone(payload);
    },
    onSuccess: () => {
      setZoneModalVisible(false);
      setEditingZone(null);
      resetZoneForm();
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] });
      Alert.alert('Success', `Delivery zone ${editingZone ? 'updated' : 'created'} successfully.`);
    },
    onError: (err) => {
      Alert.alert('Save Failed', err.response?.data?.message || err.message);
    },
  });

  // Toggle Delivery Zone Mutation
  const toggleZoneMutation = useMutation({
    mutationFn: (id) => adminService.toggleDeliveryZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] });
    },
    onError: (err) => {
      Alert.alert('Update Failed', err.response?.data?.message || err.message);
    },
  });

  // Delete Delivery Zone Mutation
  const deleteZoneMutation = useMutation({
    mutationFn: (id) => adminService.deleteDeliveryZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] });
      Alert.alert('Deleted', 'Delivery zone removed.');
    },
    onError: (err) => {
      Alert.alert('Delete Failed', err.response?.data?.message || err.message);
    },
  });

  const resetZoneForm = () => {
    setZoneName('');
    setZoneDeliveryFee('0');
    setZoneMinOrderAmount('0');
    setZoneEstimatedHours('24');
    setZonePincodes('');
    setZoneRadiusKm('10');
    setZoneErrors({});
  };

  const openAddZoneModal = () => {
    setEditingZone(null);
    resetZoneForm();
    setZoneModalVisible(true);
  };

  const openEditZoneModal = (zone) => {
    setEditingZone(zone);
    setZoneName(zone.name || '');
    setZoneDeliveryFee(String(zone.deliveryFee ?? 0));
    setZoneMinOrderAmount(String(zone.minOrderAmount ?? 0));
    setZoneEstimatedHours(String(zone.estimatedDeliveryHours ?? 24));
    setZonePincodes(Array.isArray(zone.pincodes) ? zone.pincodes.join(', ') : '');
    setZoneRadiusKm(String(zone.radiusKm ?? 10));
    setZoneErrors({});
    setZoneModalVisible(true);
  };

  const validateZoneForm = () => {
    const errs = {};
    if (!zoneName.trim()) errs.name = 'Zone name is required';
    if (isNaN(Number(zoneDeliveryFee)) || Number(zoneDeliveryFee) < 0) {
      errs.deliveryFee = 'Enter valid delivery fee';
    }
    if (isNaN(Number(zoneMinOrderAmount)) || Number(zoneMinOrderAmount) < 0) {
      errs.minOrderAmount = 'Enter valid minimum order amount';
    }
    if (isNaN(Number(zoneEstimatedHours)) || Number(zoneEstimatedHours) < 1) {
      errs.estimatedDeliveryHours = 'Enter valid hours';
    }
    setZoneErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveZone = () => {
    if (!validateZoneForm()) return;
    const pincodesArr = zonePincodes
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    saveZoneMutation.mutate({
      name: zoneName.trim(),
      deliveryFee: Number(zoneDeliveryFee),
      minOrderAmount: Number(zoneMinOrderAmount),
      estimatedDeliveryHours: Number(zoneEstimatedHours),
      pincodes: pincodesArr,
      radiusKm: Number(zoneRadiusKm) || 10,
    });
  };

  const activeQueueOrders = (allOrdersData?.data || []).filter((o) =>
    ['pending', 'picked_up', 'ready', 'out_for_delivery'].includes(o.status)
  );

  // Toggle Partner Status Mutation
  const togglePartnerMutation = useMutation({
    mutationFn: (id) => adminService.toggleDeliveryPartner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-partners'] });
    },
    onError: (err) => {
      Alert.alert('Update Failed', err.response?.data?.message || err.message);
    },
  });

  // Add Delivery Partner Mutation
  const addPartnerMutation = useMutation({
    mutationFn: (data) => adminService.addDeliveryPartner(data),
    onSuccess: () => {
      setAddPartnerModalVisible(false);
      setPartnerName('');
      setPartnerEmail('');
      setPartnerPhone('');
      setPartnerPassword('');
      setFormErrors({});
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-partners'] });
      Alert.alert('Success', 'Delivery partner added successfully.');
    },
    onError: (err) => {
      Alert.alert('Registration Failed', err.response?.data?.message || err.message || 'Could not add partner.');
    },
  });

  // Assign Partner to Order Mutation
  const assignPartnerMutation = useMutation({
    mutationFn: ({ orderId, partnerId }) =>
      adminService.assignDeliveryPartner(orderId, partnerId),
    onSuccess: () => {
      setAssignOrderModalVisible(false);
      setSelectedOrderForAssign(null);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      Alert.alert('Assigned', 'Delivery partner successfully assigned to order.');
    },
    onError: (err) => {
      Alert.alert('Assignment Failed', err.response?.data?.message || err.message);
    },
  });

  // Fetch Eligible Nearby Delivery Partners for selected order
  const {
    data: nearbyDrivers = [],
    isLoading: isNearbyLoading,
    isError: isNearbyError,
    error: nearbyError,
    refetch: refetchNearby,
  } = useQuery({
    queryKey: ['admin-nearby-drivers', selectedOrderForAssign?._id],
    queryFn: () => adminService.getNearbyDrivers(selectedOrderForAssign?._id),
    enabled: Boolean(selectedOrderForAssign?._id) && assignOrderModalVisible,
  });

  const handleAssignOrderPrompt = (partner) => {
    const isReassign = Boolean(selectedOrderForAssign?.deliveryPartner);
    const distInfo = partner.distance !== null ? ` (~${partner.distance} km away)` : '';
    const orderRef = selectedOrderForAssign?._id?.slice(-6)?.toUpperCase() || 'ORDER';
    Alert.alert(
      isReassign ? 'Confirm Reassignment' : 'Confirm Partner Assignment',
      `Assign shared delivery partner "${partner.name}"${distInfo} to order #${orderRef}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isReassign ? 'Reassign' : 'Assign',
          onPress: () =>
            assignPartnerMutation.mutate({
              orderId: selectedOrderForAssign?._id,
              partnerId: partner._id,
            }),
        },
      ]
    );
  };

  const validatePartnerForm = () => {
    const errs = {};
    if (!partnerName.trim()) errs.name = 'Full name is required';
    if (!partnerEmail.trim()) errs.email = 'Email address is required';
    if (!/^\d{10}$/.test(partnerPhone.trim())) errs.phone = 'Valid 10-digit phone number is required';
    if (!partnerPassword || partnerPassword.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddPartnerSubmit = () => {
    if (!validatePartnerForm()) return;
    addPartnerMutation.mutate({
      name: partnerName.trim(),
      email: partnerEmail.trim().toLowerCase(),
      phone: partnerPhone.trim(),
      password: partnerPassword,
    });
  };

  const renderPartnerItem = ({ item }) => {
    const statusVariant =
      item.availabilityStatus === 'available'
        ? 'success'
        : item.availabilityStatus === 'busy'
        ? 'warning'
        : 'neutral';
    const statusLabel = (item.availabilityStatus || (item.isActive ? 'available' : 'offline')).toUpperCase();

    return (
      <Card variant="elevated" style={[styles.cardItem, { backgroundColor: colors.surface }]}>
        <View style={styles.partnerTop}>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Text variant="subtitle" weight="bold" colorVariant="primary">
                {item.name}
              </Text>
              <Badge
                label={statusLabel}
                variant={statusVariant}
                size="sm"
                style={{ marginLeft: 8 }}
              />
            </View>
            <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
              📞 {item.phone} • ✉️ {item.email}
            </Text>
          </View>

          <View style={styles.switchWrapper}>
            <Switch
              value={item.isActive}
              onValueChange={() => togglePartnerMutation.mutate(item._id)}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#FFFFFF"
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>
      </Card>
    );
  };

  const renderZoneItem = ({ item }) => {
    return (
      <Card variant="elevated" style={[styles.cardItem, { backgroundColor: colors.surface }]}>
        <View style={styles.partnerTop}>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Text variant="subtitle" weight="bold" colorVariant="primary">
                {item.name}
              </Text>
              <Badge
                label={item.isActive ? 'ACTIVE' : 'INACTIVE'}
                variant={item.isActive ? 'success' : 'neutral'}
                size="sm"
                style={{ marginLeft: 8 }}
              />
            </View>
            <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
              Fee: ₹{item.deliveryFee} • Min Order: ₹{item.minOrderAmount} • Est: {item.estimatedDeliveryHours}h
            </Text>
            <Text variant="caption" colorVariant="muted" style={{ marginTop: 2 }}>
              {item.pincodes && item.pincodes.length > 0
                ? `Pincodes: ${item.pincodes.join(', ')}`
                : `Radius: ${item.radiusKm || 10} km`}
            </Text>
          </View>

          <View style={styles.switchWrapper}>
            <Switch
              value={item.isActive}
              onValueChange={() => toggleZoneMutation.mutate(item._id)}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#FFFFFF"
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>

        <Divider style={{ marginVertical: spacing.xs }} />

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button
            title="Edit"
            size="sm"
            variant="outline"
            onPress={() => openEditZoneModal(item)}
            style={{ marginRight: 8 }}
          />
          <Button
            title="Delete"
            size="sm"
            variant="ghost"
            onPress={() => {
              Alert.alert(
                'Delete Zone',
                `Are you sure you want to delete zone "${item.name}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteZoneMutation.mutate(item._id),
                  },
                ]
              );
            }}
          />
        </View>
      </Card>
    );
  };

  const renderQueueItem = ({ item }) => {
    const orderRef = item._id?.slice(-6)?.toUpperCase() || 'ORDER';
    const hasDriver = Boolean(item.deliveryPartner);
    const isAutoAssigned = item.assignmentInfo?.mode === 'automatic';
    const autoStatus = item.assignmentInfo?.status;

    return (
      <Card variant="elevated" style={[styles.cardItem, { backgroundColor: colors.surface }]}>
        <View style={styles.partnerTop}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text variant="subtitle" weight="bold" colorVariant="primary">
                Order #{orderRef}
              </Text>
              {isAutoAssigned && (
                <Badge
                  label="AUTO"
                  variant="info"
                  size="sm"
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>
            <Text variant="caption" colorVariant="muted" style={{ marginTop: 2 }}>
              Customer: {item.user?.name || 'Customer'} • ₹{item.totalAmount || 0}
            </Text>
            {item.deliveryFee > 0 && (
              <Text variant="caption" colorVariant="secondary">
                Delivery Fee: ₹{item.deliveryFee}
              </Text>
            )}
          </View>
          <Badge
            label={item.status?.replace('_', ' ').toUpperCase()}
            variant={
              item.status === 'ready'
                ? 'success'
                : item.status === 'out_for_delivery'
                ? 'warning'
                : 'info'
            }
            size="sm"
          />
        </View>

        <Divider style={{ marginVertical: spacing.xs }} />

        <View style={styles.queueBottom}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text variant="caption" colorVariant="muted">Assigned Driver:</Text>
            <Text variant="body" weight="medium" colorVariant="primary" style={{ marginTop: 2 }}>
              {hasDriver ? `🛵 ${item.deliveryPartner?.name || 'Partner'}` : '⚠️ Unassigned'}
            </Text>
            {autoStatus === 'failed' && (
              <Text variant="caption" colorVariant="error" style={{ marginTop: 2 }}>
                {item.assignmentInfo?.failureReason || 'Auto-assign failed'}
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {!hasDriver && (
              <Button
                title="⚡ Auto-Assign"
                size="sm"
                variant="outline"
                isLoading={autoAssignOrderMutation.isPending && autoAssignOrderMutation.variables === item._id}
                disabled={autoAssignOrderMutation.isPending}
                onPress={() => autoAssignOrderMutation.mutate(item._id)}
                style={{ marginRight: 6 }}
              />
            )}
            <Button
              title={hasDriver ? 'Reassign' : 'Manual'}
              size="sm"
              variant={hasDriver ? 'outline' : 'primary'}
              onPress={() => {
                setSelectedOrderForAssign(item);
                setAssignOrderModalVisible(true);
              }}
            />
          </View>
        </View>
      </Card>
    );
  };

  const isAutoAssignmentEnabled = laundryProfile?.driverAssignmentMode === 'automatic';

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text variant="h2" weight="bold" colorVariant="primary">
              Delivery Operations
            </Text>
            <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
              Manage fleet, zones & order dispatch
            </Text>
          </View>

          {activeTab === 'partners' && (
            <Badge
              label={`${onlinePartnersCount} ONLINE`}
              variant={onlinePartnersCount > 0 ? 'success' : 'neutral'}
              size="sm"
            />
          )}

          {activeTab === 'zones' && (
            <Button
              title="+ Add Zone"
              variant="primary"
              size="sm"
              onPress={openAddZoneModal}
            />
          )}
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabSwitcher, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'partners' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveTab('partners')}
            activeOpacity={0.7}
          >
            <Text
              variant="caption"
              weight="bold"
              style={{ color: activeTab === 'partners' ? '#FFFFFF' : colors.textPrimary }}
            >
              Fleet ({onlinePartnersCount}/{partners.length} Online)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'queue' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveTab('queue')}
            activeOpacity={0.7}
          >
            <Text
              variant="caption"
              weight="bold"
              style={{ color: activeTab === 'queue' ? '#FFFFFF' : colors.textPrimary }}
            >
              Queue ({activeQueueOrders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'zones' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveTab('zones')}
            activeOpacity={0.7}
          >
            <Text
              variant="caption"
              weight="bold"
              style={{ color: activeTab === 'zones' ? '#FFFFFF' : colors.textPrimary }}
            >
              Zones ({deliveryZones.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {activeTab === 'partners' ? (
        isPartnersLoading && !isPartnersRefetching ? (
          <View style={styles.centerContainer}>
            <Loader size="large" />
            <Text variant="body" colorVariant="secondary" style={{ marginTop: spacing.md }}>
              Loading delivery team...
            </Text>
          </View>
        ) : isPartnersError ? (
          <View style={styles.centerContainer}>
            <ErrorState
              title="Failed to load partners"
              message={partnersError?.message || 'Could not fetch delivery team.'}
              onRetry={refetchPartners}
            />
          </View>
        ) : (
          <FlatList
            data={partners}
            keyExtractor={(item) => item._id}
            renderItem={renderPartnerItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isPartnersRefetching}
                onRefresh={refetchPartners}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                title="No Delivery Partners Available"
                description="Delivery partners are onboarded and managed centrally by Super Admin. Active partners in your area will appear here automatically."
              />
            }
          />
        )
      ) : activeTab === 'queue' ? (
        <FlatList
          data={activeQueueOrders}
          keyExtractor={(item) => item._id}
          renderItem={renderQueueItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Card variant="outlined" style={[styles.cardItem, { marginBottom: 12, backgroundColor: colors.surface }]}>
              <View style={styles.partnerTop}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text variant="body" weight="bold" colorVariant="primary">
                    Automatic Driver Assignment
                  </Text>
                  <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
                    Auto-assigns nearest available driver (within {laundryProfile?.autoAssignRadiusKm || 10} km) on order placement.
                  </Text>
                </View>
                <Switch
                  value={isAutoAssignmentEnabled}
                  disabled={updateAssignmentModeMutation.isPending}
                  onValueChange={(val) =>
                    updateAssignmentModeMutation.mutate({
                      mode: val ? 'automatic' : 'manual',
                      autoAssignRadiusKm: laundryProfile?.autoAssignRadiusKm || 10,
                    })
                  }
                  trackColor={{ false: colors.borderLight, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </Card>
          }
          refreshControl={
            <RefreshControl
              refreshing={isOrdersRefetching}
              onRefresh={refetchOrders}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="Dispatch queue empty"
              description="No active orders awaiting pickup or delivery right now."
            />
          }
        />
      ) : (
        isZonesLoading && !isZonesRefetching ? (
          <View style={styles.centerContainer}>
            <Loader size="large" />
            <Text variant="body" colorVariant="secondary" style={{ marginTop: spacing.md }}>
              Loading delivery zones...
            </Text>
          </View>
        ) : isZonesError ? (
          <View style={styles.centerContainer}>
            <ErrorState
              title="Failed to load delivery zones"
              message={zonesError?.message || 'Could not fetch zones.'}
              onRetry={refetchZones}
            />
          </View>
        ) : (
          <FlatList
            data={deliveryZones}
            keyExtractor={(item) => item._id}
            renderItem={renderZoneItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isZonesRefetching}
                onRefresh={refetchZones}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                title="No delivery zones configured"
                description="Create delivery zones with custom fees and pincodes for your store."
                actionLabel="+ Add Delivery Zone"
                onAction={openAddZoneModal}
              />
            }
          />
        )
      )}



      {/* Modal: Assign Partner to Order */}
      <Modal
        visible={assignOrderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAssignOrderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text variant="h3" weight="bold" colorVariant="primary">
              Assign Partner
            </Text>
            <Text variant="caption" colorVariant="muted" style={{ marginVertical: 4 }}>
              Order #{selectedOrderForAssign?._id?.slice(-6)?.toUpperCase()}
            </Text>

            <Divider style={{ marginVertical: spacing.xs }} />

            {isNearbyLoading ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Loader size="small" />
                <Text variant="caption" colorVariant="secondary" style={{ marginTop: 10 }}>
                  Searching nearby eligible delivery partners...
                </Text>
              </View>
            ) : isNearbyError ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text variant="body" colorVariant="error" align="center">
                  {nearbyError?.message || 'Could not load nearby drivers.'}
                </Text>
                <Button
                  title="Retry"
                  size="sm"
                  variant="outline"
                  onPress={() => refetchNearby()}
                  style={{ marginTop: 10 }}
                />
              </View>
            ) : nearbyDrivers.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text variant="body" weight="medium" colorVariant="primary">
                  No Available Delivery Partners Nearby
                </Text>
                <Text variant="caption" colorVariant="muted" align="center" style={{ marginTop: 4 }}>
                  All delivery partners are currently busy or offline.
                </Text>
                <Button
                  title="Refresh"
                  size="sm"
                  variant="outline"
                  onPress={() => refetchNearby()}
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : (
              <FlatList
                data={nearbyDrivers}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => {
                  const isCurrent = selectedOrderForAssign?.deliveryPartner?._id === item._id;
                  const isNearest = index === 0 && item.distance !== null;

                  return (
                    <TouchableOpacity
                      style={[
                        styles.partnerPickerItem,
                        {
                          borderColor: isNearest ? colors.primary : colors.borderLight,
                          borderWidth: isNearest ? 1.5 : 1,
                        },
                      ]}
                      onPress={() => handleAssignOrderPrompt(item)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Text variant="body" weight="medium" colorVariant="primary">
                            🛵 {item.name}
                          </Text>
                          {isNearest && (
                            <Badge
                              label="NEAREST"
                              variant="success"
                              size="sm"
                              style={{ marginLeft: 6 }}
                            />
                          )}
                          <Badge
                            label={item.availabilityStatus?.toUpperCase() || 'AVAILABLE'}
                            variant="info"
                            size="sm"
                            style={{ marginLeft: 6 }}
                          />
                        </View>
                        <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
                          {item.distance !== null ? `📍 ${item.distance} km away` : '📍 Location not updated'}
                          {item.phone ? ` • 📞 ${item.phone}` : ''}
                        </Text>
                      </View>

                      <Button
                        title={isCurrent ? 'Assigned' : selectedOrderForAssign?.deliveryPartner ? 'Reassign' : 'Assign'}
                        size="sm"
                        variant={isCurrent ? 'outline' : 'primary'}
                        disabled={isCurrent || assignPartnerMutation.isPending}
                        isLoading={assignPartnerMutation.isPending}
                        onPress={() => handleAssignOrderPrompt(item)}
                      />
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <Button
              title="Close"
              variant="outline"
              size="md"
              onPress={() => setAssignOrderModalVisible(false)}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal: Add/Edit Delivery Zone */}
      <Modal
        visible={zoneModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setZoneModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text variant="h3" weight="bold" colorVariant="primary">
              {editingZone ? 'Edit Delivery Zone' : 'Create Delivery Zone'}
            </Text>
            <Text variant="caption" colorVariant="muted" style={{ marginVertical: 4 }}>
              Configure zone pricing, minimum order, and covered pincodes or radius.
            </Text>

            <Divider style={{ marginVertical: spacing.xs }} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Input
                label="Zone Name *"
                placeholder="e.g. South Delhi / Central City"
                value={zoneName}
                onChangeText={(t) => {
                  setZoneName(t);
                  if (zoneErrors.name) setZoneErrors((p) => ({ ...p, name: null }));
                }}
                error={zoneErrors.name}
                containerStyle={{ marginBottom: spacing.xs }}
              />

              <Input
                label="Delivery Fee (₹) *"
                placeholder="0 for free delivery"
                keyboardType="numeric"
                value={zoneDeliveryFee}
                onChangeText={(t) => {
                  setZoneDeliveryFee(t);
                  if (zoneErrors.deliveryFee) setZoneErrors((p) => ({ ...p, deliveryFee: null }));
                }}
                error={zoneErrors.deliveryFee}
                containerStyle={{ marginBottom: spacing.xs }}
              />

              <Input
                label="Minimum Order Amount (₹)"
                placeholder="0"
                keyboardType="numeric"
                value={zoneMinOrderAmount}
                onChangeText={(t) => {
                  setZoneMinOrderAmount(t);
                  if (zoneErrors.minOrderAmount) setZoneErrors((p) => ({ ...p, minOrderAmount: null }));
                }}
                error={zoneErrors.minOrderAmount}
                containerStyle={{ marginBottom: spacing.xs }}
              />

              <Input
                label="Estimated Delivery Hours"
                placeholder="e.g. 24"
                keyboardType="numeric"
                value={zoneEstimatedHours}
                onChangeText={(t) => {
                  setZoneEstimatedHours(t);
                  if (zoneErrors.estimatedDeliveryHours) setZoneErrors((p) => ({ ...p, estimatedDeliveryHours: null }));
                }}
                error={zoneErrors.estimatedDeliveryHours}
                containerStyle={{ marginBottom: spacing.xs }}
              />

              <Input
                label="Covered Pincodes (comma-separated)"
                placeholder="e.g. 110001, 110002, 110003"
                value={zonePincodes}
                onChangeText={setZonePincodes}
                containerStyle={{ marginBottom: spacing.xs }}
              />

              <Input
                label="Fallback Radius (km)"
                placeholder="10"
                keyboardType="numeric"
                value={zoneRadiusKm}
                onChangeText={setZoneRadiusKm}
                containerStyle={{ marginBottom: spacing.sm }}
              />

              <View style={styles.modalBtnRow}>
                <Button
                  title="Cancel"
                  variant="outline"
                  size="md"
                  onPress={() => setZoneModalVisible(false)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title={editingZone ? 'Save Changes' : 'Create Zone'}
                  variant="primary"
                  size="md"
                  isLoading={saveZoneMutation.isPending}
                  disabled={saveZoneMutation.isPending}
                  onPress={handleSaveZone}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
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
  cardItem: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  partnerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchWrapper: {
    paddingLeft: 8,
  },
  queueBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalBtnRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  partnerPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default AdminDeliveryScreen;
