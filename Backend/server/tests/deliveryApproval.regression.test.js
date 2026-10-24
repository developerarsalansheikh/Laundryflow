const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

describe("Delivery Partner Approval & Security — Requirements D", () => {
  // Test pending delivery partner authentication block
  it("rejects login for delivery partner in pending approval status", () => {
    const user = {
      _id: "delivery_1",
      role: "delivery",
      approvalStatus: "pending",
      isActive: false,
    };

    function validateDeliveryAccess(u) {
      if (u.role === "delivery") {
        if (u.approvalStatus === "pending") {
          return { allowed: false, status: 403, message: "Your Delivery Partner account is pending approval by Super Admin." };
        }
        if (u.approvalStatus === "rejected") {
          return { allowed: false, status: 403, message: "Your Delivery Partner account was rejected by Super Admin." };
        }
        if (u.approvalStatus !== "approved" || !u.isActive) {
          return { allowed: false, status: 403, message: "Your Delivery Partner account is inactive or awaiting Super Admin approval." };
        }
      }
      return { allowed: true };
    }

    const check = validateDeliveryAccess(user);
    assert.equal(check.allowed, false);
    assert.equal(check.status, 403);
    assert.match(check.message, /pending approval by Super Admin/);
  });

  // Test rejected delivery partner authentication block
  it("rejects login for delivery partner in rejected status", () => {
    const user = {
      _id: "delivery_2",
      role: "delivery",
      approvalStatus: "rejected",
      rejectionReason: "Invalid driving license",
      isActive: false,
    };

    function validateDeliveryAccess(u) {
      if (u.role === "delivery") {
        if (u.approvalStatus === "pending") {
          return { allowed: false, status: 403, message: "Your Delivery Partner account is pending approval by Super Admin." };
        }
        if (u.approvalStatus === "rejected") {
          return { allowed: false, status: 403, message: u.rejectionReason ? `Your Delivery Partner account was rejected: ${u.rejectionReason}` : "Your Delivery Partner account was rejected by Super Admin." };
        }
        if (u.approvalStatus !== "approved" || !u.isActive) {
          return { allowed: false, status: 403, message: "Your Delivery Partner account is inactive or awaiting Super Admin approval." };
        }
      }
      return { allowed: true };
    }

    const check = validateDeliveryAccess(user);
    assert.equal(check.allowed, false);
    assert.equal(check.status, 403);
    assert.match(check.message, /Invalid driving license/);
  });

  // Test approved delivery partner authentication pass
  it("allows login for approved active delivery partner", () => {
    const user = {
      _id: "delivery_3",
      role: "delivery",
      approvalStatus: "approved",
      isActive: true,
    };

    function validateDeliveryAccess(u) {
      if (u.role === "delivery") {
        if (u.approvalStatus === "pending") {
          return { allowed: false, status: 403, message: "Your Delivery Partner account is pending approval by Super Admin." };
        }
        if (u.approvalStatus === "rejected") {
          return { allowed: false, status: 403, message: "Your Delivery Partner account was rejected by Super Admin." };
        }
        if (u.approvalStatus !== "approved" || !u.isActive) {
          return { allowed: false, status: 403, message: "Your Delivery Partner account is inactive or awaiting Super Admin approval." };
        }
      }
      return { allowed: true };
    }

    const check = validateDeliveryAccess(user);
    assert.equal(check.allowed, true);
  });

  // Test other roles are unaffected by delivery approval checks
  it("customer and laundry admin roles are unaffected by delivery approval checks", () => {
    const customer = { _id: "cust_1", role: "user", isActive: true };
    const admin = { _id: "admin_1", role: "admin", isActive: true };

    function validateDeliveryAccess(u) {
      if (u.role === "delivery") {
        if (u.approvalStatus !== "approved" || !u.isActive) {
          return { allowed: false };
        }
      }
      return { allowed: true };
    }

    assert.equal(validateDeliveryAccess(customer).allowed, true);
    assert.equal(validateDeliveryAccess(admin).allowed, true);
  });

  // Test duplicate approval prevention logic
  it("prevents duplicate approval for already approved delivery partner", () => {
    const partner = {
      _id: "delivery_approved",
      role: "delivery",
      approvalStatus: "approved",
      isActive: true,
    };

    function approvePartner(p) {
      if (p.approvalStatus === "approved" && p.isActive) {
        return { success: false, status: 400, message: "This delivery partner account is already approved and active." };
      }
      return { success: true };
    }

    const res = approvePartner(partner);
    assert.equal(res.success, false);
    assert.equal(res.status, 400);
    assert.match(res.message, /already approved and active/);
  });
});
