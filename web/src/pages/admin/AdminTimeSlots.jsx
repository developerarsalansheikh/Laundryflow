import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DEFAULT_SLOTS = [
  { startTime: '09:00 AM', endTime: '11:00 AM', maxCapacity: 5, isActive: true },
  { startTime: '11:00 AM', endTime: '01:00 PM', maxCapacity: 5, isActive: true },
  { startTime: '02:00 PM', endTime: '04:00 PM', maxCapacity: 5, isActive: true },
  { startTime: '04:00 PM', endTime: '06:00 PM', maxCapacity: 5, isActive: true },
  { startTime: '06:00 PM', endTime: '08:00 PM', maxCapacity: 5, isActive: true },
];

export const AdminTimeSlots = () => {
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [schedule, setSchedule] = useState({});
  const [addSlotModal, setAddSlotModal] = useState(false);

  const [newSlot, setNewSlot] = useState({
    startTime: '08:00 AM',
    endTime: '10:00 AM',
    maxCapacity: 5,
    isActive: true,
  });

  // 1. Fetch Weekly Schedule
  const { data: remoteSlots = [], isLoading } = useQuery({
    queryKey: ['admin-time-slots'],
    queryFn: adminApi.getTimeSlots,
  });

  useEffect(() => {
    if (remoteSlots && remoteSlots.length > 0) {
      const map = {};
      DAYS.forEach((d) => {
        const found = remoteSlots.find((item) => item.day?.toLowerCase() === d.toLowerCase());
        map[d] = found?.slots || DEFAULT_SLOTS;
      });
      setSchedule(map);
    } else {
      const initial = {};
      DAYS.forEach((d) => {
        initial[d] = [...DEFAULT_SLOTS];
      });
      setSchedule(initial);
    }
  }, [remoteSlots]);

  // Mutation: Save schedule
  const saveMutation = useMutation({
    mutationFn: ({ day, slots }) => adminApi.saveTimeSlots({ day, slots }),
    onSuccess: () => {
      toast.success(`Schedule for ${selectedDay} saved successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-time-slots'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update time slots');
    },
  });

  const currentSlots = schedule[selectedDay] || [];

  const handleToggleSlot = (idx) => {
    const updated = [...currentSlots];
    updated[idx] = { ...updated[idx], isActive: !updated[idx].isActive };
    setSchedule({ ...schedule, [selectedDay]: updated });
  };

  const handleDeleteSlot = (idx) => {
    const updated = currentSlots.filter((_, i) => i !== idx);
    setSchedule({ ...schedule, [selectedDay]: updated });
  };

  const handleCapacityChange = (idx, val) => {
    const updated = [...currentSlots];
    updated[idx] = { ...updated[idx], maxCapacity: Math.max(1, Number(val) || 1) };
    setSchedule({ ...schedule, [selectedDay]: updated });
  };

  const handleAddSlot = (e) => {
    e.preventDefault();
    const updated = [...currentSlots, { ...newSlot }];
    setSchedule({ ...schedule, [selectedDay]: updated });
    setAddSlotModal(false);
    toast.success('Time slot added. Click "Save Schedule" to commit changes.');
  };

  const handleSaveDaySchedule = () => {
    saveMutation.mutate({
      day: selectedDay,
      slots: currentSlots,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary">
            Operating Time Slots
          </h1>
          <p className="text-xs text-textMuted mt-1">
            Configure hourly capacity limits, booking windows, and weekly operating schedules
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAddSlotModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-textSecondary hover:text-textPrimary hover:bg-white/[0.08] border border-white/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slot</span>
          </button>

          <button
            onClick={handleSaveDaySchedule}
            disabled={saveMutation.isPending}
            className="btn-primary px-4 py-2 text-xs font-semibold gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveMutation.isPending ? 'Saving...' : `Save ${selectedDay}`}</span>
          </button>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DAYS.map((day) => {
          const isActive = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-primaryPurple to-brandIndigo text-white shadow-glowPurple'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] text-textSecondary hover:text-textPrimary border border-white/[0.07]'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Slots Table Card */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purpleLight" />
            <h2 className="text-sm font-bold text-textPrimary">
              {selectedDay} Operational Windows ({currentSlots.length})
            </h2>
          </div>
          <span className="text-xs text-textMuted">
            Customers choose active slots during checkout
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-textMuted">Loading schedule...</div>
        ) : currentSlots.length === 0 ? (
          <div className="py-12 text-center text-xs text-textMuted">
            No slots defined for {selectedDay}. Click &quot;Add Slot&quot; above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.07] text-[11px] font-semibold text-textMuted uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Time Interval</th>
                  <th className="py-3 px-3">Order Capacity Limit</th>
                  <th className="py-3 px-3">Availability</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {currentSlots.map((slot, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-textPrimary flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-textMuted" />
                      <span>
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={slot.maxCapacity || 5}
                          onChange={(e) => handleCapacityChange(idx, e.target.value)}
                          className="w-16 p-1.5 text-xs text-center rounded-lg bg-white/[0.04] border border-white/10 text-textPrimary focus:border-primaryPurple focus:outline-none"
                        />
                        <span className="text-textMuted text-[11px]">orders max / window</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => handleToggleSlot(idx)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          slot.isActive !== false
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-white/[0.04] text-textMuted border-white/[0.08]'
                        }`}
                      >
                        {slot.isActive !== false ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-textMuted" />
                            <span>Disabled</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteSlot(idx)}
                        className="p-1.5 text-textMuted hover:text-statusDanger hover:bg-statusDanger/10 rounded-lg transition-colors"
                        title="Delete Slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Slot Modal */}
      {addSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm p-6 rounded-2xl glass-card space-y-4 border border-white/10 shadow-2xl">
            <h3 className="text-base font-bold text-textPrimary">
              Add Time Slot for {selectedDay}
            </h3>

            <form onSubmit={handleAddSlot} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                  Start Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 08:00 AM"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary placeholder-textMuted focus:outline-none focus:border-primaryPurple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                  End Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10:00 AM"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary placeholder-textMuted focus:outline-none focus:border-primaryPurple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                  Max Orders Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newSlot.maxCapacity}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, maxCapacity: Number(e.target.value) || 5 })
                  }
                  className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary placeholder-textMuted focus:outline-none focus:border-primaryPurple"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAddSlotModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-textSecondary hover:text-textPrimary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-semibold"
                >
                  Add Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTimeSlots;
