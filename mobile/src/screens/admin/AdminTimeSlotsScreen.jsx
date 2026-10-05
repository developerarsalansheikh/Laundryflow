import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const AdminTimeSlotsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [selectedDay, setSelectedDay] = useState('Monday');
  const [addSlotModalVisible, setAddSlotModalVisible] = useState(false);

  // New Slot Form State
  const [slotStartTime, setSlotStartTime] = useState('');
  const [slotEndTime, setSlotEndTime] = useState('');
  const [slotLabel, setSlotLabel] = useState('');
  const [maxOrders, setMaxOrders] = useState('10');
  const [slotErrors, setSlotErrors] = useState({});

  // Fetch Time Slots Query
  const {
    data: allTimeSlots = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-time-slots'],
    queryFn: adminService.getTimeSlots,
    staleTime: 1000 * 30,
  });

  // Current day's document
  const currentDayDoc = allTimeSlots.find((doc) => doc.day === selectedDay);
  const currentSlots = currentDayDoc?.slots || [];

  // Save Day Slots Mutation
  const saveSlotsMutation = useMutation({
    mutationFn: ({ slots, isToggle }) =>
      adminService.saveTimeSlots({ day: selectedDay, slots }),
    onMutate: async ({ slots }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-time-slots'] });
      const previousSlots = queryClient.getQueryData(['admin-time-slots']);
      queryClient.setQueryData(['admin-time-slots'], (old = []) => {
        const found = old.find((doc) => doc.day === selectedDay);
        if (found) {
          return old.map((doc) =>
            doc.day === selectedDay ? { ...doc, slots } : doc
          );
        }
        return [...old, { day: selectedDay, slots }];
      });
      return { previousSlots };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-time-slots'] });
      if (!variables.isToggle) {
        Alert.alert('Saved', `Time slots for ${selectedDay} have been updated.`);
      }
    },
    onError: (err, _vars, context) => {
      if (context?.previousSlots) {
        queryClient.setQueryData(['admin-time-slots'], context.previousSlots);
      }
      Alert.alert('Save Failed', err.response?.data?.message || err.message);
    },
  });

  const handleToggleSlot = (index) => {
    const updated = currentSlots.map((s, i) =>
      i === index ? { ...s, isActive: !s.isActive } : s
    );
    saveSlotsMutation.mutate({ slots: updated, isToggle: true });
  };

  const handleDeleteSlot = (index) => {
    Alert.alert('Delete Slot', 'Remove this time slot from schedule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = currentSlots.filter((_, i) => i !== index);
          saveSlotsMutation.mutate({ slots: updated, isToggle: false });
        },
      },
    ]);
  };

  const handleAddSlotSubmit = () => {
    const errs = {};
    if (!slotStartTime.trim()) errs.startTime = 'Start time required (e.g. 09:00 AM)';
    if (!slotEndTime.trim()) errs.endTime = 'End time required (e.g. 12:00 PM)';
    if (!slotLabel.trim()) errs.label = 'Label required (e.g. Morning)';
    if (isNaN(Number(maxOrders)) || Number(maxOrders) <= 0) {
      errs.maxOrders = 'Enter valid order limit';
    }

    if (Object.keys(errs).length > 0) {
      setSlotErrors(errs);
      return;
    }

    const newSlot = {
      startTime: slotStartTime.trim(),
      endTime: slotEndTime.trim(),
      label: slotLabel.trim(),
      maxOrders: Number(maxOrders),
      isActive: true,
    };

    const updated = [...currentSlots, newSlot];
    saveSlotsMutation.mutate({ slots: updated, isToggle: false }, {
      onSuccess: () => {
        setAddSlotModalVisible(false);
        setSlotStartTime('');
        setSlotEndTime('');
        setSlotLabel('');
        setMaxOrders('10');
        setSlotErrors({});
      },
    });
  };

  return (
    <ScreenContainer scrollable={false} padding="none" style={styles.container}>
      {/* Top Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={{ fontSize: 18, color: colors.primary }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text variant="h2" weight="bold" colorVariant="primary">
            Store Time Slots
          </Text>
          <Text variant="caption" colorVariant="secondary">
            Configure customer pickup windows for each day
          </Text>
        </View>

        <Button
          title="+ Add Slot"
          variant="primary"
          size="sm"
          onPress={() => setAddSlotModalVisible(true)}
        />
      </View>

      {/* Day Selector Chips */}
      <View style={[styles.daySelectorBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
          {DAYS.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[
                  styles.dayBtn,
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
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text variant="title" weight="bold" colorVariant="primary">
            {selectedDay} Slots ({currentSlots.length})
          </Text>
          <Text variant="caption" colorVariant="muted">
            Customer can select active slots at checkout
          </Text>
        </View>

        {isLoading && !isRefetching ? (
          <View style={styles.centerContainer}>
            <Loader size="large" />
            <Text variant="body" colorVariant="secondary" style={{ marginTop: spacing.md }}>
              Loading time slots...
            </Text>
          </View>
        ) : currentSlots.length === 0 ? (
          <Card variant="flat" style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <EmptyState
              title={`No slots set for ${selectedDay}`}
              description="Tap '+ Add Slot' to configure pickup windows for this day."
              actionLabel="+ Add First Slot"
              onAction={() => setAddSlotModalVisible(true)}
            />
          </Card>
        ) : (
          currentSlots.map((slot, idx) => (
            <Card
              key={idx}
              variant="elevated"
              style={[
                styles.slotCard,
                { backgroundColor: colors.surface, opacity: slot.isActive ? 1 : 0.75 },
              ]}
            >
              <View style={styles.slotRow}>
                {/* Left: Slot Information */}
                <View style={styles.slotInfoCol}>
                  <Text variant="subtitle" weight="bold" colorVariant="primary">
                    {slot.label}
                  </Text>
                  <Text variant="body" weight="medium" style={{ color: colors.primary, marginTop: 4 }}>
                    🕒 {slot.startTime} – {slot.endTime}
                  </Text>
                  <Text variant="caption" colorVariant="muted" style={{ marginTop: 2 }}>
                    Max orders allowed: {slot.maxOrders || 10}
                  </Text>
                </View>

                {/* Right: Badge, Toggle, Delete */}
                <View style={styles.slotControlsCol}>
                  <Badge
                    label={slot.isActive ? 'ACTIVE' : 'INACTIVE'}
                    variant={slot.isActive ? 'success' : 'neutral'}
                    size="sm"
                    style={{ marginBottom: 6 }}
                  />

                  <View style={styles.toggleWrapper}>
                    <Switch
                      value={Boolean(slot.isActive)}
                      onValueChange={() => handleToggleSlot(idx)}
                      trackColor={{ false: colors.borderLight, true: colors.primary }}
                      thumbColor="#FFFFFF"
                      style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteSlot(idx)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={[styles.deleteBtnText, { color: colors.status?.error || '#EF4444' }]}>
                      🗑️ Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Modal: Add Slot */}
      <Modal
        visible={addSlotModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddSlotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text variant="h3" weight="bold" colorVariant="primary">
              Add Slot for {selectedDay}
            </Text>
            <Divider style={{ marginVertical: spacing.xs }} />

            <Input
              label="Slot Label *"
              placeholder="e.g. Morning (9AM - 12PM)"
              value={slotLabel}
              onChangeText={(t) => {
                setSlotLabel(t);
                if (slotErrors.label) setSlotErrors((p) => ({ ...p, label: null }));
              }}
              error={slotErrors.label}
              containerStyle={{ marginBottom: spacing.xs }}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="Start Time *"
                  placeholder="09:00 AM"
                  value={slotStartTime}
                  onChangeText={(t) => {
                    setSlotStartTime(t);
                    if (slotErrors.startTime) setSlotErrors((p) => ({ ...p, startTime: null }));
                  }}
                  error={slotErrors.startTime}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="End Time *"
                  placeholder="12:00 PM"
                  value={slotEndTime}
                  onChangeText={(t) => {
                    setSlotEndTime(t);
                    if (slotErrors.endTime) setSlotErrors((p) => ({ ...p, endTime: null }));
                  }}
                  error={slotErrors.endTime}
                />
              </View>
            </View>

            <Input
              label="Max Orders Limit *"
              keyboardType="numeric"
              value={maxOrders}
              onChangeText={setMaxOrders}
              error={slotErrors.maxOrders}
              containerStyle={{ marginTop: spacing.xs, marginBottom: spacing.sm }}
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setAddSlotModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Save Slot"
                variant="primary"
                size="md"
                isLoading={saveSlotsMutation.isPending}
                disabled={saveSlotsMutation.isPending}
                onPress={handleAddSlotSubmit}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 6,
  },
  daySelectorBar: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  daysScroll: {
    paddingHorizontal: 16,
  },
  dayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  body: {
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  emptyCard: {
    padding: 20,
    borderRadius: 10,
  },
  slotCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotInfoCol: {
    flex: 1,
    paddingRight: 12,
  },
  slotControlsCol: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 76,
  },
  toggleWrapper: {
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
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
  },
  row: {
    flexDirection: 'row',
  },
  modalBtnRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
});

export default AdminTimeSlotsScreen;
