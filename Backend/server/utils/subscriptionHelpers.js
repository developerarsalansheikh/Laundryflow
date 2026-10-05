const Subscription = require("../models/subscriptionModels");
const Laundry = require("../models/laundryModels");
const { SUBSCRIPTION_STATUS, VALID_TRANSITIONS } = require("../constants/subscriptionStatus");

/**
 * LaundryFlow — Subscription Helper Utilities
 *
 * Reusable, side-effect-free helpers for subscription domain logic.
 * These do NOT depend on req/res — safe to call from any controller or script.
 */

// ─────────────────────────────────────────────
// isExpired
// Check if a subscription's endDate has passed.
// Does NOT modify the DB — purely a check.
// ─────────────────────────────────────────────
const isExpired = (subscription) => {
  if (!subscription || !subscription.endDate) return false;
  return new Date(subscription.endDate) < new Date();
};

// ─────────────────────────────────────────────
// validateLifecycleTransition
// Returns true if moving from `fromStatus` → `toStatus` is allowed.
// ─────────────────────────────────────────────
const validateLifecycleTransition = (fromStatus, toStatus) => {
  const allowed = VALID_TRANSITIONS[fromStatus];
  if (!allowed) return false;
  return allowed.includes(toStatus);
};

// ─────────────────────────────────────────────
// markExpiredSubscriptions
// Batch helper — marks all subscriptions whose endDate has passed
// and whose status is still trial/active/past_due → expired.
//
// Call this on-demand (e.g., before loading stats) rather than
// via a cron, since the backend has no scheduler infrastructure.
// ─────────────────────────────────────────────
const markExpiredSubscriptions = async () => {
  try {
    const now = new Date();

    // Find subscriptions that should be expired but are still in an open status
    const staleStatuses = [
      SUBSCRIPTION_STATUS.TRIAL,
      SUBSCRIPTION_STATUS.ACTIVE,
      SUBSCRIPTION_STATUS.PAST_DUE,
    ];

    const result = await Subscription.updateMany(
      {
        status: { $in: staleStatuses },
        endDate: { $lt: now },
      },
      {
        $set: { status: SUBSCRIPTION_STATUS.EXPIRED },
      }
    );

    return result.modifiedCount;
  } catch (err) {
    console.error("markExpiredSubscriptions error:", err.message);
    return 0;
  }
};

// ─────────────────────────────────────────────
// syncLaundrySubscriptionFields
// When a Subscription is activated/cancelled/expired,
// keep the primitive fields on the Laundry document in sync.
// This ensures the existing dashboard stats remain accurate.
//
// Mapping:
//   trial     → laundry.subscriptionStatus = "trial"
//   active    → laundry.subscriptionStatus = "active"
//   past_due  → laundry.subscriptionStatus = "active" (grace period)
//   cancelled → laundry.subscriptionStatus = "expired"
//   expired   → laundry.subscriptionStatus = "expired"
// ─────────────────────────────────────────────
const syncLaundrySubscriptionFields = async (laundryId, subscription) => {
  try {
    const statusMap = {
      [SUBSCRIPTION_STATUS.TRIAL]: "trial",
      [SUBSCRIPTION_STATUS.ACTIVE]: "active",
      [SUBSCRIPTION_STATUS.PAST_DUE]: "active",     // grace period
      [SUBSCRIPTION_STATUS.CANCELLED]: "expired",
      [SUBSCRIPTION_STATUS.EXPIRED]: "expired",
    };

    const laundryStatus = statusMap[subscription.status] || "expired";

    await Laundry.findByIdAndUpdate(laundryId, {
      subscriptionStatus: laundryStatus,
      subscriptionExpiry: subscription.endDate,
    });
  } catch (err) {
    // Non-critical — log but don't throw
    console.error("syncLaundrySubscriptionFields error:", err.message);
  }
};

module.exports = {
  isExpired,
  validateLifecycleTransition,
  markExpiredSubscriptions,
  syncLaundrySubscriptionFields,
};
