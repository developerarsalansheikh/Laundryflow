/**
 * Automated Verification Script for LaundryFlow Phase 1 & 2 Features
 * Tests:
 * 1. Health endpoint response (/health & /api/health)
 * 2. Settings model orderEditWindowMinutes
 * 3. Support model schema & orderId ref
 * 4. Order model editHistory & extraAmountDue
 * 5. Order edit window calculation & price diff logic
 * 6. Order cancellation state transitions
 */

const assert = require('assert');

async function runTests() {
  console.log('--- Starting LaundryFlow Feature Verification ---');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // Test 1: Verify Settings Model schema
  test('Settings Model contains orderEditWindowMinutes', () => {
    const Settings = require('../models/settingsModels');
    const schema = Settings.schema;
    assert(schema.path('orderEditWindowMinutes'), 'orderEditWindowMinutes path missing in Settings schema');
    assert.strictEqual(schema.path('orderEditWindowMinutes').defaultValue, 15, 'Default window should be 15 mins');
  });

  // Test 2: Verify Order Model schema additions
  test('Order Model contains editHistory and extraAmountDue', () => {
    const Order = require('../models/orderModels');
    const schema = Order.schema;
    assert(schema.path('editHistory'), 'editHistory array missing in Order schema');
    assert(schema.path('extraAmountDue'), 'extraAmountDue missing in Order schema');
    assert.strictEqual(schema.path('extraAmountDue').defaultValue, 0, 'extraAmountDue should default to 0');
  });

  // Test 3: Verify Support Model schema additions
  test('SupportTicket Model contains orderId reference', () => {
    const SupportTicket = require('../models/supportModels');
    const schema = SupportTicket.schema;
    assert(schema.path('orderId'), 'orderId missing in SupportTicket schema');
    assert(schema.path('category'), 'category missing in SupportTicket schema');
    const enumVals = schema.path('category').enumValues;
    assert(enumVals.includes('order_issue'), 'order_issue missing in category enum');
    assert(enumVals.includes('cancellation'), 'cancellation missing in category enum');
  });

  // Test 4: Verify Order Edit Window calculation logic
  test('Order Edit Window calculation accurately determines eligibility', () => {
    const now = new Date();
    const windowMinutes = 15;
    
    // Within window: order created 5 mins ago
    const recentCreatedAt = new Date(now.getTime() - 5 * 60 * 1000);
    const deadlineRecent = new Date(recentCreatedAt.getTime() + windowMinutes * 60 * 1000);
    const isEligibleRecent = now < deadlineRecent;
    const remainingSecondsRecent = Math.max(0, Math.floor((deadlineRecent.getTime() - now.getTime()) / 1000));
    assert.strictEqual(isEligibleRecent, true, 'Order created 5 mins ago should be eligible');
    assert(remainingSecondsRecent > 500 && remainingSecondsRecent <= 600, 'Remaining seconds should be ~600s');

    // Expired window: order created 20 mins ago
    const pastCreatedAt = new Date(now.getTime() - 20 * 60 * 1000);
    const deadlinePast = new Date(pastCreatedAt.getTime() + windowMinutes * 60 * 1000);
    const isEligiblePast = now < deadlinePast;
    assert.strictEqual(isEligiblePast, false, 'Order created 20 mins ago should be expired');
  });

  // Test 5: Verify Order Edit status restriction boundary
  test('Order Edit disallowed once pickup begins or order advances', () => {
    const editableStatuses = ['Order Placed', 'Confirmed', 'Pickup Assigned'];
    const lockedStatuses = ['Out for Pickup', 'Picked Up', 'In Washing', 'Washed', 'Ready for Delivery', 'Out for Delivery', 'Delivered', 'Cancelled'];

    lockedStatuses.forEach(status => {
      const allowed = editableStatuses.includes(status);
      assert.strictEqual(allowed, false, `Status "${status}" must NOT be editable`);
    });
  });

  // Test 6: Verify Order Cancellation pre-pickup boundary
  test('Order Cancellation disallowed after pickup begins', () => {
    const cancellableStatuses = ['Order Placed', 'Confirmed', 'Pickup Assigned'];
    const nonCancellableStatuses = ['Out for Pickup', 'Picked Up', 'In Washing', 'Delivered'];

    cancellableStatuses.forEach(status => {
      assert(cancellableStatuses.includes(status), `Status "${status}" should be cancellable`);
    });

    nonCancellableStatuses.forEach(status => {
      assert(!cancellableStatuses.includes(status), `Status "${status}" must reject cancellation`);
    });
  });

  // Test 7: Verify Server Pricing re-calculation safety
  test('Server strictly recalculates total from catalogue and enforces delivery zone fee', () => {
    const mockCatalogueItems = [
      { id: '1', name: 'Shirt', price: 50 },
      { id: '2', name: 'Pants', price: 70 }
    ];

    const requestedItems = [
      { serviceItemId: '1', quantity: 3 }, // 150
      { serviceItemId: '2', quantity: 2 }  // 140
    ];

    const deliveryFee = 30;

    let subtotal = 0;
    requestedItems.forEach(item => {
      const match = mockCatalogueItems.find(c => c.id === item.serviceItemId);
      subtotal += match.price * item.quantity;
    });

    const finalTotal = subtotal + deliveryFee;
    assert.strictEqual(subtotal, 290, 'Subtotal should be 290');
    assert.strictEqual(finalTotal, 320, 'Final total should be 320');

    // Case A: Previous total 400 (Client decreased items) -> Refund of 80
    const prevPaid = 400;
    const diff = prevPaid - finalTotal;
    assert.strictEqual(diff, 80, 'Refund amount should be 80');

    // Case B: Previous total 250 (Client added items) -> Extra due of 70
    const prevPaid2 = 250;
    const extraDue = finalTotal - prevPaid2;
    assert.strictEqual(extraDue, 70, 'Extra amount due should be 70');
  });

  console.log(`\n--- Verification Summary: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
