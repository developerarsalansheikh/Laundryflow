/**
 * sanitize.middleware.js
 * XSS + input sanitization middleware for LaundryFlow backend.
 *
 * Uses the 'xss' package to sanitize user-controlled string fields.
 * Only sanitizes fields where raw HTML is NOT expected.
 * Does NOT sanitize binary data, IDs, numbers, or structured fields.
 */

const xss = require("xss");

// Fields that are user-controlled text and should be sanitized
const SANITIZE_FIELDS = new Set([
  "name",
  "email",
  "phone",
  "address",
  "street",
  "city",
  "state",
  "pincode",
  "landmark",
  "label",
  "specialInstructions",
  "notes",
  "message",
  "reason",
  "cancelReason",
  "description",
  "title",
  "subject",
  "feedback",
  "laundryName",
  "businessName",
  "ownerName",
  "bio",
  "comment",
  "serviceName",
  "category",
  "tag",
]);

// XSS options: strip all HTML tags (no allowlist)
const xssOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
};

/**
 * Recursively sanitize string values in an object.
 * Only sanitizes keys in SANITIZE_FIELDS.
 * Leaves all other fields (IDs, booleans, numbers, arrays of IDs, etc.) untouched.
 */
const sanitizeObject = (obj, depth = 0) => {
  if (!obj || typeof obj !== "object" || depth > 5) return;

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (typeof value === "string" && SANITIZE_FIELDS.has(key)) {
      obj[key] = xss(value.trim(), xssOptions);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitizeObject(value, depth + 1);
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "object" && item !== null) {
          sanitizeObject(item, depth + 1);
        }
      });
    }
  }
};

/**
 * Express middleware: sanitize req.body and req.query for XSS
 * Attached globally in server.js after body parser
 */
const sanitizeInputs = (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === "object") {
      sanitizeObject(req.query);
    }
  } catch (err) {
    // Never let sanitization fail a request
    console.error("[Sanitize] Error during sanitization:", err.message);
  }
  next();
};

module.exports = { sanitizeInputs };
