require("dotenv").config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

if (!process.env.DATASTORE) {
  console.error("FATAL ERROR: DATASTORE is not defined.");
  process.exit(1);
}

require("express-async-errors");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const sequelize = require("./config/sequelize");
const User = require("./models/User");
const logger = require("./config/logger");

const app = express();

// Use Helmet to set secure HTTP headers
// Future Improvement: In production, enforce HTTPS by redirecting HTTP to HTTPS and using secure cookies
// Future Improvement: Customize Helmet configuration
// The current default configuration sets common security headers (CSP, X-Frame-Options, etc.)
// In production, consider customizing settings such as Content Security Policy, HSTS, and Referrer Policy
app.use(helmet());

// Enable CORS for cross-origin requests
// Future Improvement: Configure CORS to allow only trusted origins in production
app.use(cors());

// Enable response compression for improved performance
app.use(compression());

app.use(express.json());

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(globalLimiter);

// Login Rate Limiting specifically for the /auth/login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later.",
});
app.use("/auth/login", loginLimiter);

// Log every request
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Health Check Endpoint to verify database connectivity and API status
app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: "OK" });
  } catch (error) {
    logger.error("Health check failed: " + error);
    res.status(500).json({ status: "DOWN", error: error.message });
  }
});

// Initialize Database by syncing Sequelize models
const initDb = async () => {
  try {
    await sequelize.sync();
    logger.info("Database synchronized and User model is ready.");
  } catch (error) {
    logger.error("Error synchronizing the database: " + error);
    process.exit(1);
  }
};
initDb();

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/protected", require("./routes/protected"));

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err}`);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Auth API listening on port ${PORT}`);
});

// Graceful Shutdown: Handle termination signals to close connections cleanly
// Future Improvement: Enhance this logic to ensure all resources (e.g., DB, cache) are properly released
const shutdown = () => {
  logger.info("Received kill signal, shutting down gracefully.");
  server.close(() => {
    logger.info("Closed out remaining connections.");
    // Close the Sequelize connection
    sequelize.close();
    process.exit(0);
  });
  // Force shutdown if connections don't close within 10 seconds
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
