const User = require("../models/userModels");
const Order = require("../models/orderModels");
const Laundry = require("../models/laundryModels");
const {
  emitOrderAssigned,
  emitDeliveryAssigned,
} = require("../socket/socketHandler");
const { notifyDeliveryAssigned } = require("./notificationService");

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
 * Automatically assign the most optimal eligible delivery driver to an order.
 * Considers availability, distance to pickup, and current active workload.
 *
 * @param {string|ObjectId} orderId
 * @returns {Promise<{ success: boolean, driver?: object, reason?: string }>}
 */
const autoAssignDriver = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate("pickupAddress")
      .populate("laundryId");

    if (!order) {
      return { success: false, reason: "Order not found." };
    }

    if (order.status === "cancelled" || order.status === "delivered") {
      return { success: false, reason: `Cannot assign driver to ${order.status} order` };
    }

    if (order.deliveryPartner) {
      return { success: false, reason: "Driver is already assigned to this order" };
    }

    // Determine target pickup location coordinates
    let pickupLat = null;
    let pickupLng = null;

    if (
      order.pickupAddress &&
      order.pickupAddress.coordinates &&
      typeof order.pickupAddress.coordinates.lat === "number" &&
      typeof order.pickupAddress.coordinates.lng === "number"
    ) {
      pickupLat = order.pickupAddress.coordinates.lat;
      pickupLng = order.pickupAddress.coordinates.lng;
    } else if (
      order.pickupAddressSnapshot &&
      order.pickupAddressSnapshot.coordinates &&
      typeof order.pickupAddressSnapshot.coordinates.lat === "number" &&
      typeof order.pickupAddressSnapshot.coordinates.lng === "number"
    ) {
      pickupLat = order.pickupAddressSnapshot.coordinates.lat;
      pickupLng = order.pickupAddressSnapshot.coordinates.lng;
    } else if (
      order.laundryId &&
      order.laundryId.location &&
      Array.isArray(order.laundryId.location.coordinates) &&
      order.laundryId.location.coordinates.length === 2 &&
      (order.laundryId.location.coordinates[0] !== 0 || order.laundryId.location.coordinates[1] !== 0)
    ) {
      pickupLng = order.laundryId.location.coordinates[0];
      pickupLat = order.laundryId.location.coordinates[1];
    }

    // Maximum search radius (store configured autoAssignRadiusKm or default 25km)
    const maxRadiusKm = order.laundryId?.autoAssignRadiusKm || 25;

    // Fetch active delivery partners who are eligible (online, available, active)
    // Strict business rules:
    // - Exclude offline
    // - Exclude busy
    // - Exclude inactive
    // - Shared delivery partner model: all eligible delivery users are candidate pool
    const candidates = await User.find({
      role: "delivery",
      isActive: true,
      $and: [
        { availabilityStatus: { $nin: ["offline", "busy"] } },
        { isAvailable: { $ne: false } },
      ],
    }).select("_id name phone currentLocation availabilityStatus isAvailable");

    if (candidates.length === 0) {
      await Order.findByIdAndUpdate(orderId, {
        "assignmentInfo.mode": "automatic",
        "assignmentInfo.status": "unassigned",
        "assignmentInfo.failureReason": "No online available drivers found",
        "assignmentInfo.attemptedAt": new Date(),
      });
      return { success: false, reason: "No online available drivers found" };
    }

    // Retrieve active workload for each candidate
    // In-progress statuses: pending, picked_up, ready, out_for_delivery
    const candidateIds = candidates.map((c) => c._id);
    const activeTasks = await Order.aggregate([
      {
        $match: {
          deliveryPartner: { $in: candidateIds },
          status: { $in: ["pending", "picked_up", "ready", "out_for_delivery"] },
        },
      },
      {
        $group: {
          _id: "$deliveryPartner",
          count: { $sum: 1 },
        },
      },
    ]);

    const workloadMap = new Map();
    activeTasks.forEach((t) => {
      workloadMap.set(t._id.toString(), t.count);
    });

    // Score and filter candidates
    const scoredCandidates = [];

    for (const driver of candidates) {
      const workload = workloadMap.get(driver._id.toString()) || 0;

      let distance = null;
      if (
        pickupLat !== null &&
        pickupLng !== null &&
        driver.currentLocation &&
        typeof driver.currentLocation.lat === "number" &&
        typeof driver.currentLocation.lng === "number"
      ) {
        distance = calculateDistanceKm(
          pickupLat,
          pickupLng,
          driver.currentLocation.lat,
          driver.currentLocation.lng
        );
      }

      // If distance exists and exceeds maxRadius, skip candidate
      if (distance !== null && distance > maxRadiusKm) {
        continue;
      }

      // Score formula:
      // Lower score is better. Prioritize low active workload, then nearest distance.
      // Weight: 1 active order ≈ 3 km distance penalty.
      const distScore = distance !== null ? distance : 10;
      const score = workload * 3 + distScore;

      scoredCandidates.push({
        driver,
        workload,
        distance,
        score,
      });
    }

    if (scoredCandidates.length === 0) {
      await Order.findByIdAndUpdate(orderId, {
        "assignmentInfo.mode": "automatic",
        "assignmentInfo.status": "unassigned",
        "assignmentInfo.failureReason": `No available drivers within ${maxRadiusKm} km radius`,
        "assignmentInfo.attemptedAt": new Date(),
      });
      return {
        success: false,
        reason: `No available drivers within ${maxRadiusKm} km radius`,
      };
    }

    // Sort ascending by score (best candidate first)
    scoredCandidates.sort((a, b) => a.score - b.score);

    const selected = scoredCandidates[0];
    const selectedDriver = selected.driver;

    // Assign driver to order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        deliveryPartner: selectedDriver._id,
        "assignmentInfo.mode": "automatic",
        "assignmentInfo.status": "assigned",
        "assignmentInfo.failureReason": "",
        "assignmentInfo.assignedAt": new Date(),
        $push: {
          trackingUpdates: {
            status: order.status,
            message: `Delivery partner ${selectedDriver.name} automatically assigned`,
            timestamp: new Date(),
          },
        },
      },
      { returnDocument: "after" }
    )
      .populate("deliveryPartner", "name phone currentLocation isAvailable")
      .populate("pickupAddress")
      .populate("deliveryAddress");

    // Asynchronously notify driver
    notifyDeliveryAssigned(updatedOrder, updatedOrder.deliveryPartner).catch((err) =>
      console.error("[AutoAssign] Notification error:", err.message)
    );

    // Emit Socket.IO events to order room, driver room, customer room, and admin
    emitOrderAssigned(updatedOrder, updatedOrder.deliveryPartner);
    emitDeliveryAssigned(updatedOrder.user, updatedOrder.deliveryPartner);

    return {
      success: true,
      driver: selectedDriver,
      distanceKm: selected.distance,
      workload: selected.workload,
      order: updatedOrder,
    };
  } catch (error) {
    console.error("[AutoAssign] Error:", error.message);
    await Order.findByIdAndUpdate(orderId, {
      "assignmentInfo.mode": "automatic",
      "assignmentInfo.status": "failed",
      "assignmentInfo.failureReason": error.message,
      "assignmentInfo.attemptedAt": new Date(),
    }).catch(() => {});

    return {
      success: false,
      reason: error.message,
    };
  }
};

module.exports = {
  autoAssignDriver,
  calculateDistanceKm,
};
