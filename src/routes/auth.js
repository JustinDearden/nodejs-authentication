const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const redisClient = require('../config/redis');
const passwordSchema = require('../config/passwordValidator');

const router = express.Router();

// Registration Endpoint using Sequelize and password-validator
router.post('/register',
    body('username').isString().trim().notEmpty(),
    body('password').isString().trim().notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }
        const { username, password } = req.body;

        // Validate password using password-validator
        if (!passwordSchema.validate(password)) {
            return res.status(400).json({ error: 'Password does not meet complexity requirements.' });
        }

        try {
            // Ensure unique username using Sequelize's findOne method
            const existingUser = await User.findOne({ where: { username } });
            if (existingUser) {
                return res.status(400).json({ error: 'Username already exists.' });
            }
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);
            // Create the new user
            await User.create({ username, password: hashedPassword });
            return res.status(200).json({ message: 'User registered successfully.' });
        } catch (error) {
            console.error("Registration error:", error);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    });

// Login Endpoint (can remain largely the same, but now uses Sequelize to query users)
router.post('/login',
    body('username').isString().trim().notEmpty(),
    body('password').isString().trim().notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { username, password } = req.body;
        try {
            // Retrieve user using Sequelize
            const user = await User.findOne({ where: { username } });
            if (!user) {
                return res.status(401).json({ error: 'Authentication failed.' });
            }
            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
                return res.status(401).json({ error: 'Authentication failed.' });
            }
            // Generate token
            const token = jwt.sign({ userId: user.id, username }, process.env.JWT_SECRET || 'defaultsecret', { expiresIn: '1h' });
            // Store token in Redis for session management
            redisClient.setex(`session:${user.id}`, 3600, token);
            return res.status(200).json({ message: 'Authentication successful.', token });
        } catch (error) {
            console.error("Login error:", error);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    });

// Logout Endpoint remains the same
router.post('/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header.' });
    }
    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
        redisClient.del(`session:${payload.userId}`, (err) => {
            if (err) {
                console.error('Redis error:', err);
                return res.status(500).json({ error: 'Internal server error.' });
            }
            return res.status(200).json({ message: 'Logout successful.' });
        });
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token.' });
    }
});

module.exports = router;
