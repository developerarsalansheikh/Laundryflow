/**
 * Phone Number Normalizer Utility
 * Standardizes phone numbers across Signup, Login, OTP verification, and Database lookups.
 */

/**
 * Normalizes any phone number input to a standard 10-digit Indian mobile string.
 * @param {string|number} rawPhone
 * @returns {string|null} 10-digit phone string, or null if invalid
 */
const normalizePhone = (rawPhone) => {
  if (!rawPhone) return null;
  const str = String(rawPhone).trim();
  // Strip all non-digit characters
  const digits = str.replace(/\D/g, "");

  // If 12 digits starting with 91 (e.g. 919876543210)
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  // If 11 digits starting with 0 (e.g. 09876543210)
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }

  // If 10 digits
  if (digits.length === 10) {
    return digits;
  }

  // If longer than 10 digits and ends with a valid Indian 10-digit number
  if (digits.length > 10) {
    const last10 = digits.slice(-10);
    if (/^[6-9]\d{9}$/.test(last10)) {
      return last10;
    }
  }

  return null;
};

/**
 * Validates if the phone number is a valid 10-digit mobile number
 * @param {string} phone
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
  const normalized = normalizePhone(phone);
  return Boolean(normalized && /^[6-9]\d{9}$/.test(normalized));
};

/**
 * Generates an exhaustive MongoDB query condition to find a user by phone,
 * protecting against any legacy formatting discrepancies in the database.
 * @param {string} rawPhone
 * @returns {object} MongoDB query filter object
 */
const buildPhoneQuery = (rawPhone) => {
  const normalized = normalizePhone(rawPhone);
  if (!normalized) {
    return { phone: String(rawPhone).trim() };
  }
  return {
    $or: [
      { phone: normalized },
      { phone: `+91${normalized}` },
      { phone: `91${normalized}` },
      { phone: `+91 ${normalized}` },
      { phone: `0${normalized}` },
    ],
  };
};

module.exports = {
  normalizePhone,
  isValidPhone,
  buildPhoneQuery,
};
