const Order = require("../models/orderModels");
const User = require("../models/userModels");
const Laundry = require("../models/laundryModels");

// Helper to send SMS (Twilio in production, console in development)
const sendSMS = async (phone, message) => {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN
  ) {
    try {
      const twilio = require("twilio");
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone.startsWith("+") ? phone : `+91${phone}`,
      });
      console.log(`[SMS-PROD] Sent successfully to ${phone}`);
    } catch (err) {
      console.error("Twilio SMS error:", err.message);
    }
  } else {
    console.log("\n--- [SMS-DEV CONSOLE LOG] ---");
    console.log(`To: ${phone}`);
    console.log(`Message: ${message}`);
    console.log("-----------------------------\n");
  }
};

// ─────────────────────────────────────────────
// 1. @desc    Get orders that are ready and unassigned (same laundry)
//    @route   GET /api/delivery/available-orders
//    @access  Private/Delivery
// ─────────────────────────────────────────────
const getAvailableOrders = async (req, res) => {
  try {
    const filter = {
      status: "ready",
      deliveryPartner: null,
    };

    if (req.query?.laundryId) {
      filter.laundryId = req.query.laundryId;
    } else if (req.user?.laundryId) {
      filter.laundryId = req.user.laundryId;
    }

    // Status is 'ready' and no delivery partner is assigned yet
    const orders = await Order.find(filter)
      .populate("user", "name phone address")
      .populate("services.service", "name price")
      .populate("laundryId", "name address phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Available orders successfully fetched",
      data: orders,
    });
  } catch (error) {
    console.error("getAvailableOrders error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching available orders",
      error: error.message,
      data: {},
    });
  }
};

