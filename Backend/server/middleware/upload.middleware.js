const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// File filter to restrict uploads to allowed formats
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file format. Allowed formats: jpg, jpeg, png, webp"), false);
  }
};

// Size limit of 5MB
const limits = {
  fileSize: 5 * 1024 * 1024,
};

// 1. Profile Upload Storage
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "laundry-app/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "fill", gravity: "auto" }],
  },
});

const profileUpload = multer({
  storage: profileStorage,
  fileFilter,
  limits,
});

// 2. Service Upload Storage
const serviceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "laundry-app/services",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "fill", gravity: "auto" }],
  },
});

const serviceUpload = multer({
  storage: serviceStorage,
  fileFilter,
  limits,
});

// 3. Laundry Logo Upload Storage
const laundryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "laundry-app/laundries",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "fill", gravity: "auto" }],
  },
});

const laundryUpload = multer({
  storage: laundryStorage,
  fileFilter,
  limits,
});

// 4. Order Pickup Photo Storage
const pickupPhotoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "laundry-app/pickup-photos",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 1200, crop: "limit" }],
  },
});

const pickupPhotoUpload = multer({
  storage: pickupPhotoStorage,
  fileFilter,
  limits,
});

module.exports = { profileUpload, serviceUpload, laundryUpload, pickupPhotoUpload };
