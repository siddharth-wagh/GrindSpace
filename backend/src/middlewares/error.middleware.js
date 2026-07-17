export function notFoundHandler(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err);

  let status = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error";

  if (err.code === 11000) {
    status = 409;
    message = "A record with these details already exists";
  } else if (err.name === "ValidationError") {
    status = 400;
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid identifier";
  }

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}
