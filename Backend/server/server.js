const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config(); // Load environment variables first

// ── Startup Environment Validation ───────────────────────────────────────────
const REQUIRED_ENV = ["MONGO_URL", "JWT_SECRET", "PORT"];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`[STARTUP] Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}
if ((process.env.JWT_SECRET || "").length < 32) {
  console.error("[STARTUP] JWT_SECRET is too weak — must be at least 32 characters");
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/dbConfig");
const errorHandler = require("./middleware/errorHandler");
const { sanitizeInputs } = require("./middleware/sanitize.middleware");

const app = express();
const PORT = process.env.PORT || 3001;

const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
// Build allowed origins list from FRONTEND_URL (supports comma-separated values)
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Origin function: allow listed origins; mobile native apps send no Origin header (pass-through)
const corsOriginFn = (origin, callback) => {
  // No origin = native mobile / server-to-server request — allow
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error(`CORS: origin ${origin} not allowed`));
};

const corsOptions = {
  origin: corsOriginFn,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
};

const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);

// Initialize Socket.io Handler
const { initSocket } = require("./socket/socketHandler");
initSocket(io);

// ── Database Connect ──────────────────────────
connectDB();

// ── Security Middlewares ──────────────────────

// Helmet — Secures HTTP headers
app.use(helmet());

// CORS — Allow connections from listed frontend origins; mobile native passes without origin
app.use(cors(corsOptions));

// Rate Limiting — Protect against request flooding
// Authenticated mobile app usage makes many legitimate API calls per session
// (dashboard, orders, socket events, notifications, etc.) — limit must accommodate real usage
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes per IP (generous for mobile app)
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
  // Skip rate limiting for OPTIONS/CORS preflight requests
  skip: (req) => req.method === 'OPTIONS',
  keyGenerator: (req) => {
    // Use Authorization token fingerprint for authenticated users to avoid
    // penalizing shared NAT/proxy IPs (e.g., office networks)
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      // hash last 16 chars of token as the key (partial, non-reversible)
      const tokenSuffix = authHeader.slice(-16);
      return `auth:${tokenSuffix}`;
    }
    return req.ip || 'unknown';
  },
  message: {
    success: false,
    message: "Too many requests, please try again after 15 minutes",
  },
});
app.use("/api", globalLimiter);

// Strict rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 200 : 30, // 200 in dev for automated tests, 30 in prod
  message: {
    success: false,
    message: "Too many attempts, please try again after 15 minutes",
  },
});

// ── Body Parser ───────────────────────────────
app.use(
  express.json({
    limit: "5mb", // reduced from 10mb — images go via Cloudinary directly
    verify: (req, res, buf) => {
      req.rawBody = buf; // preserved for Razorpay webhook signature verification
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());

// Handle malformed JSON — return clean 400 instead of Express default 500
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed" || err.status === 400) {
    return res.status(400).json({ success: false, message: "Invalid JSON in request body" });
  }
  next(err);
});

// ── Input Sanitization ────────────────────────

// MongoDB operator injection prevention ($gt, $ne, $where, etc.)
// Use sanitize() directly — avoids read-only req.query conflict in Node.js HTTP
app.use((req, _res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body, { replaceWith: "_" });
  if (req.params) mongoSanitize.sanitize(req.params, { replaceWith: "_" });
  next();
});

// XSS sanitization for user-controlled string fields
app.use(sanitizeInputs);

// ── Health Check ──────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LaundryApp API is running",
    version: "2.0.0",
    environment: process.env.NODE_ENV,
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "LaundryFlow API healthy",
    version: "2.0.0",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/laundry", require("./routes/laundryRoutes"));
app.use("/api/super-admin", require("./routes/superAdminRoutes"));
app.use("/api/super-admin", require("./routes/subscriptionPlanRoutes")); // Subscription Plans
app.use("/api/super-admin", require("./routes/subscriptionRoutes"));     // Subscriptions
app.use("/api/super-admin/support-tickets", require("./routes/supportRoutes")); // Support Tickets
app.use("/api/super-admin/settings", require("./routes/settingsRoutes")); // Platform Settings
app.use("/api/delivery", require("./routes/deliveryRoutes"));
app.use("/api/delivery-zones", require("./routes/deliveryZoneRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// ── 404 Handler ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ── Global Error Handler ──────────────────────
app.use(errorHandler);

// ── Server Start ──────────────────────────────
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || "development"}`);
});

module.exports = io;