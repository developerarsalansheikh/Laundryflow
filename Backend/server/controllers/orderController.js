const Order = require("../models/orderModels");
const Service = require("../models/serviceModels");
const Laundry = require("../models/laundryModels");
const Address = require("../models/addressModels");
const TimeSlot = require("../models/timeSlotModels");
const User = require("../models/userModels");
const {
  emitNewOrderToAdmin,
  emitOrderStatusUpdate,
  emitDeliveryAssigned,
  emitOrderCreated,
  emitOrderUpdated,
  emitOrderAssigned,
  emitOrderStatusChanged,
  emitOrderCancelled,
  emitOrderDelivered,
} = require("../socket/socketHandler");

// ─────────────────────────────────────────────
// Internal helper: initiate Razorpay refund
// Used by cancelOrder when order is paid via Razorpay
// ─────────────────────────────────────────────
const _initiateRefundInternal = async (orderId) => {
  try {
    const Payment = require("../models/paymentModels");
    const Razorpay = require("razorpay");

    const payment = await Payment.findOne({ order: orderId, status: "success" });
    if (!payment || payment.method !== "razorpay" || !payment.razorpayPaymentId) return;

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: payment.amount * 100, // paise mein
    });

    await Payment.findByIdAndUpdate(payment._id, {
      refundId: refund.id,
      refundAmount: refund.amount / 100,
      refundStatus: "processed",
      refundedAt: new Date(),
      status: "refunded",
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`[REFUND] Razorpay refund initiated: ${refund.id} for order ${orderId}`);
    }
  } catch (err) {
    console.error("Internal refund error:", err.message);
  }
};