// ─────────────────────────────────────────────
// 2. @desc    Delivery partner accepts an order
//    @route   POST /api/delivery/accept/:orderId
//    @access  Private/Delivery
// ─────────────────────────────────────────────
const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: {},
      });
    }

    // Must be in ready status and unassigned
    if (order.status !== "ready" || order.deliveryPartner !== null) {
      return res.status(400).json({
        success: false,
        message: "This order is no longer available for acceptance",
        data: {},
      });
    }

    // Rule 1: Use findByIdAndUpdate instead of document.save()
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        deliveryPartner: req.user._id,
        $push: {
          trackingUpdates: {
            status: "ready",
            message: "Delivery partner assigned. Order is being picked up from laundry.",
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    )
      .populate("user", "name phone address")
      .populate("laundryId", "name address phone");

    // Socket.io: Notify customer about order status update
    const io = req.app.get("io");
    if (io) {
      io.to(orderId.toString()).emit("order:status_update", {
        orderId,
        status: "ready",
        message: "Delivery partner has accepted your order",
        deliveryPartner: {
          name: req.user.name,
          phone: req.user.phone,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order successfully accepted",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("acceptOrder error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error accepting order",
      error: error.message,
      data: {},
    });
  }
};

// ─────────────────────────────────────────────
// 3. @desc    Delivery partner can reject/unassign order (ready orders only)
//    @route   POST /api/delivery/reject/:orderId
//    @access  Private/Delivery
// ─────────────────────────────────────────────
const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: {},
      });
    }

    // Delivery partner verification
    if (!order.deliveryPartner || order.deliveryPartner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied — This order is not assigned to you",
        data: {},
      });
    }

    // Rejection only allowed before actually picking it up (status ready)
    if (order.status !== "ready") {
      return res.status(400).json({
        success: false,
        message: "Order cannot be rejected once it has been picked up",
        data: {},
      });
    }

    // Rule 1: Use findByIdAndUpdate instead of document.save()
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        deliveryPartner: null,
        $push: {
          trackingUpdates: {
            status: "ready",
            message: "Delivery partner cancelled acceptance. Order is unassigned again.",
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    // Socket.io Notification: Notify customer of status tracking update
    const io = req.app.get("io");
    if (io) {
      io.to(orderId.toString()).emit("order:status_update", {
        orderId,
        status: "ready",
        message: "Order is waiting for another delivery partner",
      });

      // Notify nearby delivery partners that an order is available again
      io.emit("order:available", {
        orderId,
        laundryId: order.laundryId,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order rejected successfully, it is now available for other partners",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("rejectOrder error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error rejecting order",
      error: error.message,
      data: {},
    });
  }
};

// ─────────────────────────────────────────────
// 4. @desc    Active orders only (assigned to driver: pending, picked_up, ready, out_for_delivery)
//    @route   GET /api/delivery/my-active-orders
//    @access  Private/Delivery
// ─────────────────────────────────────────────
const getMyActiveOrders = async (req, res) => {
  try {
    const { type, status } = req.query || {};

    // Check if delivery partner is active and available
    const isOnline = req.user.availabilityStatus === "available" && req.user.isAvailable !== false;

    // Check if single active delivery agent across the platform
    let isSingleActiveAgent = false;
    if (isOnline) {
      const activeDrivers = await User.find({
        role: "delivery",
        isActive: true,
        availabilityStatus: "available",
        isAvailable: { $ne: false },
      });
      isSingleActiveAgent = activeDrivers.length === 1 && activeDrivers[0]._id.toString() === req.user._id.toString();
    }

    let query = {};

    if (type === "pickup") {
      // PICKUP: Genuine ready-for-pickup orders
      const pickupStatuses = ["pending", "pending_pickup", "placed"];
      if (isSingleActiveAgent) {
        // Single active agent automatically sees eligible pickup orders from different laundries
        query = {
          status: { $in: pickupStatuses },
          $or: [{ deliveryPartner: req.user._id }, { deliveryPartner: null }],
        };
      } else {
        // Explicitly assigned to this agent only
        query = {
          deliveryPartner: req.user._id,
          status: { $in: pickupStatuses },
        };
      }
    } else if (type === "delivery") {
      // DELIVERY: Orders successfully picked up by this Delivery Agent and awaiting customer delivery
      const deliveryStatuses = [
        "picked_up",
        "at_laundry_pending_confirmation",
        "ready",
        "ready_for_delivery",
        "ready_for_redelivery",
        "out_for_delivery",
        "delivery_pending_customer_confirmation",
        "customer_unavailable",
        "returned_to_laundry",
      ];
      query = {
        deliveryPartner: req.user._id,
        status: { $in: deliveryStatuses },
      };
    } else if (status) {
      query = {
        deliveryPartner: req.user._id,
        status,
      };
    } else {
      // All active orders for this agent
      const allActiveStatuses = [
        "pending",
        "pending_pickup",
        "placed",
        "picked_up",
        "at_laundry_pending_confirmation",
        "ready",
        "ready_for_delivery",
        "ready_for_redelivery",
        "out_for_delivery",
        "delivery_pending_customer_confirmation",
        "customer_unavailable",
        "returned_to_laundry",
      ];

      if (isSingleActiveAgent) {
        query = {
          $or: [
            { deliveryPartner: req.user._id, status: { $in: allActiveStatuses } },
            { deliveryPartner: null, status: { $in: ["pending", "pending_pickup", "placed"] } },
          ],
        };
      } else {
        query = {
          deliveryPartner: req.user._id,
          status: { $in: allActiveStatuses },
        };
      }
    }

    const orders = await Order.find(query)
      .populate("user", "name phone address")
      .populate("laundryId", "name address phone")
      .populate("pickupAddress")
      .populate("deliveryAddress")
      .populate("services.service", "name price category estimatedHours")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Active orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    console.error("getMyActiveOrders error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching active orders",
      error: error.message,
      data: {},
    });
  }
};

// ─────────────────────────────────────────────
// 5. @desc    Delivered orders history with pagination
//    @route   GET /api/delivery/my-completed-orders
//    @access  Private/Delivery
// ─────────────────────────────────────────────
const getMyCompletedOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      deliveryPartner: req.user._id,
      status: "delivered",
    };

    const orders = await Order.find(filter)
      .populate("user", "name phone address")
      .populate("laundryId", "name address phone")
      .populate("pickupAddress")
      .populate("deliveryAddress")
      .populate("services.service", "name price category estimatedHours")
      .sort({ deliveredAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Completed orders fetched successfully",
      data: {
        orders,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("getMyCompletedOrders error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching completed orders",
      error: error.message,
      data: {},
    });
  }
};

