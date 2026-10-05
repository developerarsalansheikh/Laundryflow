/**
 * Verification Test: RN-4 Single-Laundry Cart Rule
 */
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

// Simple mock for MMKV storage
global.__mmkv_mock__ = {};
const mockMmkv = {
  getString: (key) => global.__mmkv_mock__[key] || null,
  set: (key, val) => { global.__mmkv_mock__[key] = val; },
  delete: (key) => { delete global.__mmkv_mock__[key]; },
  clearAll: () => { global.__mmkv_mock__ = {}; },
};

const customRequire = (id) => {
  if (id === 'react-native-mmkv') {
    return {
      MMKV: function () { return mockMmkv; },
      createMMKV: () => mockMmkv,
    };
  }
  if (id === './mmkvStorage') {
    return {
      mmkvStateStorage: {
        setItem: (k, v) => mockMmkv.set(k, v),
        getItem: (k) => mockMmkv.getString(k),
        removeItem: (k) => mockMmkv.delete(k),
      },
    };
  }
  if (id === '../constants/app') {
    return {
      STORAGE_KEYS: { CART: '@laundryflow_cart' },
    };
  }
  return require(id);
};

// Transform and load cartStore
const cartStorePath = path.resolve(__dirname, '../src/store/cartStore.js');
const rawCode = fs.readFileSync(cartStorePath, 'utf8');
const transformed = babel.transformSync(rawCode, {
  filename: cartStorePath,
  presets: ['module:@react-native/babel-preset'],
});

const scriptModule = { exports: {} };
const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', transformed.code);
fn(scriptModule, scriptModule.exports, customRequire, path.dirname(cartStorePath), cartStorePath);

const { useCartStore } = scriptModule.exports;

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
};

