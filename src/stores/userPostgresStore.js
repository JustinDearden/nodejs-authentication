const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Retrieves a user from the PostgreSQL database by username
 */
async function getUserByUsername(username) {
    return await User.findOne({ where: { username } });
}

/**
 * Creates a new user in the PostgreSQL database
 * The password is hashed using bcrypt for security
 */
async function createUser(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await User.create({ username, password: hashedPassword });
}

module.exports = {
    getUserByUsername,
    createUser,
};
