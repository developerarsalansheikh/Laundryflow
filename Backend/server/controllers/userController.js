const User = require("../models/userModels");
const Address = require("../models/addressModels");
const Order = require("../models/orderModels");
const bcrypt = require("bcryptjs");
const cloudinary = require("../config/cloudinary");

// ─────────────────────────────────────────────
// @desc    Apna profile dekho
// @route   GET /api/users/profile
// @access  Private
// ─────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-otp -otpExpiry -refreshToken -passwordResetToken -passwordResetExpiry"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("GetProfile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Profile update karo
// @route   PUT /api/users/profile
// @access  Private
// ─────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, profileImage } = req.body;

    if (!name && !email && !phone && !profileImage) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, phone, or profile image to update",
      });
    }

    const updateFields = {};

    // Email already in use check
    if (email) {
      const emailTrimmed = email.trim().toLowerCase();
      const emailExists = await User.findOne({
        email: emailTrimmed,
        _id: { $ne: req.user._id },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "This email address is already in use by another account",
        });
      }
      updateFields.email = emailTrimmed;
    }

    // Phone already in use check
    if (phone) {
      const digitsOnly = String(phone).replace(/\D/g, "");
      const normalizedPhone = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
      if (normalizedPhone.length !== 10) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 10-digit phone number",
        });
      }
      const phoneExists = await User.findOne({
        phone: normalizedPhone,
        _id: { $ne: req.user._id },
      });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: "This phone number is already registered to another account",
        });
      }
      updateFields.phone = normalizedPhone;
    }

    if (name) updateFields.name = name.trim();
    if (profileImage) updateFields.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select("-otp -otpExpiry -refreshToken -passwordResetToken -passwordResetExpiry");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("UpdateProfile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update profile. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Profile image update karo
// @route   PUT /api/users/profile-image
// @access  Private
// ─────────────────────────────────────────────
const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    // Get current user to retrieve old publicId
    const currentUser = await User.findById(req.user._id).select("+profileImagePublicId");

    // Delete old image from Cloudinary if it exists
    if (currentUser && currentUser.profileImagePublicId) {
      try {
        await cloudinary.uploader.destroy(currentUser.profileImagePublicId);
      } catch (err) {
        console.error("Old profile image delete failed from Cloudinary:", err.message);
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        profileImage: req.file.path,
        profileImagePublicId: req.file.filename,
      },
      { new: true }
    ).select("-otp -otpExpiry -refreshToken -passwordResetToken -passwordResetExpiry");

    return res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      data: {
        profileImage: user.profileImage,
        profileImagePublicId: user.profileImagePublicId,
      },
    });
  } catch (error) {
    console.error("UpdateProfileImage error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update image. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Account delete karo
// @route   DELETE /api/users/profile
// @access  Private
// ─────────────────────────────────────────────
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please confirm your password to delete your account",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // User ka data delete karo
    await Address.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);

    res.clearCookie("refreshToken");

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("DeleteAccount error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to delete account. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Apne orders dekho (user dashboard)
// @route   GET /api/users/my-orders
// @access  Private
// ─────────────────────────────────────────────
const getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate("services.service", "name price category")
      .populate("deliveryPartner", "name phone")
      .populate("pickupAddress")
      .populate("deliveryAddress")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    const processedOrders = orders.map((o) => {
      const obj = o.toObject ? o.toObject() : { ...o };
      if (!obj.pickupAddress && obj.pickupAddressSnapshot?.fullAddress) {
        obj.pickupAddress = obj.pickupAddressSnapshot;
      }
      if (!obj.deliveryAddress && obj.deliveryAddressSnapshot?.fullAddress) {
        obj.deliveryAddress = obj.deliveryAddressSnapshot;
      }
      return obj;
    });

    return res.status(200).json({
      success: true,
      count: processedOrders.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: processedOrders,
    });
  } catch (error) {
    console.error("GetMyOrders error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders. Please try again.",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════
//                ADDRESS FUNCTIONS
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
// @desc    Naya address add karo
// @route   POST /api/users/address
// @access  Private
// ─────────────────────────────────────────────
const addAddress = async (req, res) => {
  try {
    const { label, fullAddress, city, state, pincode, landmark, isDefault } = req.body;

    if (!fullAddress || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Full address, city, state, and pincode are required",
      });
    }

    // Agar isDefault true hai toh baaki sab false karo
    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id },
        { isDefault: false }
      );
    }

    // Agar pehla address hai toh automatically default banao
    const existingCount = await Address.countDocuments({ user: req.user._id });

    const address = await Address.create({
      user: req.user._id,
      label: label || "home",
      fullAddress,
      city,
      state,
      pincode,
      landmark: landmark || "",
      isDefault: isDefault || existingCount === 0, // pehla address default
    });

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: address,
    });
  } catch (error) {
    console.error("AddAddress error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to add address. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Apne saare addresses dekho
// @route   GET /api/users/address
// @access  Private
// ─────────────────────────────────────────────
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    console.error("GetAddresses error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch addresses. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Address update karo
// @route   PUT /api/users/address/:id
// @access  Private
// ─────────────────────────────────────────────
const updateAddress = async (req, res) => {
  try {
    // Sirf apna address update kar sakta hai
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Agar isDefault true karna hai
    if (req.body.isDefault === true || req.body.isDefault === "true") {
      await Address.updateMany(
        { user: req.user._id, _id: { $ne: req.params.id } },
        { isDefault: false }
      );
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: updatedAddress,
    });
  } catch (error) {
    console.error("UpdateAddress error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update address. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Address delete karo
// @route   DELETE /api/users/address/:id
// @access  Private
// ─────────────────────────────────────────────
const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const wasDefault = address.isDefault;
    await Address.findByIdAndDelete(req.params.id);

    // Agar default address delete hua toh naya default set karo
    if (wasDefault) {
      const nextAddress = await Address.findOne({ user: req.user._id }).sort({
        createdAt: -1,
      });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("DeleteAddress error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to delete address. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Default address set karo
// @route   PUT /api/users/address/:id/set-default
// @access  Private
// ─────────────────────────────────────────────
const setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Pehle sab false karo
    await Address.updateMany(
      { user: req.user._id },
      { isDefault: false }
    );

    // Fir ye wala default karo
    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address set successfully",
      data: address,
    });
  } catch (error) {
    console.error("SetDefaultAddress error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to set default address. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Add / toggle laundry to user favorites (Feature A)
// @route   POST /api/users/favorites/:laundryId
// @access  Private/User
// ─────────────────────────────────────────────
const addFavoriteLaundry = async (req, res) => {
  try {
    const { laundryId } = req.params;
    const Laundry = require("../models/laundryModels");
    const laundry = await Laundry.findById(laundryId);

    if (!laundry) {
      return res.status(404).json({
        success: false,
        message: "Laundry store not found",
      });
    }

    const user = await User.findById(req.user._id);
    const isAlreadyFav = user.favoriteLaundries?.some((id) => id.toString() === laundryId);

    if (isAlreadyFav) {
      return res.status(200).json({
        success: true,
        message: "Laundry is already in favorites",
        isFavorite: true,
        data: user.favoriteLaundries,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { favoriteLaundries: laundryId } },
      { new: true }
    ).populate("favoriteLaundries", "name logo address city state pincode location serviceRadius maxServiceDistanceKm defaultTurnaroundHours status isOpen isActive");

    return res.status(200).json({
      success: true,
      message: "Laundry added to favorites",
      isFavorite: true,
      data: updatedUser.favoriteLaundries,
    });
  } catch (error) {
    console.error("AddFavorite error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to add favorite. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Remove laundry from user favorites (Feature A)
// @route   DELETE /api/users/favorites/:laundryId
// @access  Private/User
// ─────────────────────────────────────────────
const removeFavoriteLaundry = async (req, res) => {
  try {
    const { laundryId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { favoriteLaundries: laundryId } },
      { new: true }
    ).populate("favoriteLaundries", "name logo address city state pincode location serviceRadius maxServiceDistanceKm defaultTurnaroundHours status isOpen isActive");

    return res.status(200).json({
      success: true,
      message: "Laundry removed from favorites",
      isFavorite: false,
      data: updatedUser.favoriteLaundries,
    });
  } catch (error) {
    console.error("RemoveFavorite error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to remove favorite. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Get user's favorite laundries (Feature A)
// @route   GET /api/users/favorites
// @access  Private/User
// ─────────────────────────────────────────────
const getFavoriteLaundries = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "favoriteLaundries",
      match: { isActive: true },
      select: "name logo description address city state pincode location serviceRadius maxServiceDistanceKm distancePricing defaultTurnaroundHours status isOpen isActive",
    });

    return res.status(200).json({
      success: true,
      count: user?.favoriteLaundries?.length || 0,
      data: user?.favoriteLaundries || [],
    });
  } catch (error) {
    console.error("GetFavoriteLaundries error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch favorites. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Synchronize guest favorites into authenticated user account (Feature A)
// @route   POST /api/users/favorites/sync
// @access  Private/User
// ─────────────────────────────────────────────
const syncFavorites = async (req, res) => {
  try {
    const { laundryIds = [] } = req.body;
    if (!Array.isArray(laundryIds) || laundryIds.length === 0) {
      const user = await User.findById(req.user._id).populate("favoriteLaundries");
      return res.status(200).json({
        success: true,
        message: "No favorites to sync",
        data: user.favoriteLaundries || [],
      });
    }

    const Laundry = require("../models/laundryModels");
    const validLaundries = await Laundry.find({
      _id: { $in: laundryIds },
      isActive: true,
    }).select("_id");

    const validIds = validLaundries.map((l) => l._id);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { favoriteLaundries: { $each: validIds } } },
      { new: true }
    ).populate({
      path: "favoriteLaundries",
      select: "name logo description address city state pincode location serviceRadius maxServiceDistanceKm distancePricing defaultTurnaroundHours status isOpen isActive",
    });

    return res.status(200).json({
      success: true,
      message: `${validIds.length} favorites successfully synchronized`,
      count: updatedUser.favoriteLaundries?.length || 0,
      data: updatedUser.favoriteLaundries || [],
    });
  } catch (error) {
    console.error("SyncFavorites error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to sync favorites. Please try again.",
      error: error.message,
    });
  }
};

module.exports = {
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
};