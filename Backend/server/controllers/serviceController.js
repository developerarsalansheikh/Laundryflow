const Service = require("../models/serviceModels");
const cloudinary = require("../config/cloudinary");

// ─────────────────────────────────────────────
// @desc    Services dekho
// @route   GET /api/services?laundryId=xxx&category=wash
// @access  Public
// ─────────────────────────────────────────────
const getAllServices = async (req, res) => {
  try {
    const { category, laundryId, all } = req.query;

    const filter = {};
    if (all !== "true") {
      filter.isActive = true;
    }
    if (category) filter.category = category;
    if (laundryId) filter.laundryId = laundryId;

    const services = await Service.find(filter)
      .populate("laundryId", "name city")
      .sort({ category: 1, price: 1 });

    // FIX 2: estimatedHours text calculations
    const data = services.map(s => {
      const sObj = s.toObject();
      const hours = sObj.estimatedHours || 24;
      sObj.estimatedText = hours < 24 
        ? `${hours} ${hours === 1 ? 'hour' : 'hours'}` 
        : `${hours / 24} ${hours / 24 === 1 ? 'day' : 'days'}`;
      return sObj;
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("GetAllServices error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch services. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Single service dekho
// @route   GET /api/services/:id
// @access  Public
// ─────────────────────────────────────────────
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      "laundryId",
      "name city address"
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const sObj = service.toObject();
    const hours = sObj.estimatedHours || 24;
    sObj.estimatedText = hours < 24 
      ? `${hours} ghante` 
      : `${hours / 24} din`;

    return res.status(200).json({
      success: true,
      data: sObj,
    });
  } catch (error) {
    console.error("GetServiceById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch service. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Nai service create karo
// @route   POST /api/services
// @access  Private/Admin
// ─────────────────────────────────────────────
const createService = async (req, res) => {
  try {
    const { name, description, price, unit, category, estimatedHours } = req.body;

    if (!name || !price || !category || estimatedHours === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, price, category, and estimatedHours are required",
      });
    }

    const hours = Number(estimatedHours);
    if (isNaN(hours) || hours < 1) {
      return res.status(400).json({
        success: false,
        message: "Estimated time must be a valid number and at least 1 hour",
      });
    }

    // Admin ki apni laundry mein duplicate check
    const existing = await Service.findOne({
      name: name.trim(),
      laundryId: req.user.laundryId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A service with this name already exists",
      });
    }

    const service = await Service.create({
      name,
      description: description || "",
      price,
      unit: unit || "per_piece",
      category,
      estimatedHours: hours,
      laundryId: req.user.laundryId, // admin ki laundry automatically
      image: req.file ? req.file.path : "",
      imagePublicId: req.file ? req.file.filename : null,
    });

    return res.status(201).json({
      success: true,
      message: "Service successfully create ho gayi",
      data: service,
    });
  } catch (error) {
    console.error("CreateService error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create service. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Service update karo
// @route   PUT /api/services/:id
// @access  Private/Admin
// ─────────────────────────────────────────────
const updateService = async (req, res) => {
  try {
    // Admin sirf apni laundry ki service update kar sakta hai
    const service = await Service.findOne({
      _id: req.params.id,
      laundryId: req.user.laundryId,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (req.file) {
      if (service.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(service.imagePublicId);
        } catch (err) {
          console.error("Old service image delete failed:", err.message);
        }
      }
      req.body.image = req.file.path;
      req.body.imagePublicId = req.file.filename;
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Service successfully update ho gayi",
      data: updatedService,
    });
  } catch (error) {
    console.error("UpdateService error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update service. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Service delete karo
// @route   DELETE /api/services/:id
// @access  Private/Admin
// ─────────────────────────────────────────────
const deleteService = async (req, res) => {
  try {
    // Admin sirf apni laundry ki service delete kar sakta hai
    const service = await Service.findOne({
      _id: req.params.id,
      laundryId: req.user.laundryId,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (service.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(service.imagePublicId);
      } catch (err) {
        console.error("Deleted service image cleanup failed:", err.message);
      }
    }

    await Service.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Service successfully delete ho gayi",
    });
  } catch (error) {
    console.error("DeleteService error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to delete service. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Service toggle karo
// @route   PUT /api/services/:id/toggle
// @access  Private/Admin
// ─────────────────────────────────────────────
const toggleServiceStatus = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      laundryId: req.user.laundryId,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    service.isActive = !service.isActive;
    await service.save();

    return res.status(200).json({
      success: true,
      message: `Service ${service.isActive ? "activate" : "deactivate"} ho gayi`,
      data: { isActive: service.isActive },
    });
  } catch (error) {
    console.error("ToggleServiceStatus error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to change service status. Please try again.",
      error: error.message,
    });
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
};