const DeliveryZone = require("../models/deliveryZoneModels");
const Laundry = require("../models/laundryModels");
const Address = require("../models/addressModels");

/**
 * Haversine formula to compute distance in km between two lat/lng points
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return null;
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * Check delivery eligibility and compute delivery fee for an address and laundry
 * Shared helper used by both check-availability endpoint and orderController.placeOrder
 */
const evaluateDeliveryEligibility = async ({
  laundryId,
  address,
  coordinates,
  pincode,
  city,
  orderSubtotal = 0,
}) => {
  const laundry = await Laundry.findById(laundryId);
  if (!laundry || (laundry.status && laundry.status !== "active") || laundry.isActive === false) {
    return {
      available: false,
      deliveryFee: 0,
      minOrderAmount: 0,
      reason: "This laundry store is currently not active",
    };
  }

  // Fetch active delivery zones for this laundry
  const zones = await DeliveryZone.find({ laundryId, isActive: true }).sort({ deliveryFee: 1 });

  // Laundry GPS coordinates (GeoJSON [lng, lat])
  let laundryLat = null;
  let laundryLng = null;
  if (
    laundry.location &&
    Array.isArray(laundry.location.coordinates) &&
    laundry.location.coordinates.length === 2 &&
    (laundry.location.coordinates[0] !== 0 || laundry.location.coordinates[1] !== 0)
  ) {
    laundryLng = laundry.location.coordinates[0];
    laundryLat = laundry.location.coordinates[1];
  }

  // Customer GPS coordinates
  const targetAddress = address || {};
  const effectiveCoords = targetAddress.coordinates || coordinates || {};
  const effectivePincode = targetAddress.pincode || pincode;
  const effectiveCity = targetAddress.city || city;

  let custLat = effectiveCoords.lat !== undefined ? effectiveCoords.lat : effectiveCoords.latitude;
  let custLng = effectiveCoords.lng !== undefined ? effectiveCoords.lng : effectiveCoords.longitude;

  let distanceKm = null;
  if (
    typeof laundryLat === "number" &&
    typeof laundryLng === "number" &&
    typeof custLat === "number" &&
    typeof custLng === "number"
  ) {
    distanceKm = calculateDistanceKm(laundryLat, laundryLng, custLat, custLng);
  }

  // Determine maximum service distance (Feature B)
  const maxAllowedDistance = Math.min(20, laundry.maxServiceDistanceKm || laundry.serviceRadius || 20);

  // Check 1: Strict Maximum Service Distance Enforcement (Feature B: Max 20 KM)
  if (distanceKm !== null && distanceKm > maxAllowedDistance) {
    return {
      available: false,
      isOutOfRange: true,
      deliveryFee: 0,
      minimumOrderCharge: 0,
      pickupDistanceCharge: 0,
      deliveryDistanceCharge: 0,
      totalDistanceCharges: 0,
      minOrderAmount: 100,
      distanceKm,
      maxAllowedDistance,
      reason: `This laundry is outside its current delivery area (maximum ${maxAllowedDistance} km, distance is ${distanceKm} km).`,
    };
  }

  // Check 2: City Match Check (Rule 1 & 2)
  if (
    laundry.city &&
    effectiveCity &&
    laundry.city.trim().toLowerCase() !== effectiveCity.trim().toLowerCase()
  ) {
    return {
      available: false,
      deliveryFee: 0,
      minimumOrderCharge: 0,
      pickupDistanceCharge: 0,
      deliveryDistanceCharge: 0,
      totalDistanceCharges: 0,
      minOrderAmount: 100,
      distanceKm,
      maxAllowedDistance,
      reason: `This laundry only delivers in ${laundry.city}.`,
    };
  }

  // ── SECTION 5 & REQUIREMENTS 9 & 10: PICKUP + DELIVERY DISTANCE CHARGES & ₹100 MINIMUM ORDER ──
  // Rule 1: Minimum Order Charge
  // If orderSubtotal < ₹100: apply configured ₹30 base charge
  // If orderSubtotal >= ₹100: ₹0 (waived)
  const minimumOrderCharge = orderSubtotal < 100 ? 30 : 0;

  // Rule 2: Distance Charges for BOTH Pickup & Delivery Legs
  // 0–3 KM: No distance charge
  // Above 3 KM: Distance charge applies to BOTH pickup and delivery legs
  let pickupDistanceCharge = 0;
  let deliveryDistanceCharge = 0;

  if (distanceKm !== null && distanceKm > 3.0) {
    let perLegCharge = null;

    if (Array.isArray(laundry.distancePricing) && laundry.distancePricing.length > 0) {
      const sortedTiers = [...laundry.distancePricing].sort((a, b) => a.minDistanceKm - b.minDistanceKm);
      for (const tier of sortedTiers) {
        if (distanceKm >= tier.minDistanceKm && distanceKm <= tier.maxDistanceKm) {
          perLegCharge = tier.deliveryFee;
          break;
        }
      }
      if (perLegCharge === null && sortedTiers.length > 0) {
        perLegCharge = sortedTiers[sortedTiers.length - 1].deliveryFee;
      }
    }

    if (perLegCharge === null || perLegCharge === undefined) {
      // Standard rate: ₹20 base + ₹5 per km beyond 3 km per leg
      perLegCharge = Math.round(20 + (distanceKm - 3.0) * 5);
    }

    pickupDistanceCharge = perLegCharge;
    deliveryDistanceCharge = perLegCharge;
  }

  const totalDistanceCharges = pickupDistanceCharge + deliveryDistanceCharge;
  const deliveryFee = minimumOrderCharge + totalDistanceCharges;

  // Case A: Custom Delivery Zone configured for this laundry
  if (zones.length > 0) {
    let matchingZone = null;

    for (const zone of zones) {
      // Check Pincode match
      if (effectivePincode && Array.isArray(zone.pincodes) && zone.pincodes.length > 0) {
        const formattedPincode = String(effectivePincode).trim();
        if (zone.pincodes.map((p) => String(p).trim()).includes(formattedPincode)) {
          matchingZone = zone;
          break;
        }
      }

      // Check Radius match
      if (zone.radiusKm && distanceKm !== null && distanceKm <= zone.radiusKm) {
        matchingZone = zone;
        break;
      }
    }

    if (matchingZone) {
      return {
        available: true,
        deliveryFee,
        minimumOrderCharge,
        pickupDistanceCharge,
        deliveryDistanceCharge,
        totalDistanceCharges,
        minOrderAmount: Math.max(100, matchingZone.minOrderAmount || 0),
        zoneName: matchingZone.name,
        estimatedDeliveryHours: matchingZone.estimatedDeliveryHours || laundry.defaultTurnaroundHours || 24,
        distanceKm,
        maxAllowedDistance,
      };
    }
  }

  return {
    available: true,
    deliveryFee,
    minimumOrderCharge,
    pickupDistanceCharge,
    deliveryDistanceCharge,
    totalDistanceCharges,
    minOrderAmount: 100,
    zoneName: distanceKm <= 3.0 ? "Local Doorstep Pickup & Delivery" : "Express Doorstep Pickup & Delivery",
    estimatedDeliveryHours: laundry.defaultTurnaroundHours || 24,
    distanceKm,
    maxAllowedDistance,
  };
};

