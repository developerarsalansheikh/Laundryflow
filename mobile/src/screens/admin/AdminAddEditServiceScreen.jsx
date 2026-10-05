import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { adminService } from '../../services/adminService';

// RN-2 Components
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Divider from '../../components/ui/Divider';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';

// ─────────────────────────────────────────────────────────────────────
// Category Configuration Map
// To add a new category: add an entry here. The form auto-adapts.
// ─────────────────────────────────────────────────────────────────────
export const SERVICE_CATEGORIES = [
  {
    id: 'wash',
    label: 'Wash & Fold',
    icon: '👕',
    description: 'Weight-based washing and folding',
    defaultUnit: 'per_kg',
    units: ['per_kg', 'per_piece'],
    hasItems: false,
  },
  {
    id: 'dry_clean',
    label: 'Dry Cleaning',
    icon: '🧥',
    description: 'Per garment dry cleaning with item pricing',
    defaultUnit: 'per_piece',
    units: ['per_piece'],
    hasItems: true,
    hasClothingType: true,
  },
  {
    id: 'iron',
    label: 'Steam Iron',
    icon: '👔',
    description: 'Per piece or weight-based ironing',
    defaultUnit: 'per_piece',
    units: ['per_piece', 'per_kg'],
    hasItems: false,
  },
  {
    id: 'wash_iron',
    label: 'Wash & Iron',
    icon: '🧼',
    description: 'Wash + iron combo service',
    defaultUnit: 'per_piece',
    units: ['per_piece', 'per_kg'],
    hasItems: false,
  },
  {
    id: 'premium',
    label: 'Premium Care',
    icon: '✨',
    description: 'Specialty/delicate fabric treatment',
    defaultUnit: 'per_piece',
    units: ['per_piece'],
    hasItems: true,
    hasClothingType: true,
  },
];

const UNIT_LABELS = { per_piece: 'Per Piece', per_kg: 'Per KG' };

const emptyItem = () => ({
  name: '',
  clothingType: '',
  price: '',
  description: '',
  isActive: true,
  estimatedHours: '24',
  _tempId: String(Date.now() + Math.random()),
});

