const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
    res.status(200).json({ message: `Hello ${req.user.username}, you have accessed a protected endpoint!` });
});

module.exports = router;