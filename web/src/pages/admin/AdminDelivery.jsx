import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Plus,
  Phone,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import { ROUTES } from '../../routes/routeConstants';

export const AdminDelivery = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'dispatch' | 'zones'
  const [assignOrder, setAssignOrder] = useState(null);
  const [driverToAssign, setDriverToAssign] = useState(null);

  // Zone State
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneForm, setZoneForm] = useState({
    name: '',
    deliveryFee: 0,
    minOrderAmount: 0,
    estimatedDeliveryHours: 24,
    pincodes: '',
    radiusKm: 10,
  });

  // 1. Fetch Drivers Roster
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['admin-delivery-partners'],
    queryFn: adminApi.getDeliveryPartners,
  });

  const onlineDriversCount = drivers.filter(
    (d) => d.availabilityStatus === 'available' || (d.isActive !== false && d.availabilityStatus !== 'offline')
  ).length;

  // 2. Fetch Dispatch Orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-dispatch-orders'],
    queryFn: () => adminApi.getOrders({ limit: 50 }),
  });

  // 3. Fetch Nearby Drivers for selected dispatch order
  const {
    data: nearbyDrivers = [],
    isLoading: nearbyDriversLoading,
    isError: nearbyDriversError,
    error: nearbyDriversErr,
    refetch: refetchNearbyDrivers,
  } = useQuery({
    queryKey: ['admin-nearby-drivers', assignOrder?._id],
    queryFn: () => adminApi.getNearbyDrivers(assignOrder?._id),
    enabled: Boolean(assignOrder?._id),
  });

  // 4. Fetch Delivery Zones
  const {
    data: deliveryZones = [],
    isLoading: zonesLoading,
  } = useQuery({
    queryKey: ['admin-delivery-zones'],
    queryFn: adminApi.getDeliveryZones,
  });

  // 5. Fetch Laundry Profile (for assignment mode)
  const {
    data: laundryProfile,
  } = useQuery({
    queryKey: ['admin-my-laundry'],
    queryFn: adminApi.getMyLaundry,
  });

  const allOrders = ordersData?.orders || ordersData?.data || [];
  const dispatchQueue = allOrders.filter((o) =>
    ['pending', 'picked_up', 'ready', 'out_for_delivery'].includes(o.status)
  );

  // Mutation: Toggle Driver Active
  const toggleDriverMutation = useMutation({
    mutationFn: (id) => adminApi.toggleDeliveryPartner(id),
    onSuccess: (updated) => {
      toast.success(
        `Driver ${updated.name} is now ${updated.isActive ? 'Available' : 'Off-duty'}`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-partners'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update driver status');
    },
  });



  // Mutation: Assign Driver to Order
  const assignDriverMutation = useMutation({
    mutationFn: ({ orderId, driverId }) =>
      adminApi.assignDeliveryPartner(orderId, driverId),
    onSuccess: () => {
      toast.success('Order reassigned to driver');
      queryClient.invalidateQueries({ queryKey: ['admin-dispatch-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-nearby-drivers'] });
      setAssignOrder(null);
      setDriverToAssign(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to assign driver');
    },
  });

  // Mutation: Update Assignment Mode
  const updateAssignmentModeMutation = useMutation({
    mutationFn: ({ mode, autoAssignRadiusKm }) =>
      adminApi.updateAssignmentMode({ mode, autoAssignRadiusKm }),
    onSuccess: (res) => {
      toast.success(`Driver assignment set to ${res.driverAssignmentMode?.toUpperCase() || 'AUTOMATIC'}`);
      queryClient.invalidateQueries({ queryKey: ['admin-my-laundry'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update assignment mode');
    },
  });

  // Mutation: Auto-Assign Single Order
  const autoAssignOrderMutation = useMutation({
    mutationFn: (orderId) => adminApi.autoAssignOrder(orderId),
    onSuccess: (res) => {
      const driverName = res.data?.deliveryPartner?.name || 'Driver';
      toast.success(`Order assigned to ${driverName}!`);
      queryClient.invalidateQueries({ queryKey: ['admin-dispatch-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not auto-assign driver');
      queryClient.invalidateQueries({ queryKey: ['admin-dispatch-orders'] });
    },
  });

  // Mutation: Save Zone (Create / Update)
  const saveZoneMutation = useMutation({
    mutationFn: (data) => {
      if (editingZone) {
        return adminApi.updateDeliveryZone(editingZone._id, data);
      }
      return adminApi.createDeliveryZone(data);
    },
    onSuccess: () => {
      toast.success(`Delivery zone ${editingZone ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] });
      setZoneModalOpen(false);
      setEditingZone(null);
      setZoneForm({
        name: '',
        deliveryFee: 0,
        minOrderAmount: 0,
        estimatedDeliveryHours: 24,
        pincodes: '',
        radiusKm: 10,
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save delivery zone');
    },
  });

  // Mutation: Toggle Zone
  const toggleZoneMutation = useMutation({
    mutationFn: (id) => adminApi.toggleDeliveryZone(id),
    onSuccess: () => {
      toast.success('Zone status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to toggle zone');
    },
  });

  // Mutation: Delete Zone
  const deleteZoneMutation = useMutation({
    mutationFn: (id) => adminApi.deleteDeliveryZone(id),
    onSuccess: () => {
      toast.success('Zone deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete zone');
    },
  });


  const handleOpenCreateZone = () => {
    setEditingZone(null);
    setZoneForm({
      name: '',
      deliveryFee: 0,
      minOrderAmount: 0,
      estimatedDeliveryHours: 24,
      pincodes: '',
      radiusKm: 10,
    });
    setZoneModalOpen(true);
  };

  const handleOpenEditZone = (zone) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name || '',
      deliveryFee: zone.deliveryFee ?? 0,
      minOrderAmount: zone.minOrderAmount ?? 0,
      estimatedDeliveryHours: zone.estimatedDeliveryHours ?? 24,
      pincodes: Array.isArray(zone.pincodes) ? zone.pincodes.join(', ') : '',
      radiusKm: zone.radiusKm ?? 10,
    });
    setZoneModalOpen(true);
  };

  const handleSaveZoneSubmit = (e) => {
    e.preventDefault();
    if (!zoneForm.name.trim()) {
      toast.error('Zone name is required');
      return;
    }
    const pincodesArr = zoneForm.pincodes
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    saveZoneMutation.mutate({
      name: zoneForm.name.trim(),
      deliveryFee: Number(zoneForm.deliveryFee),
      minOrderAmount: Number(zoneForm.minOrderAmount),
      estimatedDeliveryHours: Number(zoneForm.estimatedDeliveryHours),
      pincodes: pincodesArr,
      radiusKm: Number(zoneForm.radiusKm) || 10,
    });
  };

  const isAutoAssignmentEnabled = laundryProfile?.driverAssignmentMode === 'automatic';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary">
            Delivery & Fleet Operations
          </h1>
          <p className="text-xs text-textMuted mt-1">
            Manage your courier roster, delivery zones, and automated dispatch in real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'roster' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{onlineDriversCount} Drivers Online</span>
            </div>
          )}

          {activeTab === 'zones' && (
            <button
              onClick={handleOpenCreateZone}
              className="btn-primary px-4 py-2 text-xs font-semibold gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Delivery Zone</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.07]">
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'roster'
              ? 'border-primaryPurple text-purpleLight shadow-[0_2px_0_0_#7C3AED]'
              : 'border-transparent text-textMuted hover:text-textPrimary'
          }`}
        >
          Fleet Status ({onlineDriversCount}/{drivers.length} Online)
        </button>
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'dispatch'
              ? 'border-primaryPurple text-purpleLight shadow-[0_2px_0_0_#7C3AED]'
              : 'border-transparent text-textMuted hover:text-textPrimary'
          }`}
        >
          Active Dispatch Queue ({dispatchQueue.length})
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'zones'
              ? 'border-primaryPurple text-purpleLight shadow-[0_2px_0_0_#7C3AED]'
              : 'border-transparent text-textMuted hover:text-textPrimary'
          }`}
        >
          Delivery Zones ({deliveryZones.length})
        </button>
      </div>

      {/* View 1: Drivers Roster */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {driversLoading ? (
            <div className="py-20 text-center text-xs text-textMuted">Loading drivers roster...</div>
          ) : drivers.length === 0 ? (
            <div className="glass-card p-12 text-center space-y-3">
              <Truck className="w-10 h-10 text-textMuted/40 mx-auto" />
              <h3 className="text-sm font-bold text-textPrimary">No Delivery Drivers Online</h3>
              <p className="text-xs text-textMuted max-w-sm mx-auto">
                Delivery partners are onboarded and managed centrally by Super Admin. Active partners in your area will appear here automatically for order dispatch.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drivers.map((driver) => {
                const isActive = driver.isActive !== false;
                const statusVariant =
                  driver.availabilityStatus === 'available'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : driver.availabilityStatus === 'busy'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-white/[0.04] text-textMuted border-white/[0.08]';

                return (
                  <div
                    key={driver._id}
                    className="glass-card p-6 flex flex-col justify-between group hover:border-primaryPurple/40 transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-textMuted">
                          <Truck className="w-3.5 h-3.5 text-purpleLight" />
                          <span>{driver.vehicleNumber || 'Standard Delivery'}</span>
                        </span>

                        <button
                          onClick={() => toggleDriverMutation.mutate(driver._id)}
                          disabled={toggleDriverMutation.isPending}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-white/[0.04] text-textMuted border-white/[0.08]'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>On Duty</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-textMuted" />
                              <span>Off Duty</span>
                            </>
                          )}
                        </button>
                      </div>

                      <h3 className="text-base font-bold text-textPrimary group-hover:text-purpleLight transition-colors">
                        {driver.name}
                      </h3>
                      <p className="text-xs text-textSecondary flex items-center gap-1.5 mt-1">
                        <Phone className="w-3 h-3 text-textMuted" />
                        <span>{driver.phone}</span>
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/[0.07] flex items-center justify-between text-[11px] text-textMuted">
                      <span className="flex items-center gap-1.5">
                        Status:
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${statusVariant}`}>
                          {(driver.availabilityStatus || (isActive ? 'available' : 'offline')).toUpperCase()}
                        </span>
                      </span>
                      <span className="font-medium text-textSecondary">
                        {driver.currentLocation?.lat ? '📍 GPS Active' : '📍 No GPS'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View 2: Active Dispatch Queue */}
      {activeTab === 'dispatch' && (
        <div className="space-y-4">
          {/* Automatic Assignment Control Banner */}
          <div className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-primaryPurple/30 bg-primaryPurple/[0.03]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-textPrimary">Automatic Driver Assignment</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isAutoAssignmentEnabled
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-white/[0.06] text-textMuted border-white/[0.1]'
                  }`}
                >
                  {isAutoAssignmentEnabled ? 'ENABLED' : 'MANUAL DISPATCH'}
                </span>
              </div>
              <p className="text-[11px] text-textMuted mt-0.5">
                Automatically finds and assigns the nearest active driver within {laundryProfile?.autoAssignRadiusKm || 10} km when customer places an order.
              </p>
            </div>

            <button
              onClick={() =>
                updateAssignmentModeMutation.mutate({
                  mode: isAutoAssignmentEnabled ? 'manual' : 'automatic',
                  autoAssignRadiusKm: laundryProfile?.autoAssignRadiusKm || 10,
                })
              }
              disabled={updateAssignmentModeMutation.isPending}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                isAutoAssignmentEnabled
                  ? 'bg-purple-600/20 text-purpleLight border-purple-500/40 hover:bg-purple-600/30'
                  : 'btn-primary'
              }`}
            >
              {isAutoAssignmentEnabled ? 'Switch to Manual' : 'Enable Automatic Assignment'}
            </button>
          </div>

          <div className="glass-card p-6">
            {ordersLoading ? (
              <div className="py-16 text-center text-xs text-textMuted">Loading dispatch queue...</div>
            ) : dispatchQueue.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-textPrimary">
                  Dispatch Queue is Clear
                </p>
                <p className="text-xs text-textMuted mt-1">
                  No orders are currently waiting in &apos;Ready&apos; or &apos;Out for Delivery&apos; status.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/[0.07] text-[11px] font-semibold text-textMuted uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3">Order</th>
                      <th className="py-3 px-3">Customer & Address</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Assigned Driver</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {dispatchQueue.map((ord) => {
                      const idShort = `#${ord._id?.slice(-6).toUpperCase()}`;
                      const customer = ord.user || ord.customerId || {};
                      const addr = ord.pickupAddress || ord.pickupAddressSnapshot || ord.address || {};
                      const isAutoAssigned = ord.assignmentInfo?.mode === 'automatic';
                      const hasDriver = Boolean(ord.deliveryPartner || ord.deliveryPartnerId);

                      return (
                        <tr key={ord._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="font-mono font-bold text-textPrimary flex items-center gap-1.5">
                              <span>{idShort}</span>
                              {isAutoAssigned && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purpleLight border border-purple-500/30">
                                  AUTO
                                </span>
                              )}
                            </div>
                            {ord.deliveryFee > 0 && (
                              <div className="text-[10px] text-textMuted">Fee: ₹{ord.deliveryFee}</div>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-textPrimary">
                              {customer.name || 'Valued Customer'}
                            </div>
                            <div className="text-[11px] text-textMuted truncate max-w-xs">
                              {addr.street || addr.fullAddress || addr.addressLine1 || 'Customer Address'}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primaryPurple/15 text-purpleLight border border-primaryPurple/30">
                              {ord.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2">
                              <div>
                                {ord.deliveryPartner ? (
                                  <div className="font-semibold text-textPrimary">
                                    {ord.deliveryPartner.name || 'Assigned Driver'}
                                  </div>
                                ) : ord.deliveryPartnerId ? (
                                  <div className="font-semibold text-textPrimary">
                                    {drivers.find((d) => d._id === ord.deliveryPartnerId)?.name || 'Assigned Driver'}
                                  </div>
                                ) : (
                                  <div>
                                    <span className="text-textMuted italic text-[11px]">Unassigned</span>
                                    {ord.assignmentInfo?.status === 'failed' && (
                                      <div className="text-[10px] text-statusDanger truncate max-w-[150px]">
                                        {ord.assignmentInfo.failureReason || 'Failed'}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {!hasDriver && (
                                <button
                                  onClick={() => autoAssignOrderMutation.mutate(ord._id)}
                                  disabled={autoAssignOrderMutation.isPending}
                                  className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                                >
                                  ⚡ Auto
                                </button>
                              )}

                              <button
                                onClick={() => setAssignOrder(ord)}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-primaryPurple/15 text-purpleLight border border-primaryPurple/30 hover:bg-primaryPurple/25 transition-colors"
                              >
                                {hasDriver ? 'Reassign' : 'Manual'}
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => navigate(`${ROUTES.ADMIN.ORDERS}/${ord._id}`)}
                              className="px-3 py-1 text-xs font-semibold text-purpleLight hover:underline"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View 3: Delivery Zones */}
      {activeTab === 'zones' && (
        <div className="space-y-4">
          {zonesLoading ? (
            <div className="py-20 text-center text-xs text-textMuted">Loading delivery zones...</div>
          ) : deliveryZones.length === 0 ? (
            <div className="glass-card p-12 text-center space-y-3">
              <Truck className="w-10 h-10 text-textMuted/40 mx-auto" />
              <h3 className="text-sm font-bold text-textPrimary">No Delivery Zones Configured</h3>
              <p className="text-xs text-textMuted max-w-sm mx-auto">
                Set up delivery zones with customized delivery fees, minimum order amounts, and covered pincodes.
              </p>
              <button
                onClick={handleOpenCreateZone}
                className="btn-primary px-4 py-2 text-xs font-semibold mt-2"
              >
                Create Delivery Zone
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deliveryZones.map((zone) => {
                const isActive = zone.isActive !== false;

                return (
                  <div
                    key={zone._id}
                    className="glass-card p-6 flex flex-col justify-between group hover:border-primaryPurple/40 transition-all duration-300 space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-textPrimary truncate">{zone.name}</span>
                        <button
                          onClick={() => toggleZoneMutation.mutate(zone._id)}
                          disabled={toggleZoneMutation.isPending}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-white/[0.04] text-textMuted border-white/[0.08]'
                          }`}
                        >
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs text-textSecondary pt-2 border-t border-white/[0.06]">
                        <div className="flex justify-between">
                          <span className="text-textMuted">Delivery Fee:</span>
                          <span className="font-semibold text-textPrimary">
                            {zone.deliveryFee > 0 ? `₹${zone.deliveryFee}` : 'FREE'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-textMuted">Min Order:</span>
                          <span className="font-semibold text-textPrimary">₹{zone.minOrderAmount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-textMuted">Est. Delivery:</span>
                          <span className="font-semibold text-textPrimary">{zone.estimatedDeliveryHours || 24} hrs</span>
                        </div>
                        <div className="flex justify-between items-start gap-2 pt-1">
                          <span className="text-textMuted shrink-0">Coverage:</span>
                          <span className="text-[11px] text-right truncate text-textSecondary">
                            {zone.pincodes && zone.pincodes.length > 0
                              ? `Pincodes: ${zone.pincodes.join(', ')}`
                              : `Radius: ${zone.radiusKm || 10} km`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => handleOpenEditZone(zone)}
                        className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-textSecondary transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete delivery zone "${zone.name}"?`)) {
                            deleteZoneMutation.mutate(zone._id);
                          }
                        }}
                        className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create / Edit Delivery Zone */}
      {zoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl glass-card space-y-4 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-textPrimary">
                  {editingZone ? 'Edit Delivery Zone' : 'Create Delivery Zone'}
                </h3>
                <p className="text-xs text-textMuted mt-0.5">
                  Configure delivery pricing, minimum order, and covered pincodes
                </p>
              </div>
              <button
                onClick={() => setZoneModalOpen(false)}
                className="text-textMuted hover:text-textPrimary text-xs px-2 py-1 rounded-lg bg-white/[0.04]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveZoneSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-textMuted uppercase mb-1">
                  Zone Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Delhi / Central Region"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-textPrimary focus:border-primaryPurple outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-textMuted uppercase mb-1">
                    Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={zoneForm.deliveryFee}
                    onChange={(e) => setZoneForm({ ...zoneForm, deliveryFee: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-textPrimary focus:border-primaryPurple outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-textMuted uppercase mb-1">
                    Min Order (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={zoneForm.minOrderAmount}
                    onChange={(e) => setZoneForm({ ...zoneForm, minOrderAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-textPrimary focus:border-primaryPurple outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-textMuted uppercase mb-1">
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="24"
                    value={zoneForm.estimatedDeliveryHours}
                    onChange={(e) => setZoneForm({ ...zoneForm, estimatedDeliveryHours: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-textPrimary focus:border-primaryPurple outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-textMuted uppercase mb-1">
                    Radius (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={zoneForm.radiusKm}
                    onChange={(e) => setZoneForm({ ...zoneForm, radiusKm: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-textPrimary focus:border-primaryPurple outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-textMuted uppercase mb-1">
                  Covered Pincodes (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 110001, 110002, 110003"
                  value={zoneForm.pincodes}
                  onChange={(e) => setZoneForm({ ...zoneForm, pincodes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-textPrimary focus:border-primaryPurple outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setZoneModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-textMuted hover:text-textPrimary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveZoneMutation.isPending}
                  className="btn-primary px-4 py-2 text-xs font-semibold"
                >
                  {saveZoneMutation.isPending ? 'Saving...' : editingZone ? 'Update Zone' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nearby Shared Delivery Partner Dispatch Modal */}
      {assignOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-card space-y-4 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-textPrimary">
                  {assignOrder.deliveryPartner || assignOrder.deliveryPartnerId
                    ? 'Reassign Delivery Partner'
                    : 'Assign Nearby Delivery Partner'}
                </h3>
                <p className="text-xs text-textMuted mt-0.5">
                  Order #{assignOrder._id?.slice(-8).toUpperCase()} • Shared partners sorted by distance
                </p>
              </div>
              <button
                onClick={() => {
                  setAssignOrder(null);
                  setDriverToAssign(null);
                }}
                className="text-textMuted hover:text-textPrimary text-xs px-2 py-1 rounded-lg bg-white/[0.04]"
              >
                ✕
              </button>
            </div>

            {nearbyDriversLoading ? (
              <div className="py-12 text-center text-xs text-textMuted">
                Searching for nearby available delivery partners...
              </div>
            ) : nearbyDriversError ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-statusDanger">
                  {nearbyDriversErr?.response?.data?.message || 'Failed to load nearby drivers'}
                </p>
                <button
                  onClick={() => refetchNearbyDrivers()}
                  className="btn-primary px-3 py-1.5 text-xs font-semibold"
                >
                  Retry
                </button>
              </div>
            ) : nearbyDrivers.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Truck className="w-8 h-8 text-textMuted/40 mx-auto" />
                <p className="text-xs font-bold text-textPrimary">No Available Delivery Partners Nearby</p>
                <p className="text-xs text-textMuted max-w-xs mx-auto">
                  All shared drivers are currently busy or offline. Please check back shortly.
                </p>
                <button
                  onClick={() => refetchNearbyDrivers()}
                  className="px-3 py-1.5 text-xs rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] text-textSecondary"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {nearbyDrivers.map((driver, index) => {
                  const isCurrent =
                    (assignOrder.deliveryPartner?._id || assignOrder.deliveryPartnerId) === driver._id;
                  const isNearest = index === 0 && driver.distance !== null;

                  return (
                    <div
                      key={driver._id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        isNearest
                          ? 'bg-purple-500/[0.08] border-primaryPurple/50'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-textPrimary">{driver.name}</span>
                          {isNearest && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              NEAREST
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primaryPurple/15 text-purpleLight border border-primaryPurple/30">
                            {driver.availabilityStatus?.toUpperCase() || 'AVAILABLE'}
                          </span>
                        </div>
                        <p className="text-[11px] text-textMuted flex items-center gap-2">
                          <span>
                            {driver.distance !== null
                              ? `📍 ${driver.distance} km from pickup`
                              : '📍 Location pending'}
                          </span>
                          {driver.phone && <span>• 📞 {driver.phone}</span>}
                        </p>
                      </div>

                      <button
                        onClick={() => setDriverToAssign(driver)}
                        disabled={isCurrent || assignDriverMutation.isPending}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                          isCurrent
                            ? 'bg-white/[0.04] text-textMuted cursor-default'
                            : 'btn-primary'
                        }`}
                      >
                        {isCurrent ? 'Assigned' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setAssignOrder(null);
                  setDriverToAssign(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-textSecondary hover:text-textPrimary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {driverToAssign && assignOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl glass-card space-y-4 border border-white/15 shadow-2xl">
            <h3 className="text-base font-bold text-textPrimary">
              Confirm Driver Assignment
            </h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              Are you sure you want to assign shared delivery partner{' '}
              <span className="font-bold text-textPrimary">{driverToAssign.name}</span>
              {driverToAssign.distance !== null ? ` (~${driverToAssign.distance} km away)` : ''}{' '}
              to Order #{assignOrder._id?.slice(-8).toUpperCase()}?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDriverToAssign(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-textSecondary hover:text-textPrimary"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  assignDriverMutation.mutate({
                    orderId: assignOrder._id,
                    driverId: driverToAssign._id,
                  })
                }
                disabled={assignDriverMutation.isPending}
                className="btn-primary px-5 py-2 text-xs font-semibold"
              >
                {assignDriverMutation.isPending ? 'Assigning...' : 'Yes, Assign Driver'}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default AdminDelivery;