// ─────────────────────────────────────────────
// 6. @desc    Allowed: picked_up, out_for_delivery, delivered (delivered needs OTP verification)
//    @route   PUT /api/delivery/orders/:id/status
//    @access  Private/Delivery
// ─────────────────────────────────────────────
const updateDeliveryStatus = async (req, res) => {
  try {
    const { status, message } = req.body;
    const orderId = req.params.id;
    const laundryId = req.user.laundryId;

    const allowedStatuses = [
      "picked_up",
      "at_laundry_pending_confirmation",
      "out_for_delivery",
      "delivery_pending_customer_confirmation",
      "customer_unavailable",
      "returned_to_laundry",
      "delivered",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status for delivery partner. Allowed: ${allowedStatuses.join(", ")}`,
        data: {},
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: {},
      });
    }

    // Verify delivery partner is assigned
    if (order.deliveryPartner && order.deliveryPartner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied — This order is not assigned to you",
        data: {},
      });
    }

    if (status !== "picked_up" && !order.deliveryPartner) {
      return res.status(403).json({
        success: false,
        message: "Access denied — This order is not assigned to you",
        data: {},
      });
    }

    // Status Transition Checks
    const currentStatus = order.status;
    if (status === "picked_up") {
      // Must be online
      if (req.user.availabilityStatus === "offline" || req.user.isAvailable === false) {
        return res.status(400).json({
          success: false,
          message: "Delivery partner must be ONLINE to complete pickup.",
          data: {},
        });
      }

      // Mandatory Pickup Photo validation: pickup must not be marked complete if photo is missing
      if (!order.pickupPhoto || !order.pickupPhoto.url) {
        return res.status(400).json({
          success: false,
          message: "Pickup photo is required before marking order as picked up.",
          data: {},
        });
      }

      if (!["pending", "pending_pickup", "placed"].includes(currentStatus)) {
        return res.status(400).json({
          success: false,
          message: `Pickup can only occur from pending status. Current: ${currentStatus}`,
          data: {},
        });
      }
    } else if (status === "at_laundry_pending_confirmation") {
      if (currentStatus !== "picked_up") {
        return res.status(400).json({
          success: false,
          message: `Delivery to laundry requires order to be picked up first. Current: ${currentStatus}`,
          data: {},
        });
      }
    } else if (status === "out_for_delivery") {
      if (!["ready", "ready_for_redelivery"].includes(currentStatus)) {
        return res.status(400).json({
          success: false,
          message: `Order can only be picked up for delivery from 'ready' or 'ready_for_redelivery'. Current: ${currentStatus}`,
          data: {},
        });
      }
    } else if (status === "delivery_pending_customer_confirmation") {
      if (currentStatus !== "out_for_delivery") {
        return res.status(400).json({
          success: false,
          message: `Delivery arrival can only be marked while out for delivery. Current: ${currentStatus}`,
          data: {},
        });
      }
    } else if (status === "customer_unavailable") {
      if (!["out_for_delivery", "delivery_pending_customer_confirmation"].includes(currentStatus)) {
        return res.status(400).json({
          success: false,
          message: `Customer unavailable can only be marked during active delivery. Current: ${currentStatus}`,
          data: {},
        });
      }
    } else if (status === "returned_to_laundry") {
      if (!["out_for_delivery", "customer_unavailable"].includes(currentStatus)) {
        return res.status(400).json({
          success: false,
          message: `Return to laundry is only valid after customer unavailable or failed delivery attempt. Current: ${currentStatus}`,
          data: {},
        });
      }
    } else if (status === "delivered") {
      if (!["out_for_delivery", "delivery_pending_customer_confirmation"].includes(currentStatus)) {
        return res.status(400).json({
          success: false,
          message: `Delivered can only be confirmed from out for delivery or pending customer confirmation. Current: ${currentStatus}`,
          data: {},
        });
      }

      // If OTP provided, verify OTP; otherwise require customer confirmation
      const { otp } = req.body;
      if (otp) {
        return await verifyDeliveryOTPInternal(req, res, order, otp, message);
      } else {
        return res.status(400).json({
          success: false,
          message: "Delivered status requires customer delivery confirmation or delivery OTP verification.",
          data: {},
        });
      }
    }

    // Update fields object
    const updateFields = {
      status,
      $push: {
        trackingUpdates: {
          status,
          message: message || `Delivery partner updated status to ${status}`,
          timestamp: new Date(),
        },
      },
    };

    // If picking up from customer home (pending -> picked_up), assign partner
    if (status === "picked_up") {
      updateFields.deliveryPartner = req.user._id;
    }

    // Rule 1: Use findByIdAndUpdate instead of document.save()
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateFields, { new: true })
      .populate("user", "name phone address")
      .populate("deliveryPartner", "name phone")
      .populate("laundryId", "name address phone");

    // Socket.io status update notification
    const io = req.app.get("io");
    if (io) {
      io.to(orderId.toString()).emit("order:status_update", {
        orderId,
        status,
        message: message || `Order status updated to ${status}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error("updateDeliveryStatus error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message,
      data: {},
    });
  }
};

