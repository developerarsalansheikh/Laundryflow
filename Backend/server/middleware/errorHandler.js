const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Something went wrong on the server. Please try again.";

  // ── Mongoose Errors ───────────────────────────

  // Bad ObjectId — wrong ID format
  if (err.name === "CastError") {
    statusCode = 404;
    message = "Resource not found — invalid ID";
  }

  // Duplicate key — email/phone already exists
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} is already registered`;
  }

  // Validation error — required fields missing
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // ── JWT Errors ────────────────────────────────

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Session invalid. Please sign in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Session expired. Please sign in again.";
  }

  let code = err.code || (statusCode === 404 ? "NOT_FOUND" : statusCode === 401 ? "UNAUTHORIZED" : statusCode === 403 ? "FORBIDDEN" : statusCode === 400 ? "BAD_REQUEST" : "SERVER_ERROR");

  // ── Response ──────────────────────────────────
  return res.status(statusCode).json({
    success: false,
    status: statusCode,
    code,
    message,
    // sirf development mein stack trace dikhao
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
