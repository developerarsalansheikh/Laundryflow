/**
 * Central Authoritative Catalog for Laundry Services & Clothing Items
 * Used to ensure 100% price parity between Mobile/Web clients and Backend database.
 */

const DEFAULT_DRY_CLEAN_ITEMS = [
  { clothingType: "Shirt", name: "Shirt", price: 80, estimatedHours: 48 },
  { clothingType: "T-Shirt", name: "T-Shirt", price: 70, estimatedHours: 48 },
  { clothingType: "Trouser", name: "Trouser", price: 100, estimatedHours: 48 },
  { clothingType: "Jeans", name: "Jeans", price: 110, estimatedHours: 48 },
  { clothingType: "Suit", name: "Suit (2-Piece)", price: 280, estimatedHours: 48 },
  { clothingType: "Blazer", name: "Blazer", price: 180, estimatedHours: 48 },
  { clothingType: "Coat", name: "Coat / Jacket", price: 220, estimatedHours: 48 },
  { clothingType: "Jacket", name: "Jacket", price: 200, estimatedHours: 48 },
  { clothingType: "Dress", name: "Dress / Gown", price: 190, estimatedHours: 48 },
  { clothingType: "Saree", name: "Saree (Silk / Designer)", price: 180, estimatedHours: 48 },
  { clothingType: "Kurta", name: "Kurta / Pyjama", price: 120, estimatedHours: 48 },
  { clothingType: "Sherwani", name: "Sherwani", price: 350, estimatedHours: 48 },
  { clothingType: "Bedsheet", name: "Bedsheet", price: 150, estimatedHours: 48 },
  { clothingType: "Blanket", name: "Blanket / Quilt", price: 250, estimatedHours: 48 },
  { clothingType: "Other", name: "Other Delicate Item", price: 120, estimatedHours: 48 },
];

/**
 * Find authoritative price for a clothing item in standard catalog
 */
function getStandardDryCleanPrice(clothingType, itemName) {
  const targetType = (clothingType || "").trim().toLowerCase();
  const targetName = (itemName || "").trim().toLowerCase();

  const found = DEFAULT_DRY_CLEAN_ITEMS.find((it) => {
    const subType = it.clothingType.toLowerCase();
    const subName = it.name.toLowerCase();
    return (
      (targetType && (subType === targetType || subName === targetType)) ||
      (targetName && (subName === targetName || targetName.includes(subName) || subName.includes(targetName)))
    );
  });

  return found || null;
}

module.exports = {
  DEFAULT_DRY_CLEAN_ITEMS,
  getStandardDryCleanPrice,
};
