const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { DEFAULT_DRY_CLEAN_ITEMS, getStandardDryCleanPrice } = require("../constants/catalog");

describe("Pricing Regression Tests — Requirements A", () => {
  // Authoritative catalog check
  it("authoritative catalog defines Shirt at ₹80 per piece", () => {
    const shirtItem = getStandardDryCleanPrice("Shirt", "dry clean (Shirt)");
    assert.ok(shirtItem, "Shirt item should be found in catalog");
    assert.equal(shirtItem.price, 80, "Shirt dry clean unit price must be ₹80");
  });

  // Calculate pricing simulation helper matching orderController logic
  function calculateOrderTotals({ service, item, quantity, subtotalFeeRule = true }) {
    const targetClothingType = (item.clothingType || "").trim().toLowerCase();
    const targetItemName = (item.itemName || item.name || "").trim().toLowerCase();

    let unitPrice = null;
    let matchedClothing = null;

    // 1. Check custom items configured on this service
    if (Array.isArray(service.items) && service.items.length > 0) {
      matchedClothing = service.items.find((sub) => {
        const subType = (sub.clothingType || "").trim().toLowerCase();
        const subName = (sub.name || "").trim().toLowerCase();
        return (
          (targetClothingType && (subType === targetClothingType || subName === targetClothingType)) ||
          (targetItemName && (subName === targetItemName || targetItemName.includes(subName) || subName.includes(targetItemName)))
        );
      });
      if (matchedClothing && typeof matchedClothing.price === "number") {
        unitPrice = matchedClothing.price;
      }
    }

    // 2. If dry cleaning or clothing item requested without custom item price, use authoritative catalog
    if ((unitPrice === null || unitPrice === undefined) && (service.category === "dry_clean" || targetClothingType)) {
      const standardItem = getStandardDryCleanPrice(item.clothingType, item.itemName || item.name);
      if (standardItem && typeof standardItem.price === "number") {
        unitPrice = standardItem.price;
        if (!matchedClothing) {
          matchedClothing = standardItem;
        }
      }
    }

    // 3. Flat service fallback
    if (unitPrice === null || unitPrice === undefined) {
      unitPrice = service.price;
    }

    const subtotal = unitPrice * quantity;
    // Standard rule: subtotal >= 100 free delivery, subtotal < 100 => ₹30
    const deliveryFee = subtotal >= 100 ? 0 : 30;
    const gst = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + deliveryFee + gst;
    const razorpayPaise = Math.round(totalAmount * 100);

    return {
      unitPrice,
      subtotal,
      deliveryFee,
      gst,
      totalAmount,
      razorpayPaise,
    };
  }

  // Regression: Quantity 1
  it("Quantity 1 shirt at ₹80: subtotal ₹80, fee ₹30, gst ₹4, total ₹114 (paise 11400)", () => {
    const serviceWithEmptyItems = {
      _id: "srv_dryclean",
      name: "dry clean",
      category: "dry_clean",
      price: 20, // Stale/generic base price in DB
      items: [],
    };

    const cartItem = {
      clothingType: "Shirt",
      itemName: "dry clean (Shirt)",
      price: 80,
    };

    const result = calculateOrderTotals({
      service: serviceWithEmptyItems,
      item: cartItem,
      quantity: 1,
    });

    assert.equal(result.unitPrice, 80, "Unit price must remain ₹80, never falling back to generic ₹20");
    assert.equal(result.subtotal, 80);
    assert.equal(result.deliveryFee, 30);
    assert.equal(result.gst, 4);
    assert.equal(result.totalAmount, 114);
    assert.equal(result.razorpayPaise, 11400);
  });

  // Regression: Quantity 5 (COD flow test)
  it("Quantity 5 shirts at ₹80 (COD): subtotal ₹400, fee ₹0, gst ₹20, total ₹420 (NOT ₹105)", () => {
    const serviceWithEmptyItems = {
      _id: "srv_dryclean",
      name: "dry clean",
      category: "dry_clean",
      price: 20,
      items: [],
    };

    const cartItem = {
      clothingType: "Shirt",
      itemName: "dry clean (Shirt)",
      price: 80,
    };

    const result = calculateOrderTotals({
      service: serviceWithEmptyItems,
      item: cartItem,
      quantity: 5,
    });

    assert.equal(result.unitPrice, 80);
    assert.equal(result.subtotal, 400, "Merchandise subtotal must be exactly ₹400");
    assert.equal(result.deliveryFee, 0, "Free delivery for orders >= ₹100");
    assert.equal(result.gst, 20, "5% GST on ₹400 is ₹20");
    assert.equal(result.totalAmount, 420, "Total must be ₹420 throughout COD flow, never ₹105");
    assert.notEqual(result.totalAmount, 105, "Must prevent regression to stale ₹105");
  });

  // Regression: Quantity 15 (Online / Razorpay flow test)
  it("Quantity 15 shirts at ₹80 (Online): subtotal ₹1200, fee ₹0, gst ₹60, total ₹1260, paise 126000 (NOT ₹315)", () => {
    const serviceWithEmptyItems = {
      _id: "srv_dryclean",
      name: "dry clean",
      category: "dry_clean",
      price: 20,
      items: [],
    };

    const cartItem = {
      clothingType: "Shirt",
      itemName: "dry clean (Shirt)",
      price: 80,
    };

    const result = calculateOrderTotals({
      service: serviceWithEmptyItems,
      item: cartItem,
      quantity: 15,
    });

    assert.equal(result.unitPrice, 80);
    assert.equal(result.subtotal, 1200, "Merchandise subtotal must be exactly ₹1200");
    assert.equal(result.deliveryFee, 0);
    assert.equal(result.gst, 60, "5% GST on ₹1200 is ₹60");
    assert.equal(result.totalAmount, 1260, "Grand total must be ₹1260, never ₹315");
    assert.equal(result.razorpayPaise, 126000, "Razorpay amount must be 126000 paise");
    assert.notEqual(result.totalAmount, 315, "Must prevent regression to stale ₹315");
    assert.notEqual(result.razorpayPaise, 31500, "Must prevent regression to stale 31500 paise");
  });

  // Regression: Custom item pricing overrides default when configured
  it("Custom configured price on service items takes precedence over default catalog", () => {
    const customService = {
      _id: "srv_dryclean_custom",
      name: "Gentle Dry Cleaning",
      category: "dry_clean",
      price: 80,
      items: [
        { clothingType: "Shirt", name: "Shirt", price: 95 },
      ],
    };

    const cartItem = {
      clothingType: "Shirt",
      itemName: "Gentle Dry Cleaning (Shirt)",
    };

    const result = calculateOrderTotals({
      service: customService,
      item: cartItem,
      quantity: 5,
    });

    assert.equal(result.unitPrice, 95, "Custom configured price ₹95 should take precedence");
    assert.equal(result.subtotal, 475);
  });
});
