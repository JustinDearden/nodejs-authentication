require("dotenv").config();
require("express-async-errors");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const sequelize = require("./config/sequelize");
const User = require("./models/User");
const logger = require("./config/logger");

const app = express();

// Security & CORS Middleware
app.use(helmet());
app.use(cors());

// JSON parser middleware
app.use(express.json());

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Log every request (basic example)
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
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
