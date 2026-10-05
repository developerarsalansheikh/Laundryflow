/**
 * Phone number normalization for LaundryFlow mobile app
 * Ensures standard 10-digit format across Signup, Login, and OTP verification
 */

export const normalizePhoneNumber = (input) => {
  if (!input) return '';
  let cleaned = String(input).trim().replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Retain only digits
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length > 10) {
    const last10 = digits.slice(-10);
    if (/^[6-9]\d{9}$/.test(last10)) {
      return last10;
    }
  }
  return digits;
};

export const isValidPhoneNumber = (input) => {
  const normalized = normalizePhoneNumber(input);
  return /^[6-9]\d{9}$/.test(normalized);
};
