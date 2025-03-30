const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

module.exports = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token signature and expiration
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');

        // Check session in Redis
        redisClient.get(`session:${payload.userId}`, (err, sessionToken) => {
            if (err) {
                console.error('Redis error', err);
                return res.status(500).json({ error: 'Internal server error.' });
            }
            if (!sessionToken || sessionToken !== token) {
                return res.status(401).json({ error: 'Invalid or expired session.' });
            }
            // Attach user info to request
            req.user = payload;
            next();
        });
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token.' });
    }
};