require("dotenv").config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

require("dotenv").config();
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

app.use(helmet());
app.use(cors());
app.use(compression());

// Future Improvement: Enforce HTTPS in production by redirecting HTTP to HTTPS and using secure cookies.
app.use(express.json());

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(globalLimiter);

// Login Rate Limiting
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

// Health Check Endpoint
app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: "OK" });
  } catch (error) {
    logger.error("Health check failed: " + error);
    res.status(500).json({ status: "DOWN", error: error.message });
  }
});

// Initialize Database
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
