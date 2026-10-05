/**
 * notificationService.js
 * Centralized notification service for LaundryFlow.
 *
 * Supports:
 *  - Firebase Admin SDK (FCM) push notifications
 *  - In-app notifications (MongoDB)
 *  - Email (Nodemailer / Gmail)
 *  - SMS (Twilio — production only)
 *
 * IMPORTANT:
 *  - FCM failures are always non-blocking (never crash the caller).
 *  - FCM tokens are trimmed and de-duplicated automatically.
 *  - Invalid/expired tokens are pruned silently.
 *  - No private keys or full tokens are ever logged.
 */

// ─────────────────────────────────────────────
// Notification Type Constants
// ─────────────────────────────────────────────
const NOTIFICATION_TYPES = {
  ORDER_PLACED: "ORDER_PLACED",
  ORDER_ACCEPTED: "ORDER_ACCEPTED",
  ORDER_REJECTED: "ORDER_REJECTED",
  PICKUP_SCHEDULED: "PICKUP_SCHEDULED",
  PICKUP_COMPLETED: "PICKUP_COMPLETED",
  HANDOFF_TO_LAUNDRY: "HANDOFF_TO_LAUNDRY",
  LAUNDRY_RECEIVED: "LAUNDRY_RECEIVED",
  ORDER_PROCESSING: "ORDER_PROCESSING",
  ORDER_READY: "ORDER_READY",
  READY_FOR_REDELIVERY: "READY_FOR_REDELIVERY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERY_PENDING_CONFIRMATION: "DELIVERY_PENDING_CONFIRMATION",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  CUSTOMER_UNAVAILABLE: "CUSTOMER_UNAVAILABLE",
  RETURNED_TO_LAUNDRY: "RETURNED_TO_LAUNDRY",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  DELIVERY_ASSIGNED: "DELIVERY_ASSIGNED",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  SYSTEM: "SYSTEM",
};

// ─────────────────────────────────────────────
// Firebase Admin SDK — lazy initialized
// ─────────────────────────────────────────────
let _firebaseAdmin = null;

const getFirebaseAdmin = () => {
  if (_firebaseAdmin) return _firebaseAdmin;
  try {
    _firebaseAdmin = require("../config/firebase");
    console.log("[FCM] Firebase Admin SDK loaded successfully");
  } catch (err) {
    console.error("[FCM] Firebase Admin SDK could not be loaded:", err.message);
    _firebaseAdmin = null;
  }
  return _firebaseAdmin;
};

// ─────────────────────────────────────────────
// sendSMS — Multi-gateway dispatcher (Fast2SMS / 2Factor / Twilio)
// ─────────────────────────────────────────────
const { sendSMS: unifiedSendSMS } = require("./smsService");
const sendSMS = async (phone, message) => {
  return await unifiedSendSMS(phone, message);
};