// ─────────────────────────────────────────────
// 7. @desc    Generate 4-digit OTP to confirm delivery
//    @route   POST /api/delivery/orders/:id/generate-otp
//    @access  Private/Delivery
// ─────────────────────────────────────────────
const generateDeliveryOTP = async (req, res) => {
  try {
    const orderId = req.params.id;
    const laundryId = req.user.laundryId;

    const order = await Order.findById(orderId).populate("user", "name phone");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: {},
      });
    }

    // Verify assigned partner
    if (!order.deliveryPartner || order.deliveryPartner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied — This order is not assigned to you",
        data: {},
      });
    }

    // Verify order is out for delivery or awaiting confirmation
    if (!["out_for_delivery", "delivery_pending_customer_confirmation"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "OTP can only be generated for orders that are out for delivery or awaiting confirmation",
        data: {},
      });
    }

    // Generate 4 digit OTP
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    // Rule 1: Use findByIdAndUpdate instead of document.save()
    await Order.findByIdAndUpdate(orderId, {
      deliveryOTP: otp,
      deliveryOTPExpiry: expiry,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV OTP] Delivery OTP for order #${order._id.toString().slice(-6).toUpperCase()}: ${otp}`);
    }

    // Send SMS to Customer
    const customerPhone = order.user?.phone;
    if (customerPhone) {
      const message = `Hello ${order.user.name || "Customer"}, your OTP for laundry order delivery is: ${otp}. Valid for 10 minutes.`;
      await sendSMS(customerPhone, message);
    }

    const responsePayload = {
      success: true,
      message: "Delivery OTP successfully generated and sent to customer phone",
      data: {},
    };

    // Dev mode helper so API client doesn't need console logs during testing
    if (process.env.NODE_ENV === "development") {
      responsePayload.data = { otp };
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("generateDeliveryOTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error generating OTP",
      error: error.message,
      data: {},
    });
  }
};

// ─────────────────────────────────────────────
// 8. @desc    Verify OTP and mark order as delivered
//    @route   POST /api/delivery/orders/:id/verify-otp
//    @access  Private/Delivery
// ─────────────────────────────────────────────
const verifyDeliveryOTP = async (req, res) => {
  try {
    const { otp, message } = req.body;
    const orderId = req.params.id;
    const laundryId = req.user.laundryId;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide an OTP to verify delivery",
        data: {},
      });
    }

    const order = await Order.findById(orderId).select("+deliveryOTP +deliveryOTPExpiry");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: {},
      });
    }

    // Verify assigned partner
    if (!order.deliveryPartner || order.deliveryPartner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied — This order is not assigned to you",
        data: {},
      });
    }

    // Verify order is out for delivery or awaiting confirmation
    if (!["out_for_delivery", "delivery_pending_customer_confirmation"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Order must be out for delivery or awaiting customer confirmation to verify OTP",
        data: {},
      });
    }

    return await verifyDeliveryOTPInternal(req, res, order, otp, message);
  } catch (error) {
    console.error("verifyDeliveryOTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error verifying OTP",
      error: error.message,
      data: {},
    });
  }
};

