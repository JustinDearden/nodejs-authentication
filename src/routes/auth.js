const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validateRegister, validateLogin } = require("../validators/authValidators");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const redisClient = require("../config/redis");
const passwordSchema = require("../config/passwordValidator");
const passwordErrorMessages = require("../config/errors/passwordErrorMessages");
const logger = require("../config/logger");

const router = express.Router();

/**
 * Registration Endpoint
 * - Validates username and password.
 * - Checks that the password meets complexity requirements.
 * - Ensures that the username is unique.
 * - Hashes the password and creates the new user.
 */
router.post("/register", validateRegister, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(
      `Registration validation failed: ${JSON.stringify(errors.array())}`
    );
    return res
      .status(400)
      .json({ error: "Invalid input", details: errors.array() });
  }
  const { username, password } = req.body;

  // Validate password complexity and get list of failed rules
  const failedRules = passwordSchema.validate(password, { list: true });
  if (failedRules.length > 0) {
    const messages = failedRules.map(
      (rule) =>
        passwordErrorMessages[rule] ||
        "Password does not meet complexity requirements."
    );
    logger.warn(
      `Password complexity validation failed for username ${username}: ${messages.join(
        " "
      )}`
    );
    return res.status(400).json({
      error: "Password does not meet complexity requirements.",
      details: messages,
    });
  }

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      logger.warn(
        `Attempt to register with an existing username: ${username}`
      );
      return res.status(400).json({ error: "Username already exists." });
    }

    // Hash the password and create the new user
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    logger.info(`User registered successfully: ${username}`);
    return res.status(200).json({ message: "User registered successfully." });
  } catch (error) {
    logger.error(`Registration error for username ${username}: ${error}`);
    return res.status(500).json({ error: "Internal server error." });
  }
}
);

/**
 * Login Endpoint
 * - Validates username and password.
 * - Retrieves the user and checks the password.
 * - Generates a JWT token and stores it in Redis for session management.
 *   Future Improvement: Implement account lockout mechanisms for repeated failed login attempts
 *   This will help mitigate brute-force attacks by temporarily disabling accounts after a set number of failures.
 */
router.post("/login", validateLogin, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Login validation failed: ${JSON.stringify(errors.array())}`);
    return res
      .status(400)
      .json({ error: "Invalid input", details: errors.array() });
  }

  const { username, password } = req.body;
  try {
    // Retrieve user using Sequelize
    const user = await User.findOne({ where: { username } });
    if (!user) {
      logger.warn(`Login attempt for non-existent username: ${username}`);
      return res.status(401).json({ error: "Authentication failed." });
    }

    // Validate password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      logger.warn(`Invalid password attempt for username: ${username}`);
      return res.status(401).json({ error: "Authentication failed." });
    }

    // Generate JWT token and store it in Redis
    const token = jwt.sign(
      { userId: user.id, username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    redisClient.setex(`session:${user.id}`, 3600, token, (err) => {
      if (err) {
        logger.error(
          `Redis error storing token for username ${username}: ${err}`
        );
        return res.status(500).json({ error: "Internal server error." });
      }
      logger.info(`User logged in successfully: ${username}`);
      return res
        .status(200)
        .json({ message: "Authentication successful.", token });
    });
  } catch (error) {
    logger.error(`Login error for username ${username}: ${error}`);
    return res.status(500).json({ error: "Internal server error." });
  }
}
);

/**
 * Logout Endpoint
 * - Checks for a valid Authorization header.
 * - Verifies the token.
 * - Deletes the session from Redis.
 */
router.post("/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Logout attempt with missing or invalid authorization header");
    return res
      .status(401)
      .json({ error: "Missing or invalid authorization header." });
  }

  const token = authHeader.split(" ")[1];
  try {
    // Verify the token using the secret key
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Future Improvement: Integrate comprehensive audit logging for token revocation events.
    // In addition to logging the logout success in the current log, consider capturing additional context,
    // such as the user's IP address, timestamp, and logout reason. This data can be stored in a secure audit log
    // to help track and investigate security incidents or user activity.
    redisClient.del(`session:${payload.userId}`, (err) => {
      if (err) {
        logger.error(
          `Redis error during logout for userId ${payload.userId}: ${err}`
        );
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
