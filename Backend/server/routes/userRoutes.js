const express = require("express");
const {
  getProfile,
  updateProfile,
  updateProfileImage,
  deleteAccount,
  getMyOrders,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  addFavoriteLaundry,
  removeFavoriteLaundry,
  getFavoriteLaundries,
  syncFavorites,
} = require("../controllers/userController");
const { profileUpload } = require("../middleware/upload.middleware");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // sab routes ke liye login zaroori

// ── Profile routes ────────────────────────────
router.get("/profile", getProfile);                   // GET    /api/users/profile
router.put("/profile", updateProfile);                // PUT    /api/users/profile
router.put("/profile-image", profileUpload.single("image"), updateProfileImage);     // PUT    /api/users/profile-image
router.delete("/profile", deleteAccount);             // DELETE /api/users/profile

// ── Orders (user dashboard) ───────────────────
router.get("/my-orders", getMyOrders);                // GET    /api/users/my-orders

// ── Favorites routes (Feature A) ──────────────
router.get("/favorites", getFavoriteLaundries);                  // GET    /api/users/favorites
router.post("/favorites/sync", syncFavorites);                   // POST   /api/users/favorites/sync
router.post("/favorites/:laundryId", addFavoriteLaundry);       // POST   /api/users/favorites/:laundryId
router.delete("/favorites/:laundryId", removeFavoriteLaundry);   // DELETE /api/users/favorites/:laundryId

// ── Address routes ────────────────────────────
router.post("/address", addAddress);                              // POST   /api/users/address
router.get("/address", getAddresses);                             // GET    /api/users/address
router.put("/address/:id", updateAddress);                        // PUT    /api/users/address/:id
router.delete("/address/:id", deleteAddress);                     // DELETE /api/users/address/:id
router.put("/address/:id/set-default", setDefaultAddress);        // PUT    /api/users/address/:id/set-default

module.exports = router;