const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const redisClient = require('../config/redis');

const router = express.Router();

const isPasswordComplex = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

// Registration Endpoint
router.post('/register',
    body('username').isString().trim().notEmpty(),
    body('password').isString().trim().notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }
        const { username, password } = req.body;

        if (!isPasswordComplex(password)) {
            return res.status(400).json({ error: 'Password does not meet complexity requirements.' });
        }

        try {
            // Ensure unique username
            const userCheck = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
            if (userCheck.rows.length > 0) {
                return res.status(400).json({ error: 'Username already exists.' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
            return res.status(200).json({ message: 'User registered successfully.' });
        } catch (error) {
            console.error("Registration error:", error);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    });

// Login Endpoint
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
            const userResult = await pool.query('SELECT id, password FROM users WHERE username = $1', [username]);
            if (userResult.rows.length === 0) {
                return res.status(401).json({ error: 'Authentication failed.' });
            }
            const user = userResult.rows[0];
            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
                return res.status(401).json({ error: 'Authentication failed.' });
            }

            // Generate token
            const token = jwt.sign({ userId: user.id, username }, process.env.JWT_SECRET || 'defaultsecret', { expiresIn: '1h' });
            redisClient.setex(`session:${user.id}`, 3600, token);
            return res.status(200).json({ message: 'Authentication successful.', token });
        } catch (error) {
            console.error("Login error:", error);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    });

// Logout Endpoint: Invalidate the session in Redis.
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