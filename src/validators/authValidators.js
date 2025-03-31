const { check } = require("express-validator");

const validateRegister = [
    check("username")
        .isString().withMessage("Username must be a string")
        .trim()
        .notEmpty().withMessage("Username is required"),
    check("password")
        .isString().withMessage("Password must be a string")
        .trim()
        .notEmpty().withMessage("Password is required"),
];

const validateLogin = [
    check("username")
        .isString().withMessage("Username must be a string")
        .trim()
        .notEmpty().withMessage("Username is required"),
    check("password")
        .isString().withMessage("Password must be a string")
        .trim()
        .notEmpty().withMessage("Password is required"),
];

module.exports = { validateRegister, validateLogin };
