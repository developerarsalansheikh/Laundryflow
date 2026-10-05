/**
 * LaundryFlow — Subscription Status Constants
 *
 * Centralized source of truth for all subscription statuses
 * and valid lifecycle transitions.
 */

const SUBSCRIPTION_STATUS = Object.freeze({
  TRIAL: "trial",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
});

/**
 * Valid lifecycle transitions map.
 * Key = current status, Value = allowed next statuses.
 */
const VALID_TRANSITIONS = Object.freeze({
  [SUBSCRIPTION_STATUS.TRIAL]: [
    SUBSCRIPTION_STATUS.ACTIVE,
    SUBSCRIPTION_STATUS.CANCELLED,
  ],
  [SUBSCRIPTION_STATUS.ACTIVE]: [
    SUBSCRIPTION_STATUS.CANCELLED,
    SUBSCRIPTION_STATUS.PAST_DUE,
    SUBSCRIPTION_STATUS.EXPIRED,
  ],
  [SUBSCRIPTION_STATUS.PAST_DUE]: [
    SUBSCRIPTION_STATUS.ACTIVE,
    SUBSCRIPTION_STATUS.CANCELLED,
  ],
  [SUBSCRIPTION_STATUS.CANCELLED]: [], // terminal
  [SUBSCRIPTION_STATUS.EXPIRED]: [],   // terminal
});

module.exports = { SUBSCRIPTION_STATUS, VALID_TRANSITIONS };
