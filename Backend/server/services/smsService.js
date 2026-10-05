const https = require("https");
const { normalizePhone } = require("../utils/phoneNormalizer");

/**
 * Universal SMS Gateway Service
 * Supports Fast2SMS (Indian carrier OTP route & Quick route), 2Factor, and Twilio.
 * Preserves strict privacy: NEVER logs secrets, OTP values, or sensitive payload data.
 */

/**
 * Helper to make HTTPS requests without external dependencies
 */
const makeHttpsRequest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("SMS Gateway request timed out after 10000ms"));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

/**
 * Send OTP via Fast2SMS
 */
const sendViaFast2SMS = async (normalizedPhone, otp, message) => {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return { sent: false, reason: "Missing FAST2SMS_API_KEY" };

  try {
    const route = process.env.FAST2SMS_ROUTE || "otp";
    let payload;

    if (route === "otp" && otp) {
      payload = JSON.stringify({
        route: "otp",
        variables_values: String(otp),
        numbers: normalizedPhone,
      });
    } else {
      payload = JSON.stringify({
        route: "q",
        message: message || `Your LaundryFlow verification code is: ${otp}. Valid for 10 minutes.`,
        language: "english",
        numbers: normalizedPhone,
      });
    }

    const options = {
      hostname: "www.fast2sms.com",
      path: "/dev/bulkV2",
      method: "POST",
      headers: {
        authorization: apiKey.trim(),
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const response = await makeHttpsRequest(options, payload);
    const isSuccess =
      response.statusCode === 200 &&
      (response.body?.return === true || response.body?.status_code === 200);

    console.log(
      `[SMS Provider: Fast2SMS] Delivery attempt to +91-XXXXX${normalizedPhone.slice(-4)} | HTTP ${
        response.statusCode
      } | Success: ${isSuccess}`
    );

    if (!isSuccess) {
      console.warn(
        `[SMS Provider: Fast2SMS] Response message: ${JSON.stringify(
          response.body?.message || response.body
        )}`
      );
    }

    return { sent: isSuccess, provider: "Fast2SMS", response: response.body };
  } catch (error) {
    console.error("[SMS Provider: Fast2SMS] Error during dispatch:", error.message);
    return { sent: false, provider: "Fast2SMS", error: error.message };
  }
};

/**
 * Send OTP via 2Factor
 */
const sendVia2Factor = async (normalizedPhone, otp) => {
  const apiKey = process.env.TWOFACTOR_API_KEY;
  if (!apiKey) return { sent: false, reason: "Missing TWOFACTOR_API_KEY" };

  try {
    const encodedOtp = encodeURIComponent(otp);
    const options = {
      hostname: "2factor.in",
      path: `/API/V1/${apiKey.trim()}/SMS/${normalizedPhone}/${encodedOtp}/LaundryFlow`,
      method: "GET",
    };

    const response = await makeHttpsRequest(options);
    const isSuccess =
      response.statusCode === 200 && response.body?.Status === "Success";

    console.log(
      `[SMS Provider: 2Factor] Delivery attempt to +91-XXXXX${normalizedPhone.slice(-4)} | HTTP ${
        response.statusCode
      } | Success: ${isSuccess}`
    );

    return { sent: isSuccess, provider: "2Factor", response: response.body };
  } catch (error) {
    console.error("[SMS Provider: 2Factor] Error during dispatch:", error.message);
    return { sent: false, provider: "2Factor", error: error.message };
  }
};

/**
 * Send SMS via Twilio
 */
const sendViaTwilio = async (normalizedPhone, message) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    return { sent: false, reason: "Missing Twilio configuration" };
  }

  try {
    const twilio = require("twilio");
    const client = twilio(sid, token);
    const result = await client.messages.create({
      body: message,
      from,
      to: `+91${normalizedPhone}`,
    });

    console.log(
      `[SMS Provider: Twilio] Dispatched message to +91-XXXXX${normalizedPhone.slice(-4)} | SID: ${
        result.sid
      } | Status: ${result.status}`
    );
    return { sent: true, provider: "Twilio", sid: result.sid, status: result.status };
  } catch (error) {
    console.error("[SMS Provider: Twilio] Delivery error:", error.message);
    return { sent: false, provider: "Twilio", error: error.message };
  }
};

/**
 * Unified sendSMS entrypoint.
 * Automatically tries available SMS gateways in order:
 * 1. Fast2SMS (optimal for India)
 * 2. 2Factor
 * 3. Twilio
 */
const sendSMS = async (phone, message, otp = null) => {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    console.error(`[SMS Dispatcher] Invalid phone number provided: ${phone}`);
    return { success: false, message: "Invalid phone number format" };
  }

  // 1. Fast2SMS
  if (process.env.FAST2SMS_API_KEY) {
    const result = await sendViaFast2SMS(normalized, otp, message);
    if (result.sent) {
      return { success: true, provider: "Fast2SMS" };
    }
  }

  // 2. 2Factor (if OTP available)
  if (process.env.TWOFACTOR_API_KEY && otp) {
    const result = await sendVia2Factor(normalized, otp);
    if (result.sent) {
      return { success: true, provider: "2Factor" };
    }
  }

  // 3. Twilio
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const result = await sendViaTwilio(normalized, message);
    if (result.sent) {
      return { success: true, provider: "Twilio" };
    }
  }

  // If no external gateway responded or configured
  console.warn(
    `[SMS Provider] Notice: No active SMS gateway succeeded. Ensure FAST2SMS_API_KEY, TWOFACTOR_API_KEY, or Twilio is configured in Backend/.env.`
  );

  return {
    success: false,
    message: "SMS gateway delivery pending configuration in Backend/.env",
  };
};

/**
 * High-level helper specifically for OTP verification codes
 */
const sendOTPviaSMS = async (phone, otp) => {
  const message = `Your LaundryFlow verification code is: ${otp}. Valid for 10 minutes.`;
  return await sendSMS(phone, message, otp);
};

module.exports = {
  sendSMS,
  sendOTPviaSMS,
};