// ─────────────────────────────────────────────────────────────────────
// Main Screen Component
// ─────────────────────────────────────────────────────────────────────
export const AdminAddEditServiceScreen = () => {
  const { colors, spacing } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { serviceId } = route.params || {};
  const isEditing = Boolean(serviceId);

  // ── Core form state ────────────────────────────────────────────
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('per_kg');
  const [category, setCategory] = useState('wash');
  const [estimatedHours, setEstimatedHours] = useState('24');
  const [clothingType, setClothingType] = useState('');
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});

  // ── Item modal state ───────────────────────────────────────────
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItem());
  const [itemErrors, setItemErrors] = useState({});

  const catConfig = SERVICE_CATEGORIES.find((c) => c.id === category) || SERVICE_CATEGORIES[0];

  // When category changes, update unit default
  useEffect(() => {
    const cat = SERVICE_CATEGORIES.find((c) => c.id === category);
    if (cat) setUnit(cat.defaultUnit);
  }, [category]);

  // ── Fetch existing service for edit ───────────────────────────
  const { data: existingService, isLoading: isFetchingService } = useQuery({
    queryKey: ['admin-service', serviceId],
    queryFn: () => adminService.getServiceById(serviceId),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingService) {
      setName(existingService.name || '');
      setDescription(existingService.description || '');
      setPrice(existingService.price ? String(existingService.price) : '');
      setUnit(existingService.unit || 'per_piece');
      setCategory(existingService.category || 'wash');
      setEstimatedHours(existingService.estimatedHours ? String(existingService.estimatedHours) : '24');
      setClothingType(existingService.clothingType || '');
      setItems(
        (existingService.items || []).map((item, idx) => ({
          ...item,
          price: String(item.price || ''),
          estimatedHours: String(item.estimatedHours || '24'),
          _tempId: String(idx),
        }))
      );
    }
  }, [existingService]);

  // ── Save mutation ──────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (isEditing) return adminService.updateService(serviceId, payload);
      return adminService.createService(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      Alert.alert(
        'Success',
        isEditing ? 'Service updated successfully.' : 'New service added to catalog.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: (err) => {
      Alert.alert('Save Failed', err.response?.data?.message || err.message || 'Could not save service.');
    },
  });

  // ── Validation ─────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Service name is required';
    const hasSubItems = catConfig.hasItems && items.length > 0;
    if (!hasSubItems && (!price || isNaN(Number(price)) || Number(price) <= 0)) {
      errs.price = 'Please enter a valid price greater than 0';
    }
    if (!estimatedHours || isNaN(Number(estimatedHours)) || Number(estimatedHours) < 1) {
      errs.estimatedHours = 'Estimated turnaround must be at least 1 hour';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const hasSubItems = catConfig.hasItems && items.length > 0;
    const payload = {
      name: name.trim(),
      description: description.trim(),
      category,
      unit,
      estimatedHours: Number(estimatedHours),
      price: hasSubItems ? 0 : Number(price),
    };
    if (catConfig.hasClothingType) payload.clothingType = clothingType.trim() || null;
    if (catConfig.hasItems) {
      payload.items = items.map((item) => ({
        name: item.name.trim(),
        clothingType: item.clothingType?.trim() || '',
        price: Number(item.price),
        description: item.description?.trim() || '',
        isActive: item.isActive !== false,
        estimatedHours: Number(item.estimatedHours || 24),
      }));
    }
    saveMutation.mutate(payload);
  };

  // ── Item modal handlers ────────────────────────────────────────
  const openAddItem = () => {
    setEditingItemIndex(null);
    setItemForm(emptyItem());
    setItemErrors({});
    setItemModalVisible(true);
  };

  const openEditItem = (index) => {
    setEditingItemIndex(index);
    setItemForm({ ...items[index] });
    setItemErrors({});
    setItemModalVisible(true);
  };

  const validateItem = () => {
    const errs = {};
    if (!itemForm.name.trim()) errs.name = 'Item name is required';
    if (!itemForm.price || isNaN(Number(itemForm.price)) || Number(itemForm.price) <= 0) {
      errs.price = 'Enter a valid price';
    }
    setItemErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveItem = () => {
    if (!validateItem()) return;
    const updated = [...items];
    if (editingItemIndex !== null) {
      updated[editingItemIndex] = { ...itemForm };
    } else {
      updated.push({ ...itemForm, _tempId: String(Date.now()) });
    }
    setItems(updated);
    setItemModalVisible(false);
  };

  const handleDeleteItem = (index) => {
    Alert.alert('Remove Item', 'Remove this garment item from the service?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setItems(items.filter((_, i) => i !== index)) },
    ]);
  };

  // ── Loading state ──────────────────────────────────────────────
  if (isEditing && isFetchingService) {
    return (
      <ScreenContainer style={styles.centerContainer}>
        <Loader size="large" />
        <Text variant="body" colorVariant="secondary" style={{ marginTop: spacing.md }}>
          Loading service details...
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={{ fontSize: 18, color: colors.primary }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text variant="h2" weight="bold" colorVariant="primary">
            {isEditing ? 'Edit Service' : 'Add New Service'}
          </Text>
          <Text variant="caption" colorVariant="secondary">
            {catConfig.icon} {catConfig.description}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── Category Selection ───────────────────────────────── */}
        <Card variant="elevated" style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <Text variant="subtitle" weight="bold" colorVariant="primary" style={{ marginBottom: 10 }}>
            Service Category *
          </Text>
          <View style={styles.categoriesGrid}>
            {SERVICE_CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      borderColor: isSelected ? colors.primary : colors.borderLight,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text
                    variant="caption"
                    weight={isSelected ? 'bold' : 'normal'}
                    style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary, textAlign: 'center' }}
                    numberOfLines={2}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* ── Basic Info ───────────────────────────────────────── */}
        <Card variant="elevated" style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <Text variant="subtitle" weight="bold" colorVariant="primary" style={{ marginBottom: 10 }}>
            Service Details
          </Text>

          <Input
            label="Service Name *"
            placeholder={`e.g. ${catConfig.label} – Cotton Shirt`}
            value={name}
            onChangeText={(text) => { setName(text); if (errors.name) setErrors((p) => ({ ...p, name: null })); }}
            error={errors.name}
            containerStyle={{ marginBottom: spacing.md }}
          />

          {catConfig.hasClothingType && (
            <Input
              label="General Clothing Type (Optional)"
              placeholder="e.g. Formal, Casual, Traditional"
              value={clothingType}
              onChangeText={setClothingType}
              containerStyle={{ marginBottom: spacing.md }}
            />
          )}

          <Input
            label="Service Description (Optional)"
            placeholder="e.g. Chemical dry clean with delicate fabric protection"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Input
            label="Estimated Turnaround (Hours) *"
            placeholder="e.g. 24 (1 day) or 48 (2 days)"
            keyboardType="numeric"
            value={estimatedHours}
            onChangeText={(text) => { setEstimatedHours(text); if (errors.estimatedHours) setErrors((p) => ({ ...p, estimatedHours: null })); }}
            error={errors.estimatedHours}
          />
        </Card>

        {/* ── Pricing & Unit ────────────────────────────────────── */}
        <Card variant="elevated" style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <Text variant="subtitle" weight="bold" colorVariant="primary" style={{ marginBottom: 4 }}>
            {catConfig.hasItems ? 'Base Price (Optional — use items below for per-item pricing)' : 'Pricing & Unit *'}
          </Text>
          {catConfig.hasItems && (
            <Text variant="caption" colorVariant="muted" style={{ marginBottom: 12 }}>
              Set 0 if all prices are defined per clothing item below.
            </Text>
          )}

          <Input
            label={catConfig.hasItems ? 'Base Price (₹)' : 'Price (₹) *'}
            placeholder="e.g. 80"
            keyboardType="numeric"
            value={price}
            onChangeText={(text) => { setPrice(text); if (errors.price) setErrors((p) => ({ ...p, price: null })); }}
            error={errors.price}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <View style={{ marginTop: 2 }}>
            <Text variant="caption" weight="bold" colorVariant="secondary" style={{ marginBottom: 8 }}>
              Billing Unit *
            </Text>
            <View style={styles.unitSelectorContainer}>
              {catConfig.units.map((u) => {
                const isSelected = unit === u;
                return (
                  <TouchableOpacity
                    key={u}
                    onPress={() => setUnit(u)}
                    style={[
                      styles.unitOptionChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.borderLight,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      variant="body"
                      weight={isSelected ? 'bold' : 'medium'}
                      style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary }}
                    >
                      {UNIT_LABELS[u] || (u === 'per_kg' ? 'Per KG' : 'Per Item')}
                    </Text>
                    {isSelected && (
                      <Text style={{ color: '#FFFFFF', marginLeft: 6, fontSize: 13, fontWeight: 'bold' }}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>

        {/* ── Sub-Items (Dry Cleaning / Premium) ───────────────── */}
        {catConfig.hasItems && (
          <Card variant="elevated" style={[styles.formCard, { backgroundColor: colors.surface }]}>
            <View style={styles.itemsHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text variant="subtitle" weight="bold" colorVariant="primary">
                  Garment Items & Pricing
                </Text>
                <Text variant="caption" colorVariant="muted" style={{ marginTop: 2 }}>
                  Add individual garment types (Shirt, Trouser, Suit…) with per-item pricing.
                </Text>
              </View>
              <Button title="+ Add Item" variant="primary" size="sm" onPress={openAddItem} />
            </View>

            {items.length === 0 ? (
              <View style={[styles.emptyItems, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
                <Text style={{ fontSize: 28 }}>👔</Text>
                <Text variant="caption" colorVariant="muted" style={{ textAlign: 'center', marginTop: 8 }}>
                  No garment items added yet. Tap "+ Add Item" to add individual clothing types with pricing.
                </Text>
              </View>
            ) : (
              items.map((item, index) => (
                <View key={item._tempId ?? index} style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Text variant="body" weight="bold" colorVariant="primary">
                        {item.name || 'Unnamed Item'}
                      </Text>
                      {item.clothingType ? (
                        <Badge label={item.clothingType} variant="neutral" size="sm" style={{ marginLeft: 6 }} />
                      ) : null}
                    </View>
                    <Text variant="caption" colorVariant="secondary" style={{ marginTop: 2 }}>
                      ₹{item.price} per piece • Est: {item.estimatedHours || 24}h
                    </Text>
                    {item.description ? (
                      <Text variant="caption" colorVariant="muted" numberOfLines={1} style={{ marginTop: 2 }}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      onPress={() => openEditItem(index)}
                      style={[styles.itemActionBtn, { borderColor: colors.primary }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={{ fontSize: 14 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(index)}
                      style={[styles.itemActionBtn, { borderColor: colors.status?.error || '#EF4444', marginTop: 6 }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={{ fontSize: 14 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </Card>
        )}

        {/* ── Submit ────────────────────────────────────────────── */}
        <Button
          title={isEditing ? 'Update Service' : 'Save & Publish Service'}
          variant="primary"
          size="lg"
          isLoading={saveMutation.isPending}
          disabled={saveMutation.isPending}
          onPress={handleSave}
          style={{ marginBottom: 8 }}
        />
      </ScrollView>

      {/* ── Add/Edit Item Modal ───────────────────────────────────── */}
      <Modal
        visible={itemModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setItemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text variant="h3" weight="bold" colorVariant="primary">
              {editingItemIndex !== null ? 'Edit Garment Item' : 'Add Garment Item'}
            </Text>
            <Text variant="caption" colorVariant="muted" style={{ marginBottom: spacing.sm }}>
              {catConfig.icon} {catConfig.label} — individual pricing
            </Text>
            <Divider style={{ marginBottom: spacing.sm }} />

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Item Name *"
                placeholder="e.g. Shirt, Trouser, Suit, Saree, Kurta"
                value={itemForm.name}
                onChangeText={(t) => { setItemForm((p) => ({ ...p, name: t })); if (itemErrors.name) setItemErrors((p) => ({ ...p, name: null })); }}
                error={itemErrors.name}
                containerStyle={{ marginBottom: spacing.sm }}
              />

              <Input
                label="Clothing/Fabric Type (Optional)"
                placeholder="e.g. Cotton, Silk, Formal, Casual"
                value={itemForm.clothingType}
                onChangeText={(t) => setItemForm((p) => ({ ...p, clothingType: t }))}
                containerStyle={{ marginBottom: spacing.sm }}
              />

              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Input
                    label="Price (₹) *"
                    placeholder="e.g. 150"
                    keyboardType="numeric"
                    value={itemForm.price}
                    onChangeText={(t) => { setItemForm((p) => ({ ...p, price: t })); if (itemErrors.price) setItemErrors((p) => ({ ...p, price: null })); }}
                    error={itemErrors.price}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Est. Hours"
                    placeholder="24"
                    keyboardType="numeric"
                    value={itemForm.estimatedHours}
                    onChangeText={(t) => setItemForm((p) => ({ ...p, estimatedHours: t }))}
                  />
                </View>
              </View>

              <Input
                label="Description (Optional)"
                placeholder="e.g. Full dry clean with stain removal"
                multiline
                numberOfLines={2}
                value={itemForm.description}
                onChangeText={(t) => setItemForm((p) => ({ ...p, description: t }))}
                containerStyle={{ marginTop: spacing.sm, marginBottom: spacing.md }}
              />
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setItemModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title={editingItemIndex !== null ? 'Update Item' : 'Add Item'} variant="primary" size="md" onPress={handleSaveItem} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 6 },
  body: { padding: 16, gap: 12 },
  formCard: { padding: 16, borderRadius: 12 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryCard: {
    flexBasis: '31%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    minHeight: 76,
    justifyContent: 'center',
  },
  categoryIcon: { fontSize: 24, marginBottom: 4 },
  unitSelectorContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  unitOptionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    minHeight: 46,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emptyItems: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  itemActions: { alignItems: 'center', marginLeft: 8 },
  itemActionBtn: { borderWidth: 1, borderRadius: 6, padding: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '92%' },
  modalBtnRow: { flexDirection: 'row', marginTop: 8 },
});

export default AdminAddEditServiceScreen;
