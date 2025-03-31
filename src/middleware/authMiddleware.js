const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const redisClient = require("../config/redis");
const logger = require("../config/logger");

const redisGetAsync = promisify(redisClient.get).bind(redisClient);

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Missing or invalid authorization header.");
    return res
      .status(401)
      .json({ error: "Missing or invalid authorization header." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify the token's signature and expiration
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Future Improvement: Consider implementing a token blacklist mechanism for immediate token revocation.
    // Instead of relying solely on active session tokens stored in Redis, maintain a blacklist
    // of revoked tokens.
    // Check for an active session in Redis
    const sessionToken = await redisGetAsync(`session:${payload.username}`);
    if (!sessionToken || sessionToken !== token) {
      logger.warn(`Session token mismatch or expired for username ${payload.username}`);
      return res.status(401).json({ error: "Invalid or expired session." });
    }

    // Attach user info to the request object for downstream handlers
    req.user = payload;
    next();
  } catch (error) {
    logger.error(`Token verification error: ${error}`);
    return res.status(401).json({ error: "Invalid token." });
  }
};