// ─────────────────────────────────────────────
// 1. @desc    Naya order place karo
//    @route   POST /api/orders
//    @access  Private/User
// ─────────────────────────────────────────────
const placeOrder = async (req, res) => {
  try {
    const {
      services,
      laundryId,
      pickupAddressId,
      deliveryAddressId,
      pickupDate,
      timeSlotId,
      specialInstructions,
      paymentMethod = "razorpay",
    } = req.body;

    // ── Basic Validation ──────────────────────────
    if (!services || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one service.",
      });
    }

    if (!pickupAddressId || !deliveryAddressId) {
      return res.status(400).json({
        success: false,
        message: "Please select pickup and delivery addresses.",
      });
    }

    if (!laundryId) {
      return res.status(400).json({
        success: false,
        message: "Please select a laundry.",
      });
    }

    if (!pickupDate || !timeSlotId) {
      return res.status(400).json({
        success: false,
        message: "Please select a pickup date and time slot.",
      });
    }

    if (!["razorpay", "cod", "upi"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Payment method must be one of: razorpay, cod, or upi",
      });
    }

    // ── FIX 1: Validate addresses belong to the user ──
    const [pickupAddress, deliveryAddress] = await Promise.all([
      Address.findOne({ _id: pickupAddressId, user: req.user._id }),
      Address.findOne({ _id: deliveryAddressId, user: req.user._id }),
    ]);

    if (!pickupAddress) {
      return res.status(400).json({
        success: false,
        message: "Pickup address not found or does not belong to your account.",
      });
    }

    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: "Delivery address not found or does not belong to your account.",
      });
    }

    // ── Laundry active check ──────────────────────
    const laundry = await Laundry.findOne({
      _id: laundryId,
      status: "active",
      isActive: true,
    });

    if (!laundry) {
      return res.status(400).json({
        success: false,
        message: "Selected laundry is currently unavailable",
      });
    }

    // ── FIX 3: City-based radius check ───────────
    if (
      laundry.city &&
      pickupAddress.city &&
      laundry.city.toLowerCase() !== pickupAddress.city.toLowerCase()
    ) {
      return res.status(400).json({
        success: false,
        message: "This laundry does not deliver to your area",
      });
    }

    // ── FIX 4: Validate time slot ─────────────────
    const allTimeSlots = await TimeSlot.find({ laundryId });
    let matchedSlot = null;
    let matchedDayDoc = null;

    for (const dayDoc of allTimeSlots) {
      const slot = dayDoc.slots.find(
        (s) => s._id.toString() === timeSlotId && s.isActive
      );
      if (slot) {
        matchedSlot = slot;
        matchedDayDoc = dayDoc;
        break;
      }
    }

    if (!matchedSlot) {
      return res.status(400).json({
        success: false,
        message: "Selected time slot is not available",
      });
    }

    // Verify pickup date's day matches the slot's day
    const pickupDateObj = new Date(pickupDate);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfPickup = dayNames[pickupDateObj.getDay()];

    if (dayOfPickup !== matchedDayDoc.day) {
      return res.status(400).json({
        success: false,
        message: `Selected time slot is for ${matchedDayDoc.day}, but pickup date is ${dayOfPickup}`,
      });
    }

    // ── Calculate subtotal from DB prices (Authoritative) ────
    let subtotal = 0;
    const serviceDetails = [];
    const estimatedHoursList = [];

    for (const item of services) {
      const serviceId = item.service || item.serviceId || item.id;
      const service = await Service.findOne({
        _id: serviceId,
        laundryId: laundryId,
        isActive: true,
      });

      if (!service) {
        return res.status(400).json({
          success: false,
          message: "One or more selected services are currently unavailable",
        });
      }

      const lineTotal = service.price * item.quantity;
      subtotal += lineTotal;
      estimatedHoursList.push(service.estimatedHours || 24);

      serviceDetails.push({
        service: service._id,
        quantity: item.quantity,
        price: service.price,
        lineTotal,
        estimatedHours: service.estimatedHours || 24,
      });
    }

    // ── Authoritative Delivery Fee & Zone Eligibility ────
    const { evaluateDeliveryEligibility } = require("./deliveryZoneController");
    const eligibility = await evaluateDeliveryEligibility({
      laundryId,
      address: pickupAddress,
      orderSubtotal: subtotal,
    });

    if (!eligibility.available) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason || "This laundry store cannot service your delivery area.",
      });
    }

    // ── Authoritative GST & Grand Total Calculation ────
    // 5% standard GST on service subtotal
    const deliveryFee = eligibility.deliveryFee || 0;
    const gst = Math.round(subtotal * 0.05);
    const discount = 0;
    const totalAmount = subtotal + deliveryFee + gst - discount;

    // ── Compute estimated delivery date ───
    const maxEstimatedHours = Math.max(...estimatedHoursList);
    const estimatedDelivery = new Date(
      Date.now() + maxEstimatedHours * 60 * 60 * 1000
    );

    // ── Commission calculate ──────────────────────
    const commissionPercent = laundry.commissionPercent || 10;
    const commissionAmount = (totalAmount * commissionPercent) / 100;
    const laundryEarning = totalAmount - commissionAmount;

    // ── COD / Payment initialization ─────────────────
    const isPaid = false; // all orders start unpaid; payment handled separately

    // ── Idempotency / Duplicate Submission Protection ──
    const recentDuplicateOrder = await Order.findOne({
      user: req.user._id,
      laundryId,
      pickupAddress: pickupAddressId,
      totalAmount,
      status: "pending",
      createdAt: { $gte: new Date(Date.now() - 4000) },
    })
      .populate("services.service", "name price estimatedHours")
      .populate("laundryId", "name address phone")
      .populate("pickupAddress")
      .populate("deliveryAddress");

    if (recentDuplicateOrder) {
      return res.status(200).json({
        success: true,
        message: "Order placed successfully (existing duplicate prevented)",
        data: recentDuplicateOrder,
      });
    }

    // ── Authoritative Order Creation ──────────────────
    const order = await Order.create({
      user: req.user._id,
      laundryId,
      services: serviceDetails,
      pickupAddress: pickupAddressId,
      deliveryAddress: deliveryAddressId,
      pickupAddressSnapshot: pickupAddress.toObject ? pickupAddress.toObject() : pickupAddress,
      deliveryAddressSnapshot: deliveryAddress.toObject ? deliveryAddress.toObject() : deliveryAddress,
      subtotal,
      gst,
      discount,
      deliveryFee,
      minimumOrderCharge: eligibility.minimumOrderCharge || 0,
      pickupDistanceCharge: eligibility.pickupDistanceCharge || 0,
      deliveryDistanceCharge: eligibility.deliveryDistanceCharge || 0,
      deliveryDistanceKm: eligibility.distanceKm || 0,
      totalAmount,
      commissionAmount,
      laundryEarning,
      isPaid,
      paymentMethod,
      estimatedDelivery,
      scheduledPickup: {
        date: pickupDateObj,
        timeSlot: {
          startTime: matchedSlot.startTime,
          endTime: matchedSlot.endTime,
          label: matchedSlot.label || "",
        },
      },
      specialInstructions: specialInstructions || "",
      trackingUpdates: [
        {
          status: "pending",
          message: "Order placed successfully",
        },
      ],
    });

    // Increment store totalOrders count
    await Laundry.findByIdAndUpdate(laundryId, {
      $inc: { totalOrders: 1 },
    });

    const populatedOrder = await Order.findById(order._id)
      .populate("services.service", "name price estimatedHours")
      .populate("laundryId", "name address phone")
      .populate("pickupAddress")
      .populate("deliveryAddress");

    // Trigger notification asynchronously
    const { notifyOrderPlaced } = require("../services/notificationService");
    notifyOrderPlaced(populatedOrder).catch((err) =>
      console.error("Order placed notification failed:", err.message)
    );

    // Trigger Socket.io notification to laundry admins and customer
    emitNewOrderToAdmin(laundryId, populatedOrder);
    emitOrderCreated(populatedOrder);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: populatedOrder,
    });
  } catch (error) {
    console.error("PlaceOrder error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to place order. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// 2. @desc    Single order details dekho
//    @route   GET /api/orders/:id
//    @access  Private
// ─────────────────────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("services.service", "name price category estimatedHours")
      .populate("user", "name phone email")
      .populate("deliveryPartner", "name phone")
      .populate("laundryId", "name address phone")
      .populate("pickupAddress")
      .populate("deliveryAddress");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // User sirf apna order dekh sakta hai
    if (
      req.user.role === "user" &&
      order.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Admin sirf apni laundry ke orders dekh sakta hai
    if (req.user.role === "admin") {
      const orderLaundryId = order.laundryId?._id ? order.laundryId._id.toString() : order.laundryId?.toString();
      if (orderLaundryId !== req.user.laundryId?.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    // Delivery partner: assigned orders dekh sakta hai, YA agar unassigned hai aur pickup status mein hai jabki single active agent ho
    if (req.user.role === "delivery") {
      const isAssigned = order.deliveryPartner && (order.deliveryPartner._id || order.deliveryPartner).toString() === req.user._id.toString();
      if (!isAssigned) {
        const isEligiblePickup = ["pending", "pending_pickup", "placed"].includes(order.status);
        if (!isEligiblePickup || order.deliveryPartner !== null) {
          return res.status(403).json({
            success: false,
            message: "Access denied — this order is not assigned to you",
          });
        }
        if (req.user.availabilityStatus === "offline" || req.user.isAvailable === false) {
          return res.status(403).json({
            success: false,
            message: "Access denied — offline partners cannot access pickup orders",
          });
        }
        const activeDrivers = await User.find({
          role: "delivery",
          isActive: true,
          availabilityStatus: "available",
          isAvailable: { $ne: false },
        });
        const isSingleActiveAgent = activeDrivers.length === 1 && activeDrivers[0]._id.toString() === req.user._id.toString();
        if (!isSingleActiveAgent) {
          return res.status(403).json({
            success: false,
            message: "Access denied — this order is not assigned to you",
          });
        }
      }
    }

    const Payment = require("../models/paymentModels");
    const payment = await Payment.findOne({ order: order._id }).lean();
    const orderData = order.toObject ? order.toObject() : { ...order };
    if (payment) {
      orderData.payment = payment;
    }

    return res.status(200).json({
      success: true,
      data: orderData,
    });
  } catch (error) {
    console.error("GetOrderById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch order details. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// 3. @desc    Order cancel karo
//    @route   PUT /api/orders/:id/cancel
//    @access  Private/User
// ─────────────────────────────────────────────
const cancelOrder = async (req, res) => {
  try {
    const cancelReason = req.body?.cancelReason || "User ne cancel kiya";

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Sirf pending orders cancel ho sakte hain
    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending orders can be cancelled. Current status: ${order.status}`,
      });
    }

    await Order.findByIdAndUpdate(req.params.id, {
      status: "cancelled",
      cancelReason,
      $push: {
        trackingUpdates: {
          status: "cancelled",
          message: cancelReason,
        },
      },
    });

    // FIX 7: Auto-refund agar Razorpay se paid tha
    if (order.isPaid && order.paymentMethod === "razorpay") {
      _initiateRefundInternal(order._id);
    }
    // FIX 5: COD — no refund needed

    const cancelledOrder = await Order.findById(req.params.id)
      .populate("pickupAddress")
      .populate("deliveryAddress");

    // Trigger Socket.io event for order cancellation
    emitOrderCancelled(cancelledOrder, cancelReason);
    emitOrderStatusChanged(cancelledOrder, order.status, "cancelled", cancelReason);

    return res.status(200).json({
      success: true,
      message:
        order.isPaid && order.paymentMethod === "razorpay"
          ? "Order cancelled. Refund has been initiated."
          : "Order cancelled successfully",
      data: cancelledOrder,
    });
  } catch (error) {
    console.error("CancelOrder error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to cancel order. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// 4. @desc    Order status update karo
//    @route   PUT /api/orders/:id/status
//    @access  Private/Admin/Delivery
// ─────────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
  try {
    const { status, message } = req.body;

    // Status flow — canonical order status transitions
    const statusFlow = {
      pending: ["pending_pickup", "picked_up", "cancelled"],
      pending_pickup: ["picked_up", "cancelled"],
      placed: ["pending_pickup", "picked_up", "cancelled"],
      picked_up: ["at_laundry_pending_confirmation", "received_at_laundry", "in_progress"],
      at_laundry_pending_confirmation: ["received_at_laundry", "in_progress"],
      received_at_laundry: ["in_progress", "processing"],
      in_progress: ["processing", "ready", "ready_for_delivery"],
      processing: ["ready", "ready_for_delivery"],
      ready: ["ready_for_delivery", "out_for_delivery"],
      ready_for_delivery: ["out_for_delivery"],
      ready_for_redelivery: ["out_for_delivery"],
      out_for_delivery: ["delivery_pending_customer_confirmation", "delivered", "customer_unavailable", "delivery_failed"],
      delivery_pending_customer_confirmation: ["delivered", "customer_unavailable", "delivery_failed"],
      customer_unavailable: ["returned_to_laundry", "ready_for_redelivery", "out_for_delivery"],
      delivery_failed: ["returned_to_laundry", "ready_for_redelivery"],
      returned_to_laundry: ["ready_for_redelivery", "ready", "cancelled"],
      delivered: [],
      cancelled: [],
    };

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Admin sirf apni laundry ke orders update kar sakta hai
    if (req.user.role === "admin") {
      let adminLaundryId = req.user.laundryId?._id || req.user.laundryId;
      if (!adminLaundryId) {
        const myLaundry = await Laundry.findOne({ owner: req.user._id });
        if (myLaundry) {
          adminLaundryId = myLaundry._id;
        }
      }
      const orderLaundryId = order.laundryId?._id || order.laundryId;
      if (!adminLaundryId || orderLaundryId?.toString() !== adminLaundryId?.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied — this order does not belong to your store",
        });
      }
    }

    // Delivery partner sirf assigned orders update kar sakta hai
    if (
      req.user.role === "delivery" &&
      order.deliveryPartner?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied — this order is not assigned to you",
      });
    }

    const allowedNextStatuses = statusFlow[order.status] || [];

    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Order '${order.status}' se '${status}' cannot transition to this status. Allowed: ${allowedNextStatuses.join(", ") || "none"}`,
      });
    }

    // Mandatory Pickup Photo validation: pickup must not be marked complete if photo is missing
    if (status === "picked_up" && (!order.pickupPhoto || !order.pickupPhoto.url)) {
      return res.status(400).json({
        success: false,
        message: "Pickup photo is required before marking order as picked up.",
      });
    }

    const updatePayload = {
      status,
      $push: {
        trackingUpdates: {
          status,
          message: message || `Order status updated to ${status}`,
        },
      },
    };

    // Mark deliveredAt timestamp
    if (status === "delivered") {
      updatePayload.deliveredAt = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true }
    )
      .populate("services.service", "name price")
      .populate("user", "name phone")
      .populate("deliveryPartner", "name phone")
      .populate("pickupAddress")
      .populate("deliveryAddress");

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // ── Agar delivered ────────────────────────────
    if (status === "delivered") {
      // Laundry revenue update (agar paid hai)
      if (updatedOrder.isPaid) {
        await Laundry.findByIdAndUpdate(updatedOrder.laundryId, {
          $inc: { totalRevenue: updatedOrder.laundryEarning },
        });
      }

      // FIX 6: Delivery partner earnings update
      if (updatedOrder.deliveryPartner) {
        const laundry = await Laundry.findById(updatedOrder.laundryId).select(
          "deliveryPartnerEarningPerOrder"
        );
        const earning = laundry?.deliveryPartnerEarningPerOrder ?? 50;

        await User.findByIdAndUpdate(updatedOrder.deliveryPartner._id || updatedOrder.deliveryPartner, {
          $inc: {
            totalEarnings: earning,
            totalDeliveries: 1,
          },
          $push: {
            earningHistory: {
              orderId: updatedOrder._id,
              amount: earning,
              date: new Date(),
            },
          },
        });

        if (process.env.NODE_ENV !== "production") {
          console.log(`[EARNINGS] Delivery partner earning updated: Rs. ${earning} for order ${updatedOrder._id}`);
        }
      }
    }

    // Trigger notification asynchronously
    const { notifyOrderStatusUpdate } = require("../services/notificationService");
    notifyOrderStatusUpdate(updatedOrder, status).catch((err) =>
      console.error("Order status update notification failed:", err.message)
    );

    // Trigger Socket.io status update to order room, customer, driver, and laundry
    emitOrderStatusChanged(
      updatedOrder,
      order.status,
      status,
      message || `Order status updated to ${status}`
    );
    if (status === "delivered") {
      emitOrderDelivered(updatedOrder);
    }
    emitOrderStatusUpdate(
      updatedOrder._id,
      updatedOrder.user._id || updatedOrder.user,
      status,
      message || `Order status updated to ${status}`
    );

    return res.status(200).json({
      success: true,
      message: `Order status: ${status}`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error("UpdateOrderStatus error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update order status. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// 5. @desc    Sab orders dekho
//    @route   GET /api/orders
//    @access  Private/Admin/SuperAdmin
// ─────────────────────────────────────────────
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    // Admin sirf apni laundry ke orders dekhe
    if (req.user.role === "admin") {
      filter.laundryId = req.user.laundryId;
    }

    const orders = await Order.find(filter)
      .populate("user", "name phone")
      .populate("deliveryPartner", "name phone")
      .populate("services.service", "name price estimatedHours")
      .populate("laundryId", "name city")
      .populate("pickupAddress")
      .populate("deliveryAddress")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    console.error("GetAllOrders error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// 6. @desc    Delivery partner assign karo
//    @route   PUT /api/orders/:id/assign-delivery
//    @access  Private/Admin
// ─────────────────────────────────────────────
const assignDeliveryPartner = async (req, res) => {
  try {
    const deliveryPartnerId = req.body.deliveryPartnerId || req.body.driverId;

    if (!deliveryPartnerId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a delivery partner ID.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Admin sirf apni laundry ke orders mein assign kar sakta hai
    if (
      req.user.role === "admin" &&
      order.laundryId.toString() !== req.user.laundryId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied — this order does not belong to your store",
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot assign delivery partner to a cancelled order",
      });
    }

    if (order.status === "delivered") {
      return res.status(400).json({
        success: false,
        message: "Cannot change delivery partner for a delivered order",
      });
    }

    // Shared Delivery Partner: verify partner exists and has delivery role
    const partner = await User.findById(deliveryPartnerId);

    if (!partner || partner.role !== "delivery") {
      return res.status(400).json({
        success: false,
        message: "Please select a valid delivery partner",
      });
    }

    // Prevent assigning inactive delivery partners
    if (partner.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Selected delivery partner is inactive",
      });
    }

    // Prevent assigning unavailable or busy drivers
    if (
      partner.availabilityStatus === "offline" ||
      partner.availabilityStatus === "busy" ||
      partner.isAvailable === false
    ) {
      return res.status(400).json({
        success: false,
        message: "Selected delivery partner is currently unavailable or busy",
      });
    }

    // Duplicate assignment check
    if (
      order.deliveryPartner &&
      order.deliveryPartner.toString() === deliveryPartnerId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "This order is already assigned to this delivery partner",
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        deliveryPartner: deliveryPartnerId,
        $push: {
          trackingUpdates: {
            status: order.status,
            message: "Delivery partner assigned",
          },
        },
      },
      { new: true }
    )
      .populate("deliveryPartner", "name phone currentLocation")
      .populate("pickupAddress")
      .populate("deliveryAddress");

    // Trigger notification asynchronously
    const { notifyDeliveryAssigned } = require("../services/notificationService");
    notifyDeliveryAssigned(updatedOrder, updatedOrder.deliveryPartner).catch((err) =>
      console.error("Delivery assigned notification failed:", err.message)
    );

    // Trigger Socket.io notification to customer, driver, order room, and laundry admin
    emitOrderAssigned(updatedOrder, updatedOrder.deliveryPartner);
    emitDeliveryAssigned(updatedOrder.user, updatedOrder.deliveryPartner);

    return res.status(200).json({
      success: true,
      message: "Delivery partner assigned successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("AssignDeliveryPartner error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to assign delivery partner. Please try again.",
      error: error.message,
    });
  }
};

// Helper: Calculate distance in kilometers using Haversine formula
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined ||
    lat1 === null ||
    lon1 === undefined ||
    lon1 === null ||
    lat2 === undefined ||
    lat2 === null ||
    lon2 === undefined ||
    lon2 === null
  ) {
    return null;
  }
  const R = 6371; // Earth's radius in km
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

// ─────────────────────────────────────────────
// 7. @desc    Nearby available delivery partners for an order
//    @route   GET /api/orders/:id/nearby-drivers
//    @access  Private/Admin/SuperAdmin
// ─────────────────────────────────────────────
const getNearbyDriversForOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("pickupAddress")
      .populate("laundryId", "location address name");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Admin sirf apni laundry ke orders ke liye nearby drivers dekh sakta hai
    if (
      req.user.role === "admin" &&
      order.laundryId?._id?.toString() !== req.user.laundryId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied — this order does not belong to your store",
      });
    }

    // Determine pickup location coordinates
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
      order.laundryId &&
      order.laundryId.location &&
      Array.isArray(order.laundryId.location.coordinates) &&
      order.laundryId.location.coordinates.length === 2
    ) {
      // GeoJSON format: [longitude, latitude]
      pickupLng = order.laundryId.location.coordinates[0];
      pickupLat = order.laundryId.location.coordinates[1];
    }

    // Fetch active delivery partners who are available
    // Business rule: Exclude offline/busy drivers from assignable results
    const drivers = await User.find({
      role: "delivery",
      isActive: true,
      $and: [
        { availabilityStatus: { $nin: ["offline", "busy"] } },
        { isAvailable: { $ne: false } },
      ],
    }).select("name phone currentLocation availabilityStatus lastSeen");

    // Compute distance and map response
    const mappedDrivers = drivers.map((driver) => {
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

      return {
        _id: driver._id,
        name: driver.name,
        phone: driver.phone,
        availabilityStatus: driver.availabilityStatus || "available",
        currentLocation: driver.currentLocation,
        distance,
        lastSeen: driver.lastSeen || driver.updatedAt,
      };
    });

    // Sort available drivers by distance (nearest first; null distances at the end)
    mappedDrivers.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    return res.status(200).json({
      success: true,
      message: "Nearby delivery partners successfully fetched",
      count: mappedDrivers.length,
      data: mappedDrivers,
    });
  } catch (error) {
    console.error("GetNearbyDriversForOrder error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch nearby delivery partners. Please try again.",
      error: error.message,
    });
  }
};