// Helper: Internal function to mark delivered and update partner earnings / laundry revenue
const markOrderDeliveredInternal = async (req, res, order, message) => {
  const updateFields = {
    status: "delivered",
    deliveredAt: new Date(),
    deliveryOTP: null, // clear OTP
    deliveryOTPExpiry: null, // clear Expiry
    $push: {
      trackingUpdates: {
        status: "delivered",
        message: message || "Order delivered successfully. Delivery confirmed.",
        timestamp: new Date(),
      },
    },
  };

  // If cash on delivery and not paid, mark paid
  if (order.paymentMethod === "cod" || order.paymentMethod === "cash") {
    updateFields.isPaid = true;
    updateFields.paidAt = new Date();
  }

  // Rule 1: Use findByIdAndUpdate instead of document.save()
  const updatedOrder = await Order.findByIdAndUpdate(order._id, updateFields, { new: true })
    .populate("user", "name phone address")
    .populate("deliveryPartner", "name phone")
    .populate("laundryId", "name address phone")
    .populate("pickupAddress")
    .populate("deliveryAddress");

  // Update Delivery Partner earnings and deliveries
  if (updatedOrder.deliveryPartner) {
    const laundry = await Laundry.findById(updatedOrder.laundryId).select("deliveryPartnerEarningPerOrder");
    const earning = laundry?.deliveryPartnerEarningPerOrder ?? 50;

    await User.findByIdAndUpdate(req.user._id, {
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
  }

  // Update Laundry revenue if paid
  if (updatedOrder.isPaid) {
    await Laundry.findByIdAndUpdate(updatedOrder.laundryId, {
      $inc: { totalRevenue: updatedOrder.laundryEarning },
    });
  }

  // Socket.io event for real-time update
  const io = req.app.get("io");
  if (io) {
    io.to(order._id.toString()).emit("order:status_update", {
      orderId: order._id,
      status: "delivered",
      message: message || "Order delivered successfully",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Order successfully delivered",
    data: updatedOrder,
  });
};

// Helper: Internal function to verify OTP and mark delivered
const verifyDeliveryOTPInternal = async (req, res, order, otp, message) => {
  // Check OTP correctness
  if (order.deliveryOTP !== otp) {
    return res.status(400).json({
      success: false,
      message: "Incorrect OTP, please try again",
      data: {},
    });
  }

  // Check Expiry
  if (new Date() > new Date(order.deliveryOTPExpiry)) {
    return res.status(400).json({
      success: false,
      message: "OTP has expired, please generate a new OTP",
      data: {},
    });
  }

  return await markOrderDeliveredInternal(req, res, order, message || "Order delivered successfully. OTP verified.");
};

// ─────────────────────────────────────────────
// 9. @desc    Earnings & work statistics of delivery partner
//    @route   GET /api/delivery/stats
//    @access  Private/Delivery
// ─────────────────────────────────────────────
const getMyStats = async (req, res) => {
  try {
    const partnerId = req.user._id;

    // Start of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Fetch partner user document with earnings & history
    const partner = await User.findById(partnerId).select("totalEarnings earningHistory totalDeliveries");
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner profile not found",
      });
    }

    // Promise.all to fetch counts & ratings in parallel
    const [
      todayCount,
      activeCount,
      pendingPickupCount,
      outForDeliveryCount,
      completedCount,
      todayAssignedCount,
      avgRatingResult,
    ] = await Promise.all([
      // Today delivered count
      Order.countDocuments({
        deliveryPartner: partnerId,
        status: "delivered",
        deliveredAt: { $gte: startOfToday },
      }),
      // Active orders count (pickups + out for delivery)
      Order.countDocuments({
        deliveryPartner: partnerId,
        status: { $in: ["pending", "picked_up", "ready", "out_for_delivery"] },
      }),
      // Pending pickup tasks
      Order.countDocuments({
        deliveryPartner: partnerId,
        status: { $in: ["pending", "picked_up"] },
      }),
      // Out for delivery tasks
      Order.countDocuments({
        deliveryPartner: partnerId,
        status: "out_for_delivery",
      }),
      // Total completed orders
      Order.countDocuments({
        deliveryPartner: partnerId,
        status: "delivered",
      }),
      // Today assigned tasks
      Order.countDocuments({
        deliveryPartner: partnerId,
        $or: [
          { createdAt: { $gte: startOfToday } },
          { updatedAt: { $gte: startOfToday } },
        ],
      }),
      // Average rating
      Order.aggregate([
        { $match: { deliveryPartner: partnerId, rating: { $exists: true, $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: "$rating" } } },
      ]),
    ]);

    // Check if single active delivery agent to compute accurate pickup counter
    const isOnline = req.user.availabilityStatus === "available" && req.user.isAvailable !== false;
    let isSingleActiveAgent = false;
    if (isOnline) {
      const activeDrivers = await User.find({
        role: "delivery",
        isActive: true,
        availabilityStatus: "available",
        isAvailable: { $ne: false },
      });
      isSingleActiveAgent = activeDrivers.length === 1 && activeDrivers[0]._id.toString() === req.user._id.toString();
    }

    const pickupStatuses = ["pending", "pending_pickup", "placed"];
    const pickupCount = await Order.countDocuments(
      isSingleActiveAgent
        ? { status: { $in: pickupStatuses }, $or: [{ deliveryPartner: partnerId }, { deliveryPartner: null }] }
        : { status: { $in: pickupStatuses }, deliveryPartner: partnerId }
    );

    const deliveryStatuses = [
      "picked_up",
      "at_laundry_pending_confirmation",
      "ready",
      "ready_for_delivery",
      "ready_for_redelivery",
      "out_for_delivery",
      "delivery_pending_customer_confirmation",
      "customer_unavailable",
      "returned_to_laundry",
    ];
    const deliveryCount = await Order.countDocuments({
      deliveryPartner: partnerId,
      status: { $in: deliveryStatuses },
    });

    // Calculate today's earnings from earningHistory
    const todayEarnings = (partner.earningHistory || [])
      .filter(entry => new Date(entry.date) >= startOfToday)
      .reduce((sum, entry) => sum + entry.amount, 0);

    // Get last 10 earnings history records
    const last10History = (partner.earningHistory || [])
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    const averageRating = avgRatingResult[0]?.avgRating ? parseFloat(avgRatingResult[0].avgRating.toFixed(2)) : 0;

    return res.status(200).json({
      success: true,
      message: "Delivery partner stats fetched successfully",
      data: {
        todayDeliveredCount: todayCount,
        totalEarnings: partner.totalEarnings || 0,
        todayEarnings,
        activeOrdersCount: activeCount,
        pendingPickupCount: pickupCount,
        pickupCount,
        outForDeliveryCount,
        deliveryCount,
        completedCount,
        todayAssignedCount: todayAssignedCount || activeCount + todayCount,
        totalDeliveries: partner.totalDeliveries || 0,
        averageRating,
        earningHistory: last10History,
      },
    });
  } catch (error) {
    console.error("getMyStats error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
      data: {},
    });
  }
};

