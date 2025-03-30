require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('./config/db');

const app = express();
app.use(express.json());

// Apply rate limiting globally.
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
});
app.use(limiter);

// Initialize database (create table if not exists)
const initDb = async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("Users table ensured.");
    } catch (error) {
        console.error("Error initializing database", error);
    }
};
initDb();

// Set up routes
app.use('/auth', require('./routes/auth'));
app.use('/protected', require('./routes/protected'));

// Global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Auth API listening on port ${PORT}`);
});