// ─────────────────────────────────────────────
// sendEmail — Nodemailer / Gmail
// ─────────────────────────────────────────────
const sendEmail = async (email, subject, html) => {
  if (
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
  ) {
    try {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      await transporter.sendMail({
        from: `"LaundryApp" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html,
      });
      console.log(`[Email] Sent to ${email.split("@")[0]}@...`);
    } catch (err) {
      console.error("[Email] Nodemailer error:", err.message);
    }
  } else {
    console.log("\n--- [Email-DEV] ---");
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log("-------------------\n");
  }
};

// ─────────────────────────────────────────────
// _sendFCMToToken — send a single FCM message via Firebase Admin SDK
// Returns: { success: boolean, invalid: boolean }
// ─────────────────────────────────────────────
const _sendFCMToToken = async (token, title, body, data = {}) => {
  const admin = getFirebaseAdmin();
  if (!admin) return { success: false, invalid: false };

  try {
    // Convert all data values to strings (FCM requirement)
    const stringData = {};
    for (const [k, v] of Object.entries(data)) {
      stringData[k] = String(v ?? "");
    }

    let messagingInstance = null;
    try {
      const { getMessaging } = require("firebase-admin/messaging");
      messagingInstance = getMessaging();
    } catch (_) {
      if (typeof admin.messaging === "function") {
        messagingInstance = admin.messaging();
      }
    }

    if (!messagingInstance) {
      return { success: false, invalid: false };
    }

    await messagingInstance.send({
      token,
      notification: { title, body },
      data: stringData,
      android: {
        priority: "high",
        notification: { sound: "default", clickAction: "FLUTTER_NOTIFICATION_CLICK" },
      },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
    });
    return { success: true, invalid: false };
  } catch (err) {
    const invalidCodes = [
      "messaging/invalid-registration-token",
      "messaging/registration-token-not-registered",
      "messaging/invalid-argument",
    ];
    const isInvalid = invalidCodes.some((c) => err.code === c);
    // Only log token prefix, never full token
    console.error(
      `[FCM] Failed for token ${token.slice(0, 8)}...: ${err.message}`
    );
    return { success: false, invalid: isInvalid };
  }
};

// ─────────────────────────────────────────────
// sendPushNotification — Core FCM + in-app notification
// userId: Mongoose ObjectId or string
// ─────────────────────────────────────────────
const sendPushNotification = async (userId, title, message, data = {}) => {
  try {
    const User = require("../models/userModels");
    const Notification = require("../models/notificationModels");

    const user = await User.findById(userId);
    if (!user) {
      console.error(`[Push] User not found: ${userId}`);
      return;
    }

    // ── Save in-app notification (always, dev + prod) ──
    await Notification.create({
      user: userId,
      title,
      message,
      type: _mapToInAppType(data?.notificationType || data?.type),
      orderId: data?.orderId || null,
    });

    // ── Collect unique FCM tokens ──
    const tokenSet = new Set();
    if (user.fcmToken) tokenSet.add(user.fcmToken.trim());
    if (Array.isArray(user.deviceTokens)) {
      user.deviceTokens.forEach((dt) => {
        if (dt?.token) tokenSet.add(dt.token.trim());
      });
    }
    const tokens = Array.from(tokenSet);

    if (tokens.length === 0) {
      console.log(
        `[Push-DEV] No FCM tokens for user ${user.name}. Title: "${title}" | ${message}`
      );
      return;
    }

    const admin = getFirebaseAdmin();
    if (!admin) {
      // Dev fallback: log the notification
      console.log("\n--- [Push-DEV] ---");
      console.log(`User: ${user.name} | Tokens: ${tokens.length}`);
      console.log(`Title: ${title}`);
      console.log(`Body: ${message}`);
      console.log(`Data: ${JSON.stringify(data)}`);
      console.log("------------------\n");
      return;
    }

    // ── Send to all tokens, collect invalid ones ──
    const tokensToPrune = [];
    for (const token of tokens) {
      const result = await _sendFCMToToken(token, title, message, {
        ...data,
        notificationType: data?.notificationType || data?.type || NOTIFICATION_TYPES.SYSTEM,
      });
      if (result.invalid) {
        tokensToPrune.push(token);
      }
    }

    // ── Prune invalid tokens ──
    if (tokensToPrune.length > 0) {
      user.deviceTokens = (user.deviceTokens || []).filter(
        (dt) => !tokensToPrune.includes(dt.token)
      );
      if (tokensToPrune.includes(user.fcmToken)) {
        user.fcmToken =
          user.deviceTokens.length > 0 ? user.deviceTokens[0].token : null;
      }
      await user.save();
      console.log(
        `[FCM] Pruned ${tokensToPrune.length} invalid token(s) for user ${userId}`
      );
    }
  } catch (err) {
    console.error("[sendPushNotification] Error:", err.message);
  }
};

// Map notification type to Notification model enum
const _mapToInAppType = (type) => {
  const typeStr = String(type || "").toUpperCase();
  if (typeStr.includes("ORDER") || typeStr.includes("PICKUP") || typeStr.includes("DELIVERY")) {
    return "order";
  }
  if (typeStr.includes("PAYMENT")) return "payment";
  if (typeStr === "DELIVERY_ASSIGNED") return "delivery";
  return "system";
};

// ─────────────────────────────────────────────
// sendNotificationToUser — alias with named args
// ─────────────────────────────────────────────
const sendNotificationToUser = async (userId, title, body, data = {}) => {
  return sendPushNotification(userId, title, body, data);
};

// ─────────────────────────────────────────────
// sendNotificationToUsers — batch notify multiple users
// ─────────────────────────────────────────────
const sendNotificationToUsers = async (userIds, title, body, data = {}) => {
  if (!Array.isArray(userIds) || userIds.length === 0) return;
  // Fire all notifications concurrently; individual failures are isolated
  await Promise.allSettled(
    userIds.map((uid) => sendPushNotification(uid, title, body, data))
  );
};

// Legacy alias — used by some controllers
const sendNotification = async ({ userId, title, body, data = {} }) => {
  return sendPushNotification(userId, title, body, data);
};

// ─────────────────────────────────────────────
// notifyOrderPlaced
// ─────────────────────────────────────────────
const notifyOrderPlaced = async (order) => {
  try {
    const Order = require("../models/orderModels");
    const User = require("../models/userModels");
    const Laundry = require("../models/laundryModels");

    let orderDoc = order;
    if (!order.user || !order.laundryId) {
      orderDoc = await Order.findById(order._id);
    }
    if (!orderDoc) return;

    const [customer, laundry] = await Promise.all([
      User.findById(orderDoc.user),
      Laundry.findById(orderDoc.laundryId),
    ]);
    const admin = laundry ? await User.findById(laundry.owner) : null;
    const orderIdStr = orderDoc._id.toString();
    const shortId = orderIdStr.slice(-6).toUpperCase();

    if (customer) {
      await sendSMS(customer.phone, `Your LaundryApp order #${shortId} has been placed!`);
      await sendPushNotification(
        customer._id,
        "Order Placed! 🧺",
        `Your order #${shortId} has been placed successfully.`,
        { notificationType: NOTIFICATION_TYPES.ORDER_PLACED, orderId: orderIdStr }
      );
    }

    if (admin) {
      await sendSMS(admin.phone, `New order #${shortId} received on LaundryApp!`);
      await sendPushNotification(
        admin._id,
        "New Order Received! 📦",
        `A new order #${shortId} is waiting for your confirmation.`,
        { notificationType: NOTIFICATION_TYPES.ORDER_PLACED, orderId: orderIdStr }
      );
    }
  } catch (err) {
    console.error("[notifyOrderPlaced]", err.message);
  }
};

// ─────────────────────────────────────────────
// notifyOrderAccepted — admin accepts the order
// ─────────────────────────────────────────────
const notifyOrderAccepted = async (order) => {
  try {
    const Order = require("../models/orderModels");
    const User = require("../models/userModels");

    let orderDoc = order;
    if (!order.user) orderDoc = await Order.findById(order._id);
    if (!orderDoc) return;

    const customer = await User.findById(orderDoc.user);
    const shortId = orderDoc._id.toString().slice(-6).toUpperCase();

    if (customer) {
      await sendSMS(customer.phone, `Great news! Your order #${shortId} has been accepted.`);
      await sendPushNotification(
        customer._id,
        "Order Accepted ✅",
        `Your order #${shortId} has been accepted and is being prepared for pickup.`,
        { notificationType: NOTIFICATION_TYPES.ORDER_ACCEPTED, orderId: orderDoc._id.toString() }
      );
    }
  } catch (err) {
    console.error("[notifyOrderAccepted]", err.message);
  }
};

// ─────────────────────────────────────────────
// notifyOrderRejected — admin rejects the order
// ─────────────────────────────────────────────
const notifyOrderRejected = async (order, reason = "") => {
  try {
    const Order = require("../models/orderModels");
    const User = require("../models/userModels");

    let orderDoc = order;
    if (!order.user) orderDoc = await Order.findById(order._id);
    if (!orderDoc) return;

    const customer = await User.findById(orderDoc.user);
    const shortId = orderDoc._id.toString().slice(-6).toUpperCase();
    const msg = `Your order #${shortId} was rejected.${reason ? " Reason: " + reason : ""}`;

    if (customer) {
      await sendSMS(customer.phone, msg);
      await sendPushNotification(
        customer._id,
        "Order Rejected ❌",
        msg,
        { notificationType: NOTIFICATION_TYPES.ORDER_REJECTED, orderId: orderDoc._id.toString() }
      );
    }
  } catch (err) {
    console.error("[notifyOrderRejected]", err.message);
  }
};

// ─────────────────────────────────────────────
// notifyOrderStatusUpdate — comprehensive multi-role handoff notifications
// ─────────────────────────────────────────────
const notifyOrderStatusUpdate = async (order, newStatus) => {
  try {
    const Order = require("../models/orderModels");
    const User = require("../models/userModels");
    const Laundry = require("../models/laundryModels");

    let orderDoc = order;
    if (!order.user || !order.laundryId) {
      orderDoc = await Order.findById(order._id);
    }
    if (!orderDoc) return;

    const shortId = orderDoc._id.toString().slice(-6).toUpperCase();
    const orderId = orderDoc._id.toString();

    const [customer, laundry, driver] = await Promise.all([
      orderDoc.user?._id ? orderDoc.user : User.findById(orderDoc.user),
      orderDoc.laundryId?.owner ? orderDoc.laundryId : Laundry.findById(orderDoc.laundryId),
      orderDoc.deliveryPartner
        ? (orderDoc.deliveryPartner._id ? orderDoc.deliveryPartner : User.findById(orderDoc.deliveryPartner))
        : null,
    ]);

    const admin = laundry?.owner ? await User.findById(laundry.owner) : null;
    const driverName = driver?.name || "Delivery Partner";
    const driverPhone = driver?.phone || "";

    // 1. picked_up
    if (newStatus === "picked_up") {
      if (customer) {
        await sendSMS(customer.phone, `Your clothes for Order #${shortId} have been picked up and are on the way to the laundry!`);
        await sendPushNotification(customer._id, "Pickup Complete 🚗", "Your clothes have been picked up and are on the way to the laundry!", {
          notificationType: NOTIFICATION_TYPES.PICKUP_COMPLETED,
          orderId,
          status: newStatus,
        });
      }
      if (admin) {
        await sendPushNotification(admin._id, "Driver Picked Up Order 📦", `Driver has picked up Order #${shortId} and is bringing it to your laundry.`, {
          notificationType: NOTIFICATION_TYPES.PICKUP_COMPLETED,
          orderId,
          status: newStatus,
        });
      }
      if (driver) {
        await sendPushNotification(driver._id, "Laundry Handoff Required 🏬", `Please hand over Order #${shortId} to ${laundry?.name || "the laundry"}.`, {
          notificationType: NOTIFICATION_TYPES.HANDOFF_TO_LAUNDRY,
          orderId,
          status: newStatus,
        });
      }
    }

    // 2. at_laundry_pending_confirmation
    else if (newStatus === "at_laundry_pending_confirmation") {
      if (admin) {
        await sendPushNotification(admin._id, "Driver Delivered to Laundry 🏬", `Delivery Partner has delivered Order #${shortId} to your laundry. Please confirm received.`, {
          notificationType: NOTIFICATION_TYPES.HANDOFF_TO_LAUNDRY,
          orderId,
          status: newStatus,
        });
      }
      if (customer) {
        await sendPushNotification(customer._id, "Arrived at Laundry 🏬", `Your clothes for Order #${shortId} have reached the laundry store.`, {
          notificationType: NOTIFICATION_TYPES.HANDOFF_TO_LAUNDRY,
          orderId,
          status: newStatus,
        });
      }
    }

    // 3. received_at_laundry
    else if (newStatus === "received_at_laundry") {
      if (customer) {
        await sendPushNotification(customer._id, "Received at Laundry ✅", `Your clothes for Order #${shortId} are confirmed received at the laundry. Processing will begin shortly.`, {
          notificationType: NOTIFICATION_TYPES.LAUNDRY_RECEIVED,
          orderId,
          status: newStatus,
        });
      }
      if (admin) {
        await sendPushNotification(admin._id, "Order Confirmed Received", `Order #${shortId} confirmed. Ready to start processing.`, {
          notificationType: NOTIFICATION_TYPES.LAUNDRY_RECEIVED,
          orderId,
          status: newStatus,
        });
      }
    }

    // 4. in_progress / processing
    else if (newStatus === "in_progress") {
      if (customer) {
        await sendSMS(customer.phone, `Your clothes for Order #${shortId} are now being washed and processed.`);
        await sendPushNotification(customer._id, "Washing Started 🫧", "Your clothes are being washed and processed.", {
          notificationType: NOTIFICATION_TYPES.ORDER_PROCESSING,
          orderId,
          status: newStatus,
        });
      }
    }

    // 5. ready
    else if (newStatus === "ready") {
      if (customer) {
        await sendPushNotification(customer._id, "Order Ready ✨", "Your clothes are clean, packed, and ready for delivery!", {
          notificationType: NOTIFICATION_TYPES.ORDER_READY,
          orderId,
          status: newStatus,
        });
      }
      if (admin) {
        await sendPushNotification(admin._id, "Order Ready for Dispatch 📦", `Order #${shortId} is ready. Please assign a delivery partner.`, {
          notificationType: NOTIFICATION_TYPES.ORDER_READY,
          orderId,
          status: newStatus,
        });
      }
    }

    // 6. ready_for_redelivery
    else if (newStatus === "ready_for_redelivery") {
      if (customer) {
        await sendPushNotification(customer._id, "Order Scheduled for Redelivery 🛵", `Order #${shortId} has been rescheduled for next-day delivery.`, {
          notificationType: NOTIFICATION_TYPES.READY_FOR_REDELIVERY,
          orderId,
          status: newStatus,
        });
      }
      if (admin) {
        await sendPushNotification(admin._id, "Redelivery Ready 🛵", `Order #${shortId} is ready for redelivery. Please assign a delivery partner.`, {
          notificationType: NOTIFICATION_TYPES.READY_FOR_REDELIVERY,
          orderId,
          status: newStatus,
        });
      }
    }

    // 7. out_for_delivery
    else if (newStatus === "out_for_delivery") {
      const driverInfo = driverName ? ` Driver: ${driverName}${driverPhone ? ` (${driverPhone})` : ""}` : "";
      if (customer) {
        await sendSMS(customer.phone, `Your laundry Order #${shortId} is out for delivery!${driverInfo}`);
        await sendPushNotification(customer._id, "Out for Delivery 🛵", `Your fresh laundry is on its way to you!${driverInfo}`, {
          notificationType: NOTIFICATION_TYPES.OUT_FOR_DELIVERY,
          orderId,
          status: newStatus,
          driverName,
          driverPhone,
        });
      }
    }

    // 8. delivery_pending_customer_confirmation
    else if (newStatus === "delivery_pending_customer_confirmation") {
      if (customer) {
        await sendSMS(customer.phone, `Your laundry Order #${shortId} has arrived! Please confirm delivery in your app.`);
        await sendPushNotification(customer._id, "Order Arrived 📍", "Your laundry order has arrived. Please confirm delivery in your app.", {
          notificationType: NOTIFICATION_TYPES.DELIVERY_PENDING_CONFIRMATION,
          orderId,
          status: newStatus,
        });
      }
      if (driver) {
        await sendPushNotification(driver._id, "Delivery Attempt Marked ⏳", `Order #${shortId}: Waiting for customer confirmation.`, {
          notificationType: NOTIFICATION_TYPES.DELIVERY_PENDING_CONFIRMATION,
          orderId,
          status: newStatus,
        });
      }
    }

    // 9. delivered
    else if (newStatus === "delivered") {
      if (customer) {
        await sendSMS(customer.phone, `Your Order #${shortId} has been successfully delivered! Thank you for choosing us.`);
        await sendPushNotification(customer._id, "Order Delivered 🎉", "Your order has been delivered! Please rate your experience.", {
          notificationType: NOTIFICATION_TYPES.ORDER_DELIVERED,
          orderId,
          status: newStatus,
        });
      }
      if (driver) {
        await sendPushNotification(driver._id, "Delivery Confirmed ✅", `Customer confirmed delivery for Order #${shortId}. Your earnings have been credited.`, {
          notificationType: NOTIFICATION_TYPES.ORDER_DELIVERED,
          orderId,
          status: newStatus,
        });
      }
      if (admin) {
        await sendPushNotification(admin._id, "Order Completed 🎉", `Order #${shortId} was delivered and confirmed by customer.`, {
          notificationType: NOTIFICATION_TYPES.ORDER_DELIVERED,
          orderId,
          status: newStatus,
        });
      }
    }

    // 10. customer_unavailable / delivery_failed
    else if (newStatus === "customer_unavailable") {
      if (customer) {
        await sendPushNotification(customer._id, "Delivery Rescheduled 📅", `Order #${shortId}: Marked as unavailable today. Your order will be safely returned to laundry and rescheduled.`, {
          notificationType: NOTIFICATION_TYPES.CUSTOMER_UNAVAILABLE,
          orderId,
          status: newStatus,
        });
      }
      if (driver) {
        await sendPushNotification(driver._id, "Customer Unavailable ⚠️", `Customer unavailable for Order #${shortId}. Please return order to the laundry store.`, {
          notificationType: NOTIFICATION_TYPES.CUSTOMER_UNAVAILABLE,
          orderId,
          status: newStatus,
        });
      }
      if (admin) {
        await sendPushNotification(admin._id, "Delivery Attempt Failed ⚠️", `Order #${shortId}: Customer unavailable. Order is being returned to laundry.`, {
          notificationType: NOTIFICATION_TYPES.CUSTOMER_UNAVAILABLE,
          orderId,
          status: newStatus,
        });
      }
    }

    // 11. returned_to_laundry
    else if (newStatus === "returned_to_laundry") {
      if (admin) {
        await sendPushNotification(admin._id, "Order Returned to Laundry 🏬", `Order #${shortId} has been returned because customer was unavailable. Ready for next-day redelivery.`, {
          notificationType: NOTIFICATION_TYPES.RETURNED_TO_LAUNDRY,
          orderId,
          status: newStatus,
        });
      }
      if (customer) {
        await sendPushNotification(customer._id, "Order Returned to Store 🏬", `Order #${shortId} has been safely returned to the laundry. Redelivery will be scheduled.`, {
          notificationType: NOTIFICATION_TYPES.RETURNED_TO_LAUNDRY,
          orderId,
          status: newStatus,
        });
      }
    }
  } catch (err) {
    console.error("[notifyOrderStatusUpdate]", err.message);
  }
};

// ─────────────────────────────────────────────
// notifyOrderCancelled — customer or admin cancels
// ─────────────────────────────────────────────
const notifyOrderCancelled = async (order, cancelledBy = "customer", reason = "") => {
  try {
    const Order = require("../models/orderModels");
    const User = require("../models/userModels");
    const Laundry = require("../models/laundryModels");

    let orderDoc = order;
    if (!order.user || !order.laundryId) {
      orderDoc = await Order.findById(order._id);
    }
    if (!orderDoc) return;

    const [customer, laundry] = await Promise.all([
      User.findById(orderDoc.user),
      Laundry.findById(orderDoc.laundryId),
    ]);
    const admin = laundry ? await User.findById(laundry.owner) : null;
    const shortId = orderDoc._id.toString().slice(-6).toUpperCase();
    const orderId = orderDoc._id.toString();

    if (cancelledBy === "customer") {
      // Notify admin that customer cancelled
      if (admin) {
        await sendPushNotification(
          admin._id,
          "Order Cancelled by Customer",
          `Order #${shortId} has been cancelled by the customer.${reason ? " Reason: " + reason : ""}`,
          { notificationType: NOTIFICATION_TYPES.ORDER_CANCELLED, orderId }
        );
      }
      // Notify customer confirmation
      if (customer) {
        await sendSMS(
          customer.phone,
          `Your order #${shortId} has been cancelled.${orderDoc.isPaid && orderDoc.paymentMethod === "razorpay" ? " Refund has been initiated." : ""}`
        );
        await sendPushNotification(
          customer._id,
          "Order Cancelled",
          `Your order #${shortId} has been cancelled.${orderDoc.isPaid && orderDoc.paymentMethod === "razorpay" ? " Refund will be processed shortly." : ""}`,
          { notificationType: NOTIFICATION_TYPES.ORDER_CANCELLED, orderId }
        );
      }
    } else {
      // Admin cancelled — notify customer
      if (customer) {
        await sendSMS(
          customer.phone,
          `Your order #${shortId} was cancelled by the laundry.${reason ? " Reason: " + reason : ""}`
        );
        await sendPushNotification(
          customer._id,
          "Order Cancelled by Laundry",
          `Sorry, your order #${shortId} was cancelled.${reason ? " Reason: " + reason : ""}`,
          { notificationType: NOTIFICATION_TYPES.ORDER_CANCELLED, orderId }
        );
      }
    }

    // Notify delivery partner if assigned
    if (orderDoc.deliveryPartner) {
      const partner = await User.findById(orderDoc.deliveryPartner);
      if (partner) {
        await sendPushNotification(
          partner._id,
          "Assigned Order Cancelled",
          `Order #${shortId} assigned to you has been cancelled.`,
          { notificationType: NOTIFICATION_TYPES.ORDER_CANCELLED, orderId }
        );
      }
    }
  } catch (err) {
    console.error("[notifyOrderCancelled]", err.message);
  }
};

// ─────────────────────────────────────────────
// notifyDeliveryAssigned — delivery partner gets task
// Only notifies the specific partner assigned to this order
// ─────────────────────────────────────────────
const notifyDeliveryAssigned = async (order, deliveryPartner) => {
  try {
    const partnerId = deliveryPartner?._id || deliveryPartner;
    const orderId = order?._id?.toString() || order?.toString() || "";
    const shortId = orderId.slice(-6).toUpperCase();

    await sendPushNotification(
      partnerId,
      "New Delivery Task Assigned 🚚",
      `Order #${shortId} has been assigned to you. Check your app for details.`,
      { notificationType: NOTIFICATION_TYPES.DELIVERY_ASSIGNED, orderId }
    );
  } catch (err) {
    console.error("[notifyDeliveryAssigned]", err.message);
  }
};

// ─────────────────────────────────────────────
// notifyPaymentSuccess
// ─────────────────────────────────────────────
const notifyPaymentSuccess = async (payment, order) => {
  try {
    const Order = require("../models/orderModels");
    const User = require("../models/userModels");
    const Laundry = require("../models/laundryModels");

    let orderDoc = order;
    if (!order || !order.user) {
      orderDoc = await Order.findById(payment.order);
    }
    if (!orderDoc) return;

    const amount = payment.amount || orderDoc.totalAmount;
    const orderId = orderDoc._id.toString();
    const [customer, laundry] = await Promise.all([
      User.findById(orderDoc.user),
      Laundry.findById(orderDoc.laundryId),
    ]);
    const admin = laundry ? await User.findById(laundry.owner) : null;

    if (customer) {
      const html = `
        <h3>Payment Successful!</h3>
        <p>Dear ${customer.name},</p>
        <p>A payment of <strong>₹${amount}</strong> for Order ID <strong>${orderId}</strong> has been received.</p>
        <p>Thank you for using LaundryApp!</p>
      `;
      await sendEmail(customer.email, "Payment Successful - LaundryApp", html);
      await sendPushNotification(
        customer._id,
        "Payment Successful 💳",
        `Payment of ₹${amount} received successfully.`,
        { notificationType: NOTIFICATION_TYPES.PAYMENT_SUCCESS, orderId }
      );
    }

    if (admin) {
      const html = `
        <h3>Payment Received</h3>
        <p>Dear Admin,</p>
        <p>A payment of <strong>₹${amount}</strong> has been received for Order ID <strong>${orderId}</strong>.</p>
      `;
      await sendEmail(admin.email, "Payment Received - LaundryApp", html);
      await sendPushNotification(
        admin._id,
        "Payment Received 💰",
        `Payment of ₹${amount} received for order #${orderId.slice(-6).toUpperCase()}.`,
        { notificationType: NOTIFICATION_TYPES.PAYMENT_SUCCESS, orderId }
      );
    }
  } catch (err) {
    console.error("[notifyPaymentSuccess]", err.message);
  }
};

// ─────────────────────────────────────────────
// notifyPaymentFailed
// ─────────────────────────────────────────────
const notifyPaymentFailed = async (payment, order, reason = "") => {
  try {
    const Order = require("../models/orderModels");
    const User = require("../models/userModels");

    let orderDoc = order;
    if (!orderDoc || !orderDoc.user) {
      orderDoc = await Order.findById(payment.order);
    }
    if (!orderDoc) return;

    const customer = await User.findById(orderDoc.user);
    const shortId = orderDoc._id.toString().slice(-6).toUpperCase();

    if (customer) {
      const msg = `Payment failed for order #${shortId}. ${reason || "Please retry payment."}`;
      await sendPushNotification(
        customer._id,
        "Payment Failed ⚠️",
        msg,
        {
          notificationType: NOTIFICATION_TYPES.PAYMENT_FAILED,
          orderId: orderDoc._id.toString(),
          status: "failed",
        }
      );
    }
  } catch (err) {
    console.error("[notifyPaymentFailed]", err.message);
  }
};

// ─────────────────────────────────────────────
// notifyLaundryApproved
// ─────────────────────────────────────────────
const notifyLaundryApproved = async (laundry, owner) => {
  try {
    const User = require("../models/userModels");
    const ownerDoc = await User.findById(owner._id || owner);
    if (ownerDoc) {
      const msg = "Your laundry has been approved and is now live on LaundryApp!";
      const html = `
        <h3>Laundry Approved!</h3>
        <p>Dear ${ownerDoc.name},</p>
        <p>Your laundry <strong>${laundry.name}</strong> has been approved by the superadmin.</p>
        <p>You can now log in to the portal to manage your orders.</p>
      `;
      await sendSMS(ownerDoc.phone, msg);
      await sendEmail(ownerDoc.email, "Laundry Approved - LaundryApp", html);
      await sendPushNotification(
        ownerDoc._id,
        "Laundry Approved ✅",
        msg,
        { notificationType: NOTIFICATION_TYPES.SYSTEM }
      );
    }
  } catch (err) {
    console.error("[notifyLaundryApproved]", err.message);
  }
};

// ─────────────────────────────────────────────
// notifyLaundryRejected
// ─────────────────────────────────────────────
const notifyLaundryRejected = async (laundry, owner, reason) => {
  try {
    const User = require("../models/userModels");
    const ownerDoc = await User.findById(owner._id || owner);
    if (ownerDoc) {
      const html = `
        <h3>Laundry Registration Update</h3>
        <p>Dear ${ownerDoc.name},</p>
        <p>Your laundry registration for <strong>${laundry.name}</strong> has been rejected.</p>
        <p><strong>Reason:</strong> ${reason || "N/A"}</p>
        <p>Please contact customer support for clarification.</p>
      `;
      await sendEmail(
        ownerDoc.email,
        "Laundry Request Rejected - LaundryApp",
        html
      );
    }
  } catch (err) {
    console.error("[notifyLaundryRejected]", err.message);
  }
};

// ─────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────
module.exports = {
  // Constants
  NOTIFICATION_TYPES,

  // Core primitives
  sendSMS,
  sendEmail,
  sendPushNotification,
  sendNotification,          // legacy alias
  sendNotificationToUser,
  sendNotificationToUsers,

  // Order lifecycle
  notifyOrderPlaced,
  notifyOrderAccepted,
  notifyOrderRejected,
  notifyOrderStatusUpdate,
  notifyOrderCancelled,

  // Delivery
  notifyDeliveryAssigned,

  // Payments
  notifyPaymentSuccess,
  notifyPaymentFailed,

  // Laundry admin
  notifyLaundryApproved,
  notifyLaundryRejected,
};
