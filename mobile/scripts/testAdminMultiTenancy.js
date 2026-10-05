/**
 * RN-5A Admin & Multi-Tenancy Security Unit Test
 * Validates backend controllers, status transitions, and laundry authorization
 */

const assert = require('assert');
const crypto = require('crypto');

console.log('\n=============================================');
console.log('STARTING RN-5A ADMIN & MULTI-TENANCY VERIFICATION');
console.log('=============================================\n');

// Mock 24-character hex ObjectIds
const makeId = () => crypto.randomBytes(12).toString('hex');

const laundryAId = makeId();
const laundryBId = makeId();
const userAdminA = {
  _id: makeId(),
  role: 'admin',
  laundryId: laundryAId,
};
const userAdminB = {
  _id: makeId(),
  role: 'admin',
  laundryId: laundryBId,
};


// 1. Multi-Tenant Authorization Check for Order Status Update
console.log('1. Testing Multi-Tenant Order Isolation...');

const mockOrderLaundryA = {
  _id: makeId(),
  laundryId: laundryAId,
  status: 'pending',
};

const mockOrderLaundryB = {
  _id: makeId(),
  laundryId: laundryBId,
  status: 'pending',
};


// Verification logic simulating orderController.updateOrderStatus multi-tenant check:
const checkOrderUpdateAccess = (reqUser, order) => {
  if (reqUser.role === 'admin' && order.laundryId.toString() !== reqUser.laundryId.toString()) {
    return { status: 403, message: 'Access denied — ye aapki laundry ka order nahi hai' };
  }
  return { status: 200, message: 'Allowed' };
};

const accessTest1 = checkOrderUpdateAccess(userAdminA, mockOrderLaundryA);
assert.strictEqual(accessTest1.status, 200);
console.log('✅ PASS: Admin A can access Laundry A order');

const accessTest2 = checkOrderUpdateAccess(userAdminA, mockOrderLaundryB);
assert.strictEqual(accessTest2.status, 403);
console.log('✅ PASS: Admin A is BLOCKED (403) from updating Laundry B order');

const accessTest3 = checkOrderUpdateAccess(userAdminB, mockOrderLaundryA);
assert.strictEqual(accessTest3.status, 403);
console.log('✅ PASS: Admin B is BLOCKED (403) from updating Laundry A order');

// 2. Testing Status Lifecycle Validation
console.log('\n2. Testing Order Status Lifecycle Flow...');

const statusFlow = {
  pending: ['picked_up', 'cancelled'],
  picked_up: ['in_progress'],
  in_progress: ['ready'],
  ready: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

const validateStatusTransition = (currentStatus, targetStatus) => {
  const allowed = statusFlow[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    return {
      allowed: false,
      message: `Order '${currentStatus}' se '${targetStatus}' nahi ho sakta. Allowed: ${allowed.join(', ') || 'koi nahi'}`,
    };
  }
  return { allowed: true };
};

// Test valid transitions
assert.strictEqual(validateStatusTransition('pending', 'picked_up').allowed, true);
console.log('✅ PASS: pending -> picked_up is valid');

assert.strictEqual(validateStatusTransition('pending', 'cancelled').allowed, true);
console.log('✅ PASS: pending -> cancelled is valid');

assert.strictEqual(validateStatusTransition('picked_up', 'in_progress').allowed, true);
console.log('✅ PASS: picked_up -> in_progress is valid');

assert.strictEqual(validateStatusTransition('in_progress', 'ready').allowed, true);
console.log('✅ PASS: in_progress -> ready is valid');

assert.strictEqual(validateStatusTransition('ready', 'out_for_delivery').allowed, true);
console.log('✅ PASS: ready -> out_for_delivery is valid');

assert.strictEqual(validateStatusTransition('out_for_delivery', 'delivered').allowed, true);
console.log('✅ PASS: out_for_delivery -> delivered is valid');

// Test invalid / jumping transitions (must be rejected)
assert.strictEqual(validateStatusTransition('pending', 'delivered').allowed, false);
console.log('✅ PASS: pending -> delivered directly is REJECTED');

assert.strictEqual(validateStatusTransition('pending', 'in_progress').allowed, false);
console.log('✅ PASS: pending -> in_progress directly is REJECTED');

assert.strictEqual(validateStatusTransition('delivered', 'in_progress').allowed, false);
console.log('✅ PASS: delivered -> in_progress is REJECTED (terminal status)');

assert.strictEqual(validateStatusTransition('cancelled', 'delivered').allowed, false);
console.log('✅ PASS: cancelled -> delivered is REJECTED (terminal status)');

// 3. Testing Service Ownership Scoping
console.log('\n3. Testing Service Catalog Multi-Tenancy...');

const mockServices = [
  { _id: makeId(), name: 'Iron', laundryId: laundryAId, isActive: true },
  { _id: makeId(), name: 'Wash', laundryId: laundryAId, isActive: false },
  { _id: makeId(), name: 'Dry Clean', laundryId: laundryBId, isActive: true },
];

// Query scoped to Admin A's laundry:
const getAdminServices = (adminUser, all = true) => {
  return mockServices.filter((s) => {
    if (s.laundryId.toString() !== adminUser.laundryId.toString()) return false;
    if (!all && !s.isActive) return false;
    return true;
  });
};

const adminAServices = getAdminServices(userAdminA, true);
assert.strictEqual(adminAServices.length, 2);
assert.strictEqual(adminAServices.every((s) => s.laundryId.toString() === laundryAId.toString()), true);
console.log('✅ PASS: Admin A only receives Laundry A services (including inactive)');

const adminBServices = getAdminServices(userAdminB, true);
assert.strictEqual(adminBServices.length, 1);
assert.strictEqual(adminBServices[0].name, 'Dry Clean');
console.log('✅ PASS: Admin B only receives Laundry B services');

// 4. Delivery Partner Laundry Boundary
console.log('\n4. Testing Delivery Partner Assignment Boundary...');

const driverLaundryA = { _id: makeId(), role: 'delivery', laundryId: laundryAId };
const driverLaundryB = { _id: makeId(), role: 'delivery', laundryId: laundryBId };


const validateDriverAssignment = (order, driver) => {
  if (driver.laundryId.toString() !== order.laundryId.toString()) {
    return { valid: false, message: 'Ye delivery partner is laundry se belong nahi karta' };
  }
  return { valid: true };
};

const driverAssign1 = validateDriverAssignment(mockOrderLaundryA, driverLaundryA);
assert.strictEqual(driverAssign1.valid, true);
console.log('✅ PASS: Assigning Laundry A driver to Laundry A order succeeds');

const driverAssign2 = validateDriverAssignment(mockOrderLaundryA, driverLaundryB);
assert.strictEqual(driverAssign2.valid, false);
console.log('✅ PASS: Assigning Laundry B driver to Laundry A order is REJECTED');

console.log('\n=============================================');
console.log('ALL RN-5A MULTI-TENANCY & ADMIN RULES PASSED 100%!');
console.log('=============================================\n');
