const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validateRegister, validateLogin } = require("../validators/authValidators");
const { validationResult } = require("express-validator");
const userStore = require("../stores");
const redisClient = require("../config/redis");
const passwordSchema = require("../config/passwordValidator");
const passwordErrorMessages = require("../config/errors/passwordErrorMessages");
const logger = require("../config/logger");

const router = express.Router();

/**
 * Registration Endpoint
 * - Validates username and password.
 * - Checks password complexity.
 * - Uses userStore to check if user exists and create the new user.
 */
router.post("/register", validateRegister, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Registration validation failed: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({ error: "Invalid input", details: errors.array() });
  }

  const { username, password } = req.body;

  // Validate password complexity
  const failedRules = passwordSchema.validate(password, { list: true });

  if (failedRules.length > 0) {
    const messages = failedRules.map(
      (rule) =>
        passwordErrorMessages[rule] || "Password does not meet complexity requirements."
    );
    logger.warn(`Password complexity validation failed for username ${username}: ${messages.join(" ")}`);
    return res.status(400).json({
      error: "Password does not meet complexity requirements.",
      details: messages,
    });
  }

  try {
    // Check if the username already exists using the abstracted store
    const existingUser = await userStore.getUserByUsername(username);
    if (existingUser) {
      logger.warn(`Attempt to register with an existing username: ${username}`);
      return res.status(400).json({ error: "Username already exists." });
    }

    // Create the new user using the abstracted store
    await userStore.createUser(username, password);

    logger.info(`User registered successfully: ${username}`);
    return res.status(200).json({ message: "User registered successfully." });
  } catch (error) {
    logger.error(`Registration error for username ${username}: ${error}`);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Login Endpoint
 * - Validates input.
 * - Retrieves the user via userStore and verifies the password.
 * - Generates a JWT token upon successful authentication.
 * - Stores the session token in Redis for session management.
 */
router.post("/login", validateLogin, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Login validation failed: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({ error: "Invalid input", details: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const userData = await userStore.getUserByUsername(username);
    if (!userData) {
      logger.warn(`Login attempt for non-existent username: ${username}`);
      return res.status(401).json({ error: "Authentication failed." });
    }

    // Validate password
    const valid = await bcrypt.compare(password, userData.password);
    if (!valid) {
      logger.warn(`Invalid password attempt for username: ${username}`);
      return res.status(401).json({ error: "Authentication failed." });
    }

    // Generate JWT token
    // Use userData.id if available; if using Redis mode,
    const token = jwt.sign(
      { userId: userData.id || username, username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Store token in Redis for session management (works for both modes)
    redisClient.setex(`session:${userData.id || username}`, 3600, token, (err) => {
      if (err) {
        logger.error(`Redis error storing token for username ${username}: ${err}`);
        return res.status(500).json({ error: "Internal server error." });
      }
      logger.info(`User logged in successfully: ${username}`);
      return res.status(200).json({ message: "Authentication successful.", token });
    });
  } catch (error) {
    logger.error(`Login error for username ${username}: ${error}`);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Logout Endpoint
 * - Validates the Authorization header.
 * - Verifies the JWT token.
 * - Deletes the session from Redis.
 */
router.post("/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Logout attempt with missing or invalid authorization header");
    return res.status(401).json({ error: "Missing or invalid authorization header." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Future Improvement: Consider implementing a token blacklist mechanism for immediate token revocation.
    redisClient.del(`session:${payload.userId}`, (err) => {
      if (err) {
        logger.error(`Redis error during logout for userId ${payload.userId}: ${err}`);
        return res.status(500).json({ error: "Internal server error." });
      }
      logger.info(`User logged out successfully: ${payload.username}`);
      return res.status(200).json({ message: "Logout successful." });
    });
  } catch (error) {
    logger.warn(`Logout failed due to invalid token: ${error}`);
    return res.status(401).json({ error: "Invalid token." });
  }
});

module.exports = router;