// ─────────────────────────────────────────────
// 10. @desc    Update live location and notify customer
//     @route   POST /api/delivery/update-location
//     @access  Private/Delivery
// ─────────────────────────────────────────────
const updateLocation = async (req, res) => {
  try {
    const latVal = req.body.lat !== undefined ? req.body.lat : req.body.latitude;
    const lngVal = req.body.lng !== undefined ? req.body.lng : req.body.longitude;

    if (latVal === undefined || lngVal === undefined) {
      return res.status(400).json({
        success: false,
        message: "Both latitude and longitude are required",
        data: {},
      });
    }

    const latitude = Number(latVal);
    const longitude = Number(lngVal);

    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude (-90 to 90) and longitude (-180 to 180) must be valid numbers",
        data: {},
      });
    }

    // Rule 1: Use findByIdAndUpdate instead of document.save()
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        currentLocation: { lat: latitude, lng: longitude },
        lastSeen: new Date(),
      },
      { new: true }
    );

    // Find active orders being delivered by this partner (out_for_delivery status)
    const activeOrders = await Order.find({
      deliveryPartner: req.user._id,
      status: "out_for_delivery",
    });

    // Socket.io: Broadcast real-time location to customer rooms
    const io = req.app.get("io");
    if (io) {
      // 1. Broadcast to specific active order rooms
      activeOrders.forEach((order) => {
        io.to(order._id.toString()).emit("delivery:location_update", {
          orderId: order._id,
          deliveryPartnerId: req.user._id,
          location: { lat: latitude, lng: longitude },
        });
      });

      // 2. Broadcast globally for broad tracking utility
      io.emit("delivery:location_update", {
        deliveryPartnerId: req.user._id,
        location: { lat: latitude, lng: longitude },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Delivery partner location successfully updated",
      data: { lat: latitude, lng: longitude },
    });
  } catch (error) {
    console.error("updateLocation error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating location",
      error: error.message,
      data: {},
    });
  }
};

// ─────────────────────────────────────────────
// 11. @desc    Update delivery partner availability (offline, available, busy)
//     @route   PUT /api/delivery/availability
//     @access  Private/Delivery
// ─────────────────────────────────────────────
const updateAvailability = async (req, res) => {
  try {
    const { status, availabilityStatus } = req.body;
    const targetStatus = availabilityStatus || status;

    if (!["offline", "available", "busy"].includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed: offline, available, busy",
        data: {},
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        availabilityStatus: targetStatus,
        isAvailable: targetStatus === "available",
        lastSeen: new Date(),
      },
      { new: true }
    ).select("name email phone role availabilityStatus isAvailable lastSeen currentLocation");

    return res.status(200).json({
      success: true,
      message: `Availability status updated to ${targetStatus}`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("updateAvailability error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating availability status",
      error: error.message,
      data: {},
    });
  }
};

