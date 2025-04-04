const redis = require('redis');

// Future Improvement: If using password authentication, add a password field here
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

redisClient.on('error', (err) => console.error('Redis error', err));

module.exports = redisClient;