const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const logger = require("../config/logger");

const router = express.Router();

/**
 * Protected Endpoint
 * - Requires a valid JWT (verified by authMiddleware).
 * - Logs access for auditability.
 */
router.get("/", authMiddleware, (req, res) => {
  try {
    logger.info(`User ${req.user.username} accessed the protected endpoint.`);
    res.status(200).json({
      message: `Hello ${req.user.username}, you have accessed a protected endpoint!`,
    });
  } catch (error) {
    logger.error(`Error in protected endpoint: ${error}`);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
