const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

describe("Delivery Assignment Timing — Requirements C", () => {
  // Workflow: Processing -> Ready -> Delivery assignment -> Pickup -> Delivery
  function validateAssignmentTiming(order) {
    if (order.status === "cancelled" || order.status === "delivered") {
      return { allowed: false, status: 400, message: `Cannot assign delivery partner to ${order.status} order` };
    }

    if (order.status !== "ready" && order.status !== "ready_for_redelivery") {
      return {
        allowed: false,
        status: 400,
        message: `Delivery partner can only be assigned when order reaches 'Ready' status. Current order status: '${order.status}'.`,
      };
    }

    return { allowed: true };
  }

  it("rejects delivery assignment when order is in processing/in_progress", () => {
    const order = { _id: "ord_1", status: "in_progress" };
    const res = validateAssignmentTiming(order);
    assert.equal(res.allowed, false);
    assert.equal(res.status, 400);
    assert.match(res.message, /order reaches 'Ready' status/);
  });

  it("rejects delivery assignment when order is in pending or confirmed status", () => {
    const orderPending = { _id: "ord_2", status: "pending" };
    const orderConfirmed = { _id: "ord_3", status: "confirmed" };

    const resPending = validateAssignmentTiming(orderPending);
    const resConfirmed = validateAssignmentTiming(orderConfirmed);

    assert.equal(resPending.allowed, false);
    assert.equal(resPending.status, 400);
    assert.equal(resConfirmed.allowed, false);
    assert.equal(resConfirmed.status, 400);
  });

  it("allows delivery assignment when order reaches ready status", () => {
    const orderReady = { _id: "ord_4", status: "ready" };
    const res = validateAssignmentTiming(orderReady);
    assert.equal(res.allowed, true);
  });

  it("allows delivery assignment when order reaches ready_for_redelivery status", () => {
    const orderRedelivery = { _id: "ord_5", status: "ready_for_redelivery" };
    const res = validateAssignmentTiming(orderRedelivery);
    assert.equal(res.allowed, true);
  });
});