// ─────────────────────────────────────────────
// 8. Automatic Driver Assignment
// ─────────────────────────────────────────────
const autoAssignOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      req.user.role === "admin" &&
      order.laundryId.toString() !== req.user.laundryId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied — this order does not belong to your store",
      });
    }

    if (order.status === "cancelled" || order.status === "delivered") {
      return res.status(400).json({
        success: false,
        message: `Cannot assign delivery partner to ${order.status} orders`,
      });
    }

    if (order.deliveryPartner) {
      return res.status(400).json({
        success: false,
        message: "A delivery partner is already assigned to this order",
      });
    }

    const { autoAssignDriver } = require("../services/driverAssignmentService");
    const result = await autoAssignDriver(order._id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.reason || "No eligible delivery partner is currently online",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Driver ${result.driver.name} automatically assigned successfully`,
      data: result.order,
    });
  } catch (error) {
    console.error("AutoAssignOrder error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to complete automatic driver assignment. Please try again.",
      error: error.message,
    });
  }
};


// ─────────────────────────────────────────────
// 9. Delivery Confirmation and Reschedule
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// @desc    Customer confirms delivery receipt
// @route   PUT /api/orders/:id/confirm-delivery
// @access  Private/User
// ─────────────────────────────────────────────
const confirmCustomerDelivery = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Role check: customer who owns order, or admin of that laundry, or superadmin
    const rawRole = req.user.role || "";
    const userRole = (rawRole === "customer") ? "user" : rawRole;

    if (userRole === "user") {
      if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied — This is not your order",
        });
      }
    } else if (userRole === "admin") {
      const orderLaundryId = order.laundryId?._id ? order.laundryId._id.toString() : order.laundryId?.toString();
      if (orderLaundryId !== req.user.laundryId?.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied — This order does not belong to your laundry store",
        });
      }
    } else if (userRole !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to confirm delivery",
      });
    }

    const currentStatus = order.status;
    if (currentStatus === "delivered") {
      return res.status(400).json({
        success: false,
        message: "Order has already been confirmed and marked as delivered.",
      });
    }

    if (!["delivery_pending_customer_confirmation", "out_for_delivery"].includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Delivery can only be confirmed after driver arrives or marks delivery attempt. Current status: ${order.status}`,
      });
    }

    const updatePayload = {
      status: "delivered",
      deliveredAt: new Date(),
      deliveryOTP: null,
      deliveryOTPExpiry: null,
      $push: {
        trackingUpdates: {
          status: "delivered",
          message: "Customer confirmed delivery receipt. Order successfully completed.",
          timestamp: new Date(),
        },
      },
    };

    if ((order.paymentMethod === "cod" || order.paymentMethod === "cash") && !order.isPaid) {
      updatePayload.isPaid = true;
      updatePayload.paidAt = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updatePayload, { new: true })
      .populate("services.service", "name price")
      .populate("user", "name phone")
      .populate("deliveryPartner", "name phone")
      .populate("pickupAddress")
      .populate("deliveryAddress");

    if (updatedOrder.isPaid) {
      await Laundry.findByIdAndUpdate(updatedOrder.laundryId, {
        $inc: { totalRevenue: updatedOrder.laundryEarning },
      });
    }

    if (updatedOrder.deliveryPartner) {
      const laundryDoc = await Laundry.findById(updatedOrder.laundryId).select("deliveryPartnerEarningPerOrder");
      const earning = laundryDoc?.deliveryPartnerEarningPerOrder ?? 50;

      await User.findByIdAndUpdate(updatedOrder.deliveryPartner._id || updatedOrder.deliveryPartner, {
        $inc: { totalEarnings: earning, totalDeliveries: 1 },
        $push: {
          earningHistory: {
            orderId: updatedOrder._id,
            amount: earning,
            date: new Date(),
          },
        },
      });
    }

    const { notifyOrderStatusUpdate } = require("../services/notificationService");
    notifyOrderStatusUpdate(updatedOrder, "delivered").catch((err) =>
      console.error("Order delivered notification failed:", err.message)
    );

    emitOrderStatusChanged(updatedOrder, order.status, "delivered", "Customer confirmed delivery");
    emitOrderDelivered(updatedOrder);

    return res.status(200).json({
      success: true,
      message: "Delivery confirmed successfully! Thank you.",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("confirmCustomerDelivery error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Problem confirming delivery",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Report customer unavailable / delivery attempt failed
// @route   PUT /api/orders/:id/unavailable
// @access  Private/Delivery/Admin
// ─────────────────────────────────────────────
const reportCustomerUnavailable = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { reason = "Customer unavailable at delivery location" } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const rawRole = req.user.role || "";
    const userRole = (rawRole === "delivery_partner" || rawRole === "driver") ? "delivery" : (rawRole === "customer" ? "user" : rawRole);

    if (userRole === "delivery") {
      if (order.deliveryPartner && order.deliveryPartner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied — This order is not assigned to you",
        });
      }
    } else if (userRole === "admin") {
      const orderLaundryId = order.laundryId?._id ? order.laundryId._id.toString() : order.laundryId?.toString();
      if (orderLaundryId !== req.user.laundryId?.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied — This order does not belong to your laundry store",
        });
      }
    } else if (userRole !== "superadmin" && userRole !== "user") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!["out_for_delivery", "delivery_pending_customer_confirmation"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Delivery reschedule can only be requested while order is out for delivery. Current status: ${order.status}`,
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: "customer_unavailable",
        $push: {
          trackingUpdates: {
            status: "customer_unavailable",
            message: `Delivery rescheduled: ${reason}. Order will be returned to laundry for next-day redelivery.`,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    )
      .populate("services.service", "name price")
      .populate("user", "name phone")
      .populate("deliveryPartner", "name phone")
      .populate("pickupAddress")
      .populate("deliveryAddress");

    const { notifyOrderStatusUpdate } = require("../services/notificationService");
    notifyOrderStatusUpdate(updatedOrder, "customer_unavailable").catch((err) =>
      console.error("Customer unavailable notification failed:", err.message)
    );

    emitOrderStatusChanged(updatedOrder, order.status, "customer_unavailable", reason);

    return res.status(200).json({
      success: true,
      message: "Order marked as customer unavailable. Driver should return order to laundry for next-day redelivery.",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("reportCustomerUnavailable error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Problem reporting customer unavailable",
      error: error.message,
    });
  }
};


// ─────────────────────────────────────────────
// 10. Change Order Address Workflow
// ─────────────────────────────────────────────
const changeOrderAddress = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { addressId, fullAddress, city, state, pincode, coordinates, landmark, label } = req.body;

    const order = await Order.findById(orderId).populate("laundryId");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Authorization check
    const isOwner = order.user && order.user.toString() === req.user._id.toString();
    const isPrivileged = ["admin", "superadmin", "support"].includes(req.user.role);
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this order's address",
      });
    }

    // Only allow address change before pickup
    const allowedStatuses = ["pending", "placed", "pending_pickup"];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot change delivery address once clothes have been picked up",
      });
    }

    // Resolve target address
    let targetAddress = {
      fullAddress: fullAddress || "",
      city: city || "",
      state: state || "",
      pincode: pincode || "",
      landmark: landmark || "",
      label: label || "home",
      coordinates: coordinates || {},
    };

    let addressDoc = null;
    if (addressId) {
      const Address = require("../models/addressModels");
      addressDoc = await Address.findById(addressId);
      if (addressDoc) {
        targetAddress = {
          fullAddress: addressDoc.fullAddress || targetAddress.fullAddress,
          city: addressDoc.city || targetAddress.city,
          state: addressDoc.state || targetAddress.state,
          pincode: addressDoc.pincode || targetAddress.pincode,
          landmark: addressDoc.landmark || targetAddress.landmark,
          label: addressDoc.label || targetAddress.label,
          coordinates: addressDoc.coordinates || targetAddress.coordinates,
        };
      }
    }

    if (!targetAddress.fullAddress && !targetAddress.city) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid destination address",
      });
    }

    // Authoritative serviceability and distance check
    const { evaluateDeliveryEligibility } = require("./deliveryZoneController");
    const subtotal = order.subtotal || Math.max(0, order.totalAmount - (order.deliveryFee || 0) - (order.gst || 0));
    const eligibility = await evaluateDeliveryEligibility({
      laundryId: order.laundryId._id || order.laundryId,
      address: targetAddress,
      orderSubtotal: subtotal,
    });

    if (!eligibility.available) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason || "This laundry store cannot service the updated address location.",
      });
    }

    // Recalculate authoritative charges & GST
    const deliveryFee = eligibility.deliveryFee || 0;
    const gst = Math.round(subtotal * 0.05);
    const discount = order.discount || 0;
    const totalAmount = subtotal + deliveryFee + gst - discount;

    const commissionPercent = order.laundryId?.commissionPercent || 10;
    const commissionAmount = (totalAmount * commissionPercent) / 100;
    const laundryEarning = totalAmount - commissionAmount;

    // Update snapshots & references
    if (addressDoc) {
      order.pickupAddress = addressDoc._id;
      order.deliveryAddress = addressDoc._id;
    }
    order.pickupAddressSnapshot = targetAddress;
    order.deliveryAddressSnapshot = targetAddress;
    order.deliveryFee = deliveryFee;
    order.deliveryDistanceKm = eligibility.distanceKm || 0;
    order.minimumOrderCharge = eligibility.minimumOrderCharge || 0;
    order.pickupDistanceCharge = eligibility.pickupDistanceCharge || 0;
    order.deliveryDistanceCharge = eligibility.deliveryDistanceCharge || 0;
    order.subtotal = subtotal;
    order.gst = gst;
    order.totalAmount = totalAmount;
    order.commissionAmount = commissionAmount;
    order.laundryEarning = laundryEarning;

    order.trackingUpdates.push({
      status: order.status,
      message: `Address updated to ${targetAddress.city || targetAddress.fullAddress}`,
      timestamp: new Date(),
    });

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("services.service", "name price estimatedHours")
      .populate("laundryId", "name address phone city")
      .populate("pickupAddress")
      .populate("deliveryAddress")
      .populate("deliveryPartner", "name phone");

    // Real-time notification to Customer, Laundry Admin, Delivery Partner
    try {
      emitOrderUpdated(populatedOrder);
      emitOrderStatusChanged(populatedOrder);
    } catch (socketErr) {
      console.warn("Socket notification warning on address change:", socketErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Order address successfully updated",
      data: populatedOrder,
    });
  } catch (error) {
    console.error("changeOrderAddress error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update order address",
      error: error.message,
    });
  }
};


// ─────────────────────────────────────────────
// 11. Pickup Photo Upload Workflow
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// @desc    Upload Pickup Photo for Order Identification
// @route   POST /api/orders/:id/pickup-photo
// @access  Private (delivery, admin, superadmin)
// ─────────────────────────────────────────────
const uploadPickupPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file of the physical laundry package",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Role-based authorization
    if (req.user.role === "delivery") {
      // Must be online
      if (req.user.availabilityStatus === "offline" || req.user.isAvailable === false) {
        return res.status(403).json({
          success: false,
          message: "Delivery partner must be ONLINE to upload pickup photo",
        });
      }

      // Order must be in pickup state
      const allowedPickupStatuses = ["pending", "pending_pickup", "placed", "picked_up"];
      if (!allowedPickupStatuses.includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: `Pickup photo cannot be uploaded for an order with status "${order.status}"`,
        });
      }

      // Check if assigned or single active agent
      const isAssignedToMe = order.deliveryPartner && order.deliveryPartner.toString() === req.user._id.toString();
      if (!isAssignedToMe) {
        if (order.deliveryPartner !== null) {
          return res.status(403).json({
            success: false,
            message: "Access denied — this order is assigned to another delivery partner",
          });
        }

        const activeDrivers = await User.find({
          role: "delivery",
          isActive: true,
          availabilityStatus: "available",
          isAvailable: { $ne: false },
        });
        const isSingleActiveAgent = activeDrivers.length === 1 && activeDrivers[0]._id.toString() === req.user._id.toString();
        if (!isSingleActiveAgent) {
          return res.status(403).json({
            success: false,
            message: "Access denied — you are not assigned to this order",
          });
        }
      }
    } else if (req.user.role === "admin") {
      const orderLaundryId = order.laundryId?._id ? order.laundryId._id.toString() : order.laundryId?.toString();
      if (orderLaundryId !== req.user.laundryId?.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied — this order does not belong to your laundry store",
        });
      }
    } else if (req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const photoUrl = req.file.path || req.file.secure_url || req.file.url;
    const publicId = req.file.filename || req.file.public_id || "";

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        pickupPhoto: {
          url: photoUrl,
          publicId,
          uploadedAt: new Date(),
          uploadedBy: req.user._id,
        },
      },
      { new: true }
    )
      .populate("user", "name phone email")
      .populate("deliveryPartner", "name phone")
      .populate("laundryId", "name address phone")
      .populate("pickupAddress")
      .populate("deliveryAddress");

    // Socket.io Real-time update to order room
    const io = req.app.get("io");
    if (io) {
      io.to(id.toString()).emit("order:pickup_photo_uploaded", {
        orderId: id,
        pickupPhoto: updatedOrder.pickupPhoto,
      });
      io.to(id.toString()).emit("order:updated", updatedOrder);
    }

    return res.status(200).json({
      success: true,
      message: "Pickup photo successfully uploaded and attached to order",
      data: {
        orderId: updatedOrder._id,
        pickupPhoto: updatedOrder.pickupPhoto,
      },
    });
  } catch (error) {
    console.error("uploadPickupPhoto error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to upload pickup photo",
      error: error.message,
    });
  }
};

module.exports = {
  placeOrder,
  getOrderById,
  cancelOrder,
  changeOrderAddress,
  updateOrderStatus,
  confirmCustomerDelivery,
  reportCustomerUnavailable,
  getAllOrders,
  assignDeliveryPartner,
  getNearbyDriversForOrder,
  autoAssignOrder,
  calculateDistanceKm,
  uploadPickupPhoto,
};
