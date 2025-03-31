const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const redisClient = require('../config/redis');

// Promisify Redis get/set methods for async/await usage
const redisGetAsync = promisify(redisClient.get).bind(redisClient);
const redisSetAsync = promisify(redisClient.set).bind(redisClient);

/**
 * Retrieves a user from Redis by username
 * The user data is stored as a JSON string under the key "user:{username}"
 * @param {string} username - The username of the user
 * @returns {Promise<Object|null>} - The parsed user object if found, otherwise null
 */
async function getUserByUsername(username) {
    const userData = await redisGetAsync(`user:${username}`);
    return userData ? JSON.parse(userData) : null;
}

/**
 * Creates a new user in Redis
 * The password is hashed using bcrypt and the user object is stored as a JSON string
 * @param {string} username - The username of the new user
 * @param {string} password - The encrypted password
 * @returns {Promise<Object>} - The newly created user object
 */
async function createUser(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { username, password: hashedPassword };
    await redisSetAsync(`user:${username}`, JSON.stringify(user));
    return user;
}

module.exports = {
    getUserByUsername,
    createUser,
};
