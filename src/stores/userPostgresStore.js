const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Retrieves a user from the PostgreSQL database by username
 * @param {string} username - The username of the user
 * @returns {Promise<Object|null>} - The user object if found, otherwise null
 */
async function getUserByUsername(username) {
    return await User.findOne({ where: { username } });
}

/**
 * Creates a new user in the PostgreSQL database
 * The password is hashed using bcrypt for security
 * @param {string} username - The username of the new user
 * @param {string} password - The plain text password
 * @returns {Promise<Object>} - The newly created user object
 */
async function createUser(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await User.create({ username, password: hashedPassword });
}

module.exports = {
    getUserByUsername,
    createUser,
};