/**
 * Helper to resolve laundryId for admin user, checking req.user.laundryId or DB owner
 */
const resolveAdminLaundryId = async (user) => {
  if (!user) return null;
  if (user.laundryId) return user.laundryId.toString();
  const laundry = await Laundry.findOne({ owner: user._id });
  return laundry ? laundry._id.toString() : null;
};

// ─────────────────────────────────────────────
// 1. @desc    Get all delivery zones for laundry
//    @route   GET /api/delivery-zones
//    @access  Private/Admin/SuperAdmin
// ─────────────────────────────────────────────
const getDeliveryZones = async (req, res) => {
  try {
    let laundryId = null;

    if (req.user.role === "admin") {
      laundryId = await resolveAdminLaundryId(req.user);
    } else if (req.user.role === "superadmin") {
      laundryId = req.query.laundryId || null;
    }

    const filter = {};
    if (laundryId) {
      filter.laundryId = laundryId;
    }

    const zones = await DeliveryZone.find(filter)
      .populate("laundryId", "name city state")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: zones.length,
      data: zones,
    });
  } catch (error) {
    console.error("GetDeliveryZones error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch delivery zones. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// 2. @desc    Create new delivery zone
//    @route   POST /api/delivery-zones
//    @access  Private/Admin/SuperAdmin
// ─────────────────────────────────────────────
const createDeliveryZone = async (req, res) => {
  try {
    const {
      name,
      deliveryFee = 0,
      minOrderAmount = 0,
      estimatedDeliveryHours = 24,
      pincodes = [],
      radiusKm = null,
      isActive = true,
    } = req.body;

    let targetLaundryId =
      req.user.role === "admin"
        ? await resolveAdminLaundryId(req.user)
        : req.body.laundryId;

    if (!targetLaundryId) {
      return res.status(400).json({
        success: false,
        message: "Laundry ID is required",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Zone name is required",
      });
    }

    if (deliveryFee < 0) {
      return res.status(400).json({
        success: false,
        message: "Delivery fee must be 0 or greater",
      });
    }

    // Sanitize and filter pincodes
    const cleanPincodes = Array.isArray(pincodes)
      ? pincodes
          .map((p) => String(p).trim())
          .filter((p) => /^\d{6}$/.test(p))
      : [];

    const zone = await DeliveryZone.create({
      laundryId: targetLaundryId,
      name: name.trim(),
      deliveryFee: Number(deliveryFee) || 0,
      minOrderAmount: Number(minOrderAmount) || 0,
      estimatedDeliveryHours: Number(estimatedDeliveryHours) || 24,
      pincodes: cleanPincodes,
      radiusKm: radiusKm ? Number(radiusKm) : null,
      isActive: Boolean(isActive),
    });

    return res.status(201).json({
      success: true,
      message: "Delivery zone created successfully",
      data: zone,
    });
  } catch (error) {
    console.error("CreateDeliveryZone error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create delivery zone. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// 3. @desc    Update delivery zone
//    @route   PUT /api/delivery-zones/:id
//    @access  Private/Admin/SuperAdmin
// ─────────────────────────────────────────────
const updateDeliveryZone = async (req, res) => {
  try {
    const zone = await DeliveryZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Delivery zone not found",
      });
    }

    // Admin can only update own laundry's zones
    if (req.user.role === "admin") {
      const userLaundryId = await resolveAdminLaundryId(req.user);
      if (zone.laundryId.toString() !== userLaundryId?.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied — this zone does not belong to your store",
        });
      }
    }

    const {
      name,
      deliveryFee,
      minOrderAmount,
      estimatedDeliveryHours,
      pincodes,
      radiusKm,
      isActive,
    } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (deliveryFee !== undefined) updates.deliveryFee = Math.max(0, Number(deliveryFee));
    if (minOrderAmount !== undefined) updates.minOrderAmount = Math.max(0, Number(minOrderAmount));
    if (estimatedDeliveryHours !== undefined) updates.estimatedDeliveryHours = Math.max(1, Number(estimatedDeliveryHours));
    if (pincodes !== undefined) {
      updates.pincodes = Array.isArray(pincodes)
        ? pincodes.map((p) => String(p).trim()).filter((p) => /^\d{6}$/.test(p))
        : [];
    }
    if (radiusKm !== undefined) updates.radiusKm = radiusKm ? Number(radiusKm) : null;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const updatedZone = await DeliveryZone.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Delivery zone updated successfully",
      data: updatedZone,
    });
  } catch (error) {
    console.error("UpdateDeliveryZone error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update delivery zone. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// 4. @desc    Toggle zone active state
//    @route   PATCH /api/delivery-zones/:id/toggle
//    @access  Private/Admin/SuperAdmin
// ─────────────────────────────────────────────
const toggleDeliveryZone = async (req, res) => {
  try {
    const zone = await DeliveryZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Delivery zone not found",
      });
    }

    if (req.user.role === "admin") {
      const userLaundryId = await resolveAdminLaundryId(req.user);
      if (zone.laundryId.toString() !== userLaundryId?.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied — this zone does not belong to your store",
        });
      }
    }

    zone.isActive = !zone.isActive;
    await zone.save();

    return res.status(200).json({
      success: true,
      message: `Zone ${zone.isActive ? "activated" : "deactivated"} successfully`,
      data: zone,
    });
  } catch (error) {
    console.error("ToggleDeliveryZone error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to change zone status. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// 5. @desc    Delete delivery zone
//    @route   DELETE /api/delivery-zones/:id
//    @access  Private/Admin/SuperAdmin
// ─────────────────────────────────────────────
const deleteDeliveryZone = async (req, res) => {
  try {
    const zone = await DeliveryZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Delivery zone not found",
      });
    }

    if (req.user.role === "admin") {
      const userLaundryId = await resolveAdminLaundryId(req.user);
      if (zone.laundryId.toString() !== userLaundryId?.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied — this zone does not belong to your store",
        });
      }
    }

    await DeliveryZone.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Delivery zone deleted successfully",
    });
  } catch (error) {
    console.error("DeleteDeliveryZone error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to delete delivery zone. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// 6. @desc    Check delivery availability & calculate fee for an address
//    @route   POST /api/delivery-zones/check-availability
//    @access  Private (any authenticated user)
// ─────────────────────────────────────────────
const checkDeliveryAvailability = async (req, res) => {
  try {
    const { laundryId, addressId, pincode, city, coordinates, orderSubtotal } = req.body;

    if (!laundryId) {
      return res.status(400).json({
        success: false,
        message: "Laundry ID is required",
      });
    }

    let addressData = {};

    if (addressId) {
      const savedAddress = await Address.findById(addressId);
      if (savedAddress) {
        addressData = {
          pincode: savedAddress.pincode,
          city: savedAddress.city,
          state: savedAddress.state,
          coordinates: savedAddress.coordinates,
          fullAddress: savedAddress.fullAddress,
        };
      }
    } else {
      addressData = {
        pincode,
        city,
        coordinates,
      };
    }

    const result = await evaluateDeliveryEligibility({
      laundryId,
      address: addressData,
      orderSubtotal: Number(orderSubtotal) || 0,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("CheckDeliveryAvailability error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to check delivery availability. Please try again.",
      error: error.message,
    });
  }
};

module.exports = {
  getDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  toggleDeliveryZone,
  deleteDeliveryZone,
  checkDeliveryAvailability,
  evaluateDeliveryEligibility,
  calculateDistanceKm,
};