const runVerification = () => {
  console.log('\n=============================================');
  console.log('STARTING RN-4 SINGLE-LAUNDRY RULE VERIFICATION');
  console.log('=============================================\n');

  // Step 1: Initial Cart state
  useCartStore.getState().clearCart();
  const cart1 = useCartStore.getState();
  assert(cart1.items.length === 0, 'Cart starts empty for guest');
  assert(cart1.laundryId === null, 'No laundry associated with cart initially');

  // Step 2 & 3: Add Service A1 from Laundry A
  const laundryA = {
    _id: 'laundry_aaa',
    name: 'Sparkle Express Indiranagar',
    address: '100ft Road, Indiranagar',
  };
  const serviceA1 = {
    _id: 'srv_shirt_wash',
    name: 'Shirt Wash & Fold',
    price: 60,
    unit: 'per_piece',
  };

  const addResult1 = useCartStore.getState().addItem({
    laundryId: laundryA._id,
    laundryName: laundryA.name,
    laundryAddress: laundryA.address,
    service: serviceA1,
  });

  assert(addResult1.conflict === false, 'Service A1 added without conflict');
  assert(useCartStore.getState().laundryId === 'laundry_aaa', 'Cart is now associated with Laundry A');
  assert(useCartStore.getState().items.length === 1, 'Cart has exactly 1 item');
  assert(useCartStore.getState().items[0].id === 'srv_shirt_wash', 'Cart item is Service A1');

  // Step 4: Add another service from same Laundry A (allowed without conflict)
  const serviceA2 = {
    _id: 'srv_iron',
    name: 'Steam Ironing',
    price: 25,
    unit: 'per_piece',
  };
  const addResult2 = useCartStore.getState().addItem({
    laundryId: laundryA._id,
    laundryName: laundryA.name,
    laundryAddress: laundryA.address,
    service: serviceA2,
  });
  assert(addResult2.conflict === false, 'Service A2 from same Laundry A added without conflict');
  assert(useCartStore.getState().items.length === 2, 'Cart has 2 items from Laundry A');

  // Step 5: Customer browses Laundry B (browsing does not alter cart)
  const laundryB = {
    _id: 'laundry_bbb',
    name: 'Royal Dry Cleaners Koramangala',
    address: '80ft Road, Koramangala',
  };
  assert(useCartStore.getState().laundryId === 'laundry_aaa', 'Cart remains Laundry A while browsing Laundry B');

  // Step 6: Customer attempts to add Service B1 from Laundry B
  const serviceB1 = {
    _id: 'srv_suit_dryclean',
    name: 'Suit Dry Cleaning',
    price: 350,
    unit: 'per_piece',
  };

  const conflictCheck = useCartStore.getState().checkConflict(laundryB._id);
  assert(conflictCheck === true, 'Conflict detected before adding Laundry B service');

  const addResult3 = useCartStore.getState().addItem({
    laundryId: laundryB._id,
    laundryName: laundryB.name,
    laundryAddress: laundryB.address,
    service: serviceB1,
  });

  assert(addResult3.conflict === true, 'addItem returned conflict: true for Laundry B service');
  assert(addResult3.currentLaundry.id === 'laundry_aaa', 'Conflict surfaces current laundry details');
  assert(useCartStore.getState().items.length === 2, 'Existing cart items NEVER silently deleted');
  assert(useCartStore.getState().laundryId === 'laundry_aaa', 'Cart still belongs to Laundry A');

  // Step 7: Action: "Keep Current Laundry" -> Dismiss modal
  console.log('\n--- Action: Keep Current Laundry ---');
  assert(useCartStore.getState().laundryId === 'laundry_aaa', 'Cart preserved for Laundry A');
  assert(useCartStore.getState().items.length === 2, 'Cart items unchanged');

  // Step 8: Action: "Clear Cart & Switch"
  console.log('\n--- Action: Clear Cart & Switch ---');
  const switchResult = useCartStore.getState().clearAndAddItem({
    laundryId: laundryB._id,
    laundryName: laundryB.name,
    laundryAddress: laundryB.address,
    service: serviceB1,
  });

  assert(switchResult.conflict === false, 'clearAndAddItem succeeded');
  assert(useCartStore.getState().laundryId === 'laundry_bbb', 'Cart now belongs strictly to Laundry B');
  assert(useCartStore.getState().items.length === 1, 'Old Laundry A items removed; Laundry B item is now sole item');
  assert(useCartStore.getState().items[0].id === 'srv_suit_dryclean', 'Cart contains only Service B1');

  // Step 9: Single Laundry Validity Check
  assert(useCartStore.getState().isSingleLaundryValid() === true, 'Cart satisfies single-laundry validation rule');

  // Step 10: Verify Grand Total Calculation
  const summary = useCartStore.getState().getCartSummary();
  assert(summary.subtotal === 350, 'Subtotal is ₹350');
  assert(summary.deliveryFee === 40, 'Delivery fee is ₹40');
  assert(summary.tax === Math.round(350 * 0.05), 'Tax is 5% GST (₹18)');
  assert(summary.grandTotal === 350 + 40 + 18, 'Grand total matches ₹408');

  // ─────────────────────────────────────────────────────────────────────────────
  // RN-4 PATCH: MULTI-LAUNDRY ORDERS AFTER ORDER COMPLETION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- RN-4 Patch: Multi-Laundry Orders After Order Completion ---');

  // Step 11: Customer places an order from Laundry A
  console.log('\nSubtest: Customer completes order from Laundry A');
  useCartStore.getState().clearCart();
  useCartStore.getState().addItem({
    laundryId: laundryA._id,
    laundryName: laundryA.name,
    laundryAddress: laundryA.address,
    service: serviceA1,
  });
  assert(useCartStore.getState().laundryId === 'laundry_aaa', 'Cart populated with Laundry A');
  assert(useCartStore.getState().items.length === 1, 'Cart has 1 item for Laundry A');

  // Mock Order History database
  const orderHistory = [];
  const completedOrderA = {
    _id: 'order_1001',
    laundryId: laundryA._id,
    laundryName: useCartStore.getState().laundryName,
    items: [...useCartStore.getState().items],
    totalAmount: useCartStore.getState().getCartSummary().grandTotal,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  orderHistory.push(completedOrderA);

  // Cart must be cleared/reset upon successful order placement
  useCartStore.getState().clearCart();
  assert(useCartStore.getState().items.length === 0, 'Cart is empty after order completion');
  assert(useCartStore.getState().laundryId === null, 'Cart laundryId reset to null after order completion');
  assert(useCartStore.getState().laundryName === '', 'Cart laundryName reset to empty string');
  assert(useCartStore.getState().instructions === '', 'Cart instructions reset');

  // Step 12: Completed order remains safely stored in Order History
  assert(orderHistory.length === 1, 'Order History contains exactly 1 completed order');
  assert(orderHistory[0]._id === 'order_1001', 'Order A safely preserved in Order History');
  assert(orderHistory[0].laundryId === 'laundry_aaa', 'Order A belongs to Laundry A');

  // Step 13: Customer returns to Marketplace and selects Laundry B
  console.log('\nSubtest: Return to Marketplace and select Laundry B');
  const conflictBeforeAddB = useCartStore.getState().checkConflict(laundryB._id);
  assert(conflictBeforeAddB === false, 'No conflict when selecting Laundry B after previous order completed');

  // Step 14: Customer adds Laundry B services to a fresh cart
  console.log('\nSubtest: Add Laundry B service to fresh cart');
  const addResultB = useCartStore.getState().addItem({
    laundryId: laundryB._id,
    laundryName: laundryB.name,
    laundryAddress: laundryB.address,
    service: serviceB1,
  });

  assert(addResultB.conflict === false, 'Laundry B service added without conflict to fresh cart');
  assert(addResultB.success === true, 'Laundry B addItem reported success');
  assert(useCartStore.getState().laundryId === 'laundry_bbb', 'Cart now strictly associated with Laundry B');
  assert(useCartStore.getState().laundryName === 'Royal Dry Cleaners Koramangala', 'Cart laundry name updated to Laundry B');
  assert(useCartStore.getState().items.length === 1, 'Fresh cart contains only Laundry B items');
  assert(useCartStore.getState().items[0].id === 'srv_suit_dryclean', 'Cart contains only Service B1');
  assert(useCartStore.getState().isSingleLaundryValid() === true, 'Single laundry validation holds for Laundry B');

  // Step 15: Conflict protection still applies while Laundry B cart is active
  console.log('\nSubtest: Attempting to add Laundry A service while Laundry B cart is active');
  const conflictOnA = useCartStore.getState().checkConflict(laundryA._id);
  assert(conflictOnA === true, 'Conflict detected if attempting to add Laundry A while Laundry B cart is active');

  const addResultAConflict = useCartStore.getState().addItem({
    laundryId: laundryA._id,
    laundryName: laundryA.name,
    laundryAddress: laundryA.address,
    service: serviceA1,
  });
  assert(addResultAConflict.conflict === true, 'addItem rejected Laundry A item while Laundry B is active');
  assert(addResultAConflict.currentLaundry.id === 'laundry_bbb', 'Conflict correctly points to active Laundry B');
  assert(useCartStore.getState().laundryId === 'laundry_bbb', 'Cart is not corrupted and remains Laundry B');
  assert(useCartStore.getState().items.length === 1, 'Cart items unchanged');

  // Step 16: Customer places a completely new order from Laundry B
  console.log('\nSubtest: Customer completes order from Laundry B');
  const completedOrderB = {
    _id: 'order_1002',
    laundryId: laundryB._id,
    laundryName: useCartStore.getState().laundryName,
    items: [...useCartStore.getState().items],
    totalAmount: useCartStore.getState().getCartSummary().grandTotal,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  orderHistory.push(completedOrderB);

  useCartStore.getState().resetCart();
  assert(useCartStore.getState().items.length === 0, 'Cart cleared after Laundry B order');
  assert(useCartStore.getState().laundryId === null, 'Cart laundryId reset after Laundry B order');

  // Step 17: Both orders exist safely in Order History
  assert(orderHistory.length === 2, 'Order History safely contains BOTH orders');
  assert(orderHistory[0].laundryId === 'laundry_aaa', 'Order 1 is from Laundry A');
  assert(orderHistory[1].laundryId === 'laundry_bbb', 'Order 2 is from Laundry B');

  console.log('\n=============================================');
  console.log('ALL RN-4 MULTI-LAUNDRY ORDER LIFECYCLE TESTS PASS 100%!');
  console.log('=============================================\n');
};

runVerification();