// ─────────────────────────────────────────────
// 12. @desc    Delivery partner creates a NEW pickup order from customer context
//     @route   POST /api/delivery/new-pickup
//     @access  Private/Delivery
// ─────────────────────────────────────────────
const createDeliveryPickupOrder = async (req, res) => {
  try {
    const { previousOrderId, services, specialInstructions, pickupAddressId } = req.body;

    // 1. Validation of required inputs
    if (!previousOrderId) {
      return res.status(400).json({
        success: false,
        message: "previousOrderId is required",
        data: {},
      });
    }

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please add at least one laundry item/service",
        data: {},
      });
    }

    // 2. Load previous order with customer & address context
    const previousOrder = await Order.findById(previousOrderId)
      .populate("user")
      .populate("pickupAddress")
      .populate("deliveryAddress");

    if (!previousOrder) {
      return res.status(404).json({
        success: false,
        message: "Previous order not found",
        data: {},
      });
    }

    // 3. Assignment ownership & authorization check
    // Driver MUST have been assigned to previousOrder
    if (
      !previousOrder.deliveryPartner ||
      previousOrder.deliveryPartner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied — This customer order was not assigned to you",
        data: {},
      });
    }

    // 4. Derive customer and laundry directly from previous order (never blindly trust client)
    const customerId = previousOrder.user?._id || previousOrder.user;
    const laundryId = previousOrder.laundryId?._id || previousOrder.laundryId;

    const laundry = await Laundry.findById(laundryId);
    if (!laundry) {
      return res.status(404).json({
        success: false,
        message: "Laundry not found",
        data: {},
      });
    }

    // 5. Validate service items and calculate totals
    const Service = require("../models/serviceModels");
    let totalAmount = 0;
    const serviceDetails = [];
    const estimatedHoursList = [];

    for (const item of services) {
      const serviceId = item.serviceId || item.service;
      const quantity = Number(item.quantity);

      if (!serviceId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid service ID and quantity (> 0)",
          data: {},
        });
      }

      const serviceDoc = await Service.findOne({
        _id: serviceId,
        laundryId,
        isActive: true,
      });

      if (!serviceDoc) {
        return res.status(400).json({
          success: false,
          message: `Service ID ${serviceId} is not valid or active for this laundry`,
          data: {},
        });
      }

      const lineTotal = serviceDoc.price * quantity;
      totalAmount += lineTotal;
      const hours = serviceDoc.estimatedHours || 24;
      estimatedHoursList.push(hours);

      serviceDetails.push({
        service: serviceDoc._id,
        quantity,
        price: serviceDoc.price,
        lineTotal,
        estimatedHours: hours,
      });
    }

    if (serviceDetails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please add at least one valid laundry item",
        data: {},
      });
    }

    // 6. Compute commission and delivery estimate
    const maxHours = Math.max(...estimatedHoursList, 24);
    const estimatedDelivery = new Date(Date.now() + maxHours * 60 * 60 * 1000);
    const commissionPercent = laundry.commissionPercent || 10;
    const commissionAmount = (totalAmount * commissionPercent) / 100;
    const laundryEarning = totalAmount - commissionAmount;

    // Address: use explicit pickupAddressId if provided, or fallback to previous order's address
    const resolvedAddress = pickupAddressId || previousOrder.deliveryAddress?._id || previousOrder.pickupAddress?._id || previousOrder.pickupAddress || previousOrder.deliveryAddress;

    // 7. Create brand new order (Status: picked_up, assigned to current driver, paymentMethod: cod)
    const newOrder = await Order.create({
      user: customerId,
      laundryId,
      services: serviceDetails,
      pickupAddress: resolvedAddress,
      deliveryAddress: resolvedAddress,
      totalAmount,
      commissionAmount,
      laundryEarning,
      isPaid: false,
      paymentMethod: "cod",
      status: "picked_up",
      deliveryPartner: req.user._id,
      estimatedDelivery,
      scheduledPickup: {
        date: new Date(),
        timeSlot: {
          startTime: "Immediate",
          endTime: "Immediate",
          label: "Direct Pickup on Delivery",
        },
      },
      specialInstructions: specialInstructions || "Direct pickup collected by delivery partner",
      trackingUpdates: [
        {
          status: "picked_up",
          message: "New pickup collected directly from customer by delivery partner",
          timestamp: new Date(),
        },
      ],
    });

    const populatedNewOrder = await Order.findById(newOrder._id)
      .populate("services.service", "name price category estimatedHours")
      .populate("user", "name phone email")
      .populate("deliveryPartner", "name phone")
      .populate("laundryId", "name address phone")
      .populate("pickupAddress")
      .populate("deliveryAddress");

    // Socket.io: Notify laundry admin of newly collected pickup
    const io = req.app.get("io");
    if (io) {
      io.to(laundryId.toString()).emit("order:new", {
        order: populatedNewOrder,
        message: "New pickup order collected directly from customer by delivery partner",
      });
    }

    return res.status(201).json({
      success: true,
      message: "New pickup order created successfully",
      data: populatedNewOrder,
    });
  } catch (error) {
    console.error("createDeliveryPickupOrder error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error creating new pickup order",
      error: error.message,
      data: {},
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW: @desc  Get ALL unassigned pending orders within 10 km of agent's location
//      @route GET /api/delivery/nearby-orders?lat=xx&lng=xx&radiusKm=10
//      @access Private/Delivery
// ─────────────────────────────────────────────────────────────────────────────
const getNearbyAvailableOrders = async (req, res) => {
  try {
    const agentLat = parseFloat(req.query.lat);
    const agentLng = parseFloat(req.query.lng);
    const radiusKm = parseFloat(req.query.radiusKm) || 10;

    // Fetch all unassigned pending orders (any laundry, not just agent's laundry)
    const candidateOrders = await Order.find({
      status: { $in: ["pending", "pending_pickup", "placed"] },
      deliveryPartner: null,
      isCancelled: { $ne: true },
    })
      .populate("user", "name phone")
      .populate("services.service", "name price")
      .populate("laundryId", "name address phone location")
      .sort({ createdAt: -1 })
      .limit(100);

    // If agent coordinates provided, filter by Haversine distance
    let filtered = candidateOrders;
    if (!isNaN(agentLat) && !isNaN(agentLng)) {
      const toRad = (deg) => (deg * Math.PI) / 180;
      const haversineKm = (lat1, lng1, lat2, lng2) => {
        const R = 6371; // Earth radius km
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      filtered = candidateOrders.filter((order) => {
        // Try pickup address snapshot coords first, fallback to laundry location
        const pickupLat =
          order.pickupAddressSnapshot?.coordinates?.lat ||
          order.laundryId?.location?.coordinates?.[1];
        const pickupLng =
          order.pickupAddressSnapshot?.coordinates?.lng ||
          order.laundryId?.location?.coordinates?.[0];

        if (!pickupLat || !pickupLng) return true; // include if no coords (can't filter)
        const dist = haversineKm(agentLat, agentLng, pickupLat, pickupLng);
        order._distanceKm = Math.round(dist * 10) / 10;
        return dist <= radiusKm;
      });

      // Sort nearest first
      filtered.sort((a, b) => (a._distanceKm || 0) - (b._distanceKm || 0));
    }

    // Attach distance to response
    const result = filtered.map((o) => {
      const plain = o.toObject();
      plain.distanceKm = o._distanceKm ?? null;
      return plain;
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      radiusKm,
      data: result,
    });
  } catch (error) {
    console.error("getNearbyAvailableOrders error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching nearby orders",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW: @desc  Delivery agent self-assigns an unassigned pending order
//      @route POST /api/delivery/self-assign/:orderId
//      @access Private/Delivery
// ─────────────────────────────────────────────────────────────────────────────
const selfAssignOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const agentId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Only allow self-assign on unassigned pending orders
    const allowedStatuses = ["pending", "pending_pickup", "placed"];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order status '${order.status}' is not eligible for self-assignment. Only pending orders can be self-assigned.`,
      });
    }

    if (order.deliveryPartner) {
      return res.status(400).json({
        success: false,
        message: "This order has already been assigned to a delivery partner.",
      });
    }

    // Assign agent
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        deliveryPartner: agentId,
        $push: {
          trackingUpdates: {
            status: order.status,
            message: `Delivery agent ${req.user.name || "Agent"} self-assigned this order for pickup.`,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    )
      .populate("user", "name phone address")
      .populate("laundryId", "name address phone")
      .populate("pickupAddress")
      .populate("deliveryAddress")
      .populate("services.service", "name price category estimatedHours");

    // Notify via socket
    const io = req.app.get("io");
    if (io) {
      io.to(orderId.toString()).emit("order:statusChanged", {
        orderId,
        status: updatedOrder.status,
        message: "A delivery agent has accepted your pickup request.",
        deliveryPartner: { name: req.user.name, phone: req.user.phone },
      });
      const laundryId = updatedOrder.laundryId?._id || updatedOrder.laundryId;
      if (laundryId) {
        io.to(`laundry:${laundryId.toString()}`).emit("order:assigned", {
          orderId,
          order: updatedOrder,
          deliveryPartner: { _id: agentId, name: req.user.name },
        });
      }
      io.to(`delivery:${agentId.toString()}`).emit("order:assigned", {
        orderId,
        order: updatedOrder,
        deliveryPartner: { _id: agentId, name: req.user.name },
      });
      io.emit("order:assigned", {
        orderId,
        order: updatedOrder,
        deliveryPartner: { _id: agentId, name: req.user.name },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order self-assigned successfully. You can now proceed with pickup.",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("selfAssignOrder error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error self-assigning order",
      error: error.message,
    });
  }
};

module.exports = {
  getAvailableOrders,
  acceptOrder,
  rejectOrder,
  getMyActiveOrders,
  getMyCompletedOrders,
  updateDeliveryStatus,
  generateDeliveryOTP,
  verifyDeliveryOTP,
  getMyStats,
  updateLocation,
  updateAvailability,
  createDeliveryPickupOrder,
  getNearbyAvailableOrders,
  selfAssignOrder,
};

