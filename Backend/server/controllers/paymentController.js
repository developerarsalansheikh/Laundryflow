const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/paymentModels");
const Order = require("../models/orderModels");
const Laundry = require("../models/laundryModels");
const { emitPaymentSuccess } = require("../socket/socketHandler");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────
// @desc    Razorpay order create karo
// @route   POST /api/payments/create-order
// @access  Private/User
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// @desc    Razorpay order create karo
// @route   POST /api/payments/create-order
// @access  Private/User
// ─────────────────────────────────────────────
const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Payment cannot be processed for a cancelled order",
      });
    }

    if (order.isPaid) {
      return res.status(400).json({
        success: false,
        message: "Payment for this order has already been completed",
      });
    }

    // Razorpay order create
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: "INR",
      receipt: `order_${order._id}`,
    });

    // Retrieve actual laundry commission rate to prevent schema default mismatch
    const Laundry = require("../models/laundryModels");
    const laundry = await Laundry.findById(order.laundryId);

    // Reuse existing pending payment record to prevent duplicate database entries
    let payment = await Payment.findOne({
      order: order._id,
      user: req.user._id,
      status: "pending",
    });

    if (payment) {
      payment.razorpayOrderId = razorpayOrder.id;
      payment.amount = order.totalAmount;
      payment.commissionPercent = laundry ? laundry.commissionPercent : 10;
      payment.commissionAmount = order.commissionAmount;
      payment.laundryEarning = order.laundryEarning;
      await payment.save();
    } else {
      payment = await Payment.create({
        order: order._id,
        user: req.user._id,
        laundryId: order.laundryId,
        amount: order.totalAmount,
        commissionPercent: laundry ? laundry.commissionPercent : 10,
        commissionAmount: order.commissionAmount,
        laundryEarning: order.laundryEarning,
        razorpayOrderId: razorpayOrder.id,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        amountInRupees: order.totalAmount,
        currency: razorpayOrder.currency,
        paymentId: payment._id,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("CreatePaymentOrder error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create payment order. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Payment verify karo
// @route   POST /api/payments/verify
// @access  Private/User
// ─────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ✅ FIX 1: Payment record DB se fetch karo (matches orderId & user to prevent verification spoofing)
    const payment = await Payment.findOne({
      razorpayOrderId,
      order: orderId,
      user: req.user._id,
    });

    if (!payment) {
      return res.status(400).json({
        success: false,
        message: "Payment record not found or unauthorized access",
      });
    }

    // ✅ FIX 2: Already verified check (Idempotent rejection)
    if (payment.status === "success") {
      return res.status(400).json({
        success: false,
        message: "Payment is already verified",
      });
    }

    // ✅ FIX 3: Signature verify karo
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      await Payment.findByIdAndUpdate(payment._id, { status: "failed" });

      return res.status(400).json({
        success: false,
        message: "Payment verification failed: signature does not match",
      });
    }

    // ✅ FIX 4: Amount verify karo Razorpay se to prevent request tampering
    try {
      const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);
      const expectedAmount = Math.round(payment.amount * 100); // in paise

      if (razorpayPayment && razorpayPayment.amount !== expectedAmount) {
        await Payment.findByIdAndUpdate(payment._id, { status: "failed" });

        return res.status(400).json({
          success: false,
          message: "Payment amount mismatch — tampered payment detected",
        });
      }
    } catch (apiErr) {
      if (process.env.NODE_ENV === "production") {
        await Payment.findByIdAndUpdate(payment._id, { status: "failed" });
        return res.status(400).json({
          success: false,
          message: "Payment verification failed with payment gateway: " + apiErr.message,
        });
      }
    }

    // ✅ Payment success update
    await Payment.findByIdAndUpdate(payment._id, {
      razorpayPaymentId,
      razorpaySignature,
      status: "success",
    });

    // Order paid mark karo
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        isPaid: true,
        paidAt: new Date(),
        $push: {
          trackingUpdates: {
            status: "pending",
            message: "Payment successful",
          },
        },
      },
      { new: true }
    );

    // ✅ FIX 5: Post-paid/COD laundry revenue adjustment
    const Laundry = require("../models/laundryModels");
    if (order.status === "delivered") {
      await Laundry.findByIdAndUpdate(order.laundryId, {
        $inc: { totalRevenue: order.laundryEarning },
      });
    }

    // Trigger notification asynchronously
    const { notifyPaymentSuccess } = require("../services/notificationService");
    notifyPaymentSuccess(payment, order).catch(err =>
      console.error("Payment success notification failed:", err.message)
    );

    // Trigger Socket.io payment success to customer
    emitPaymentSuccess(order.user, payment);

    return res.status(200).json({
      success: true,
      message: "Payment successful. Order confirmed.",
    });
  } catch (error) {
    console.error("VerifyPayment error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to verify payment. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Payment details dekho
// @route   GET /api/payments/:orderId
// @access  Private
// ─────────────────────────────────────────────
const getPaymentByOrder = async (req, res) => {
  try {
    const payment = await Payment.findOne({ order: req.params.orderId })
      .populate("order", "totalAmount status isPaid")
      .populate("user", "name phone")
      .populate("laundryId", "name city");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    if (
      req.user.role === "user" &&
      payment.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("GetPaymentByOrder error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment details. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Apni laundry ke payments dekho (Admin)
// @route   GET /api/payments
// @access  Private/Admin/SuperAdmin
// ─────────────────────────────────────────────
const getAllPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    // Admin sirf apni laundry ke payments dekhe
    if (req.user.role === "admin") {
      filter.laundryId = req.user.laundryId;
    }

    const payments = await Payment.find(filter)
      .populate("order", "totalAmount status")
      .populate("user", "name phone")
      .populate("laundryId", "name city")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Payment.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: payments.length,
      total,
      pages: Math.ceil(total / limit),
      data: payments,
    });
  } catch (error) {
    console.error("GetAllPayments error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch payments. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Admin/Delivery partner COD payment confirm kare
// @route   PUT /api/payments/confirm-cod/:orderId
// @access  Private
// ─────────────────────────────────────────────
const confirmCODPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Auth check: Admin or Delivery Partner assigned to this order
    const isLaundryAdmin = req.user.role === "admin" && order.laundryId.toString() === req.user.laundryId.toString();
    const isAssignedDelivery = req.user.role === "delivery" && order.deliveryPartner?.toString() === req.user._id.toString();

    if (!isLaundryAdmin && !isAssignedDelivery) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You cannot confirm payment for this order",
      });
    }

    if (order.paymentMethod !== "cod") {
      return res.status(400).json({
        success: false,
        message: "This is not a COD order",
      });
    }

    if (order.isPaid) {
      return res.status(400).json({
        success: false,
        message: "Payment is already confirmed",
      });
    }

    // Mark order as paid
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        isPaid: true,
        paidAt: new Date(),
        $push: {
          trackingUpdates: {
            status: order.status,
            message: "COD payment confirmed",
          },
        },
      },
      { new: true }
    );

    // Retrieve laundry details for commission rates
    const Laundry = require("../models/laundryModels");
    const laundry = await Laundry.findById(order.laundryId);

    // Create payment record
    const payment = await Payment.create({
      order: order._id,
      user: order.user,
      laundryId: order.laundryId,
      amount: order.totalAmount,
      currency: "INR",
      commissionPercent: laundry ? laundry.commissionPercent : 10,
      commissionAmount: order.commissionAmount,
      laundryEarning: order.laundryEarning,
      status: "success",
      method: "cod",
    });

    // Update laundry revenue
    await Laundry.findByIdAndUpdate(order.laundryId, {
      $inc: { totalRevenue: order.laundryEarning },
    });

    return res.status(200).json({
      success: true,
      message: "COD payment confirmed successfully",
      data: {
        order: updatedOrder,
        payment,
      },
    });
  } catch (error) {
    console.error("ConfirmCODPayment error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to confirm COD payment. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Admin/SuperAdmin Razorpay refund initiate kare
// @route   POST /api/payments/refund/:orderId
// @access  Private/Admin
// ─────────────────────────────────────────────
const initiateRefund = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied — only admins can initiate refunds",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.status !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Refunds can only be initiated for cancelled orders",
      });
    }

    if (!order.isPaid) {
      return res.status(400).json({
        success: false,
        message: "This order was not paid; refund cannot be processed",
      });
    }

    if (order.paymentMethod === "cod") {
      return res.status(400).json({
        success: false,
        message: "COD orders cannot be refunded online",
      });
    }

    const payment = await Payment.findOne({ order: orderId, status: "success" });
    if (!payment || !payment.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: "Successful payment record not found for this order",
      });
    }

    if (payment.refundStatus === "processed") {
      return res.status(400).json({
        success: false,
        message: "Refund has already been processed",
      });
    }

    const refundAmountInput = req.body.amount ? Number(req.body.amount) : payment.amount;
    const isFullRefund = (payment.refundAmount || 0) + refundAmountInput >= payment.amount;

    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: refundAmountInput * 100, // paise mein
    });

    const refundAmount = refund.amount / 100;
    const totalRefunded = (payment.refundAmount || 0) + refundAmount;

    const updatedPayment = await Payment.findByIdAndUpdate(
      payment._id,
      {
        refundId: refund.id,
        refundAmount: totalRefunded,
        refundStatus: "processed",
        refundedAt: new Date(),
        status: isFullRefund ? "refunded" : "success",
      },
      { new: true }
    );

    await Order.findByIdAndUpdate(orderId, {
      refundAmount: (order.refundAmount || 0) + refundAmount,
      refundStatus: "processed",
      refundedAt: new Date(),
      ...(isFullRefund ? { status: "cancelled" } : {}),
      $push: {
        trackingUpdates: {
          status: isFullRefund ? "cancelled" : order.status,
          message: `Refund processed: ₹${refundAmount} (${refund.id})`,
        },
      },
    });

    // Authoritative decrement of Laundry.totalRevenue (deduct exactly once)
    if (payment.laundryId) {
      const laundry = await Laundry.findById(payment.laundryId);
      if (laundry) {
        const reverseAmount = isFullRefund ? payment.laundryEarning : refundAmount;
        laundry.totalRevenue = Math.max(0, (laundry.totalRevenue || 0) - reverseAmount);
        await laundry.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Refund initiated successfully",
      data: updatedPayment,
    });
  } catch (error) {
    console.error("InitiateRefund error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to initiate refund. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// @desc    Razorpay webhook signature verification aur status updates
// @route   POST /api/payments/webhook
// @access  Public (Razorpay call)
// ─────────────────────────────────────────────
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature missing",
      });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "laundry_secret_123";

    // Verify against both req.rawBody and JSON stringified body
    const rawData = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body);
    const expectedSignatureRaw = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawData)
      .digest("hex");
    const expectedSignatureJson = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (signature !== expectedSignatureRaw && signature !== expectedSignatureJson) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = req.body.event;
    const eventId =
      req.body.event_id ||
      req.body.id ||
      `${event}_${req.body.payload?.payment?.entity?.id || req.body.payload?.order?.entity?.id || req.body.payload?.refund?.entity?.id || Date.now()}`;

    // 1. Payment Captured / Order Paid
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = req.body.payload?.payment?.entity || {};
      const orderEntity = req.body.payload?.order?.entity || {};
      const razorpayPaymentId = paymentEntity.id;
      const razorpayOrderId = paymentEntity.order_id || orderEntity.id;

      let payment = await Payment.findOne({
        $or: [
          { razorpayPaymentId: razorpayPaymentId },
          { razorpayOrderId: razorpayOrderId },
        ],
      });

      if (payment) {
        // Idempotency: skip if already processed or already verified
        const alreadyProcessed = payment.webhookEvents?.some((e) => e.eventId === eventId);
        if (alreadyProcessed || payment.status === "success") {
          return res.status(200).json({ status: "ok", message: "Event already processed" });
        }

        payment.status = "success";
        if (razorpayPaymentId) payment.razorpayPaymentId = razorpayPaymentId;
        if (!payment.webhookEvents) payment.webhookEvents = [];
        payment.webhookEvents.push({ eventId, eventType: event });
        await payment.save();

        const order = await Order.findByIdAndUpdate(
          payment.order,
          {
            isPaid: true,
            paidAt: new Date(),
            $push: {
              trackingUpdates: {
                status: "pending",
                message: `Payment verified via webhook (${event})`,
              },
            },
          },
          { new: true }
        );

        const { notifyPaymentSuccess } = require("../services/notificationService");
        notifyPaymentSuccess(payment, order).catch((err) =>
          console.error("Webhook payment success notification failed:", err.message)
        );

        emitPaymentSuccess(order.user, payment);
      }
    }

    // 2. Payment Failed
    else if (event === "payment.failed") {
      const paymentEntity = req.body.payload?.payment?.entity || {};
      const razorpayPaymentId = paymentEntity.id;
      const razorpayOrderId = paymentEntity.order_id;

      let payment = await Payment.findOne({
        $or: [
          { razorpayPaymentId: razorpayPaymentId },
          { razorpayOrderId: razorpayOrderId },
        ],
      });

      if (payment) {
        const alreadyProcessed = payment.webhookEvents?.some((e) => e.eventId === eventId);
        if (alreadyProcessed) {
          return res.status(200).json({ status: "ok", message: "Event already processed" });
        }

        if (payment.status !== "success") {
          payment.status = "failed";
          if (!payment.webhookEvents) payment.webhookEvents = [];
          payment.webhookEvents.push({ eventId, eventType: event });
          await payment.save();
        }
      }
    }

    // 3. Refund Processed
    else if (event === "refund.processed") {
      const payload = req.body.payload?.refund?.entity || {};
      const paymentId = payload.payment_id;
      const refundId = payload.id;
      const amount = payload.amount / 100;

      const payment = await Payment.findOne({ razorpayPaymentId: paymentId });
      if (payment) {
        const alreadyProcessed = payment.webhookEvents?.some((e) => e.eventId === eventId);
        if (alreadyProcessed || payment.refundStatus === "processed") {
          return res.status(200).json({ status: "ok", message: "Refund already processed" });
        }

        payment.refundId = refundId;
        payment.refundAmount = amount;
        payment.refundStatus = "processed";
        payment.refundedAt = new Date();
        const isFullRefund = amount >= payment.amount;
        if (isFullRefund) payment.status = "refunded";
        if (!payment.webhookEvents) payment.webhookEvents = [];
        payment.webhookEvents.push({ eventId, eventType: event });
        await payment.save();

        await Order.findByIdAndUpdate(payment.order, {
          refundAmount: amount,
          refundStatus: "processed",
          refundedAt: new Date(),
          ...(isFullRefund ? { status: "cancelled" } : {}),
          $push: {
            trackingUpdates: {
              status: isFullRefund ? "cancelled" : "in_progress",
              message: `Razorpay webhook refund processed: ${refundId}`,
            },
          },
        });

        // Authoritative decrement of Laundry.totalRevenue (deduct exactly once)
        if (payment.laundryId) {
          const laundry = await Laundry.findById(payment.laundryId);
          if (laundry) {
            const reverseAmount = isFullRefund ? payment.laundryEarning : amount;
            laundry.totalRevenue = Math.max(0, (laundry.totalRevenue || 0) - reverseAmount);
            await laundry.save();
          }
        }
      }
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Razorpay webhook error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Webhook error",
      error: error.message,
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentByOrder,
  getAllPayments,
  confirmCODPayment,
  initiateRefund,
  handleWebhook,
};
