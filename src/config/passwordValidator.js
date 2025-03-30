const PasswordValidator = require('password-validator');

const schema = new PasswordValidator();

schema
    .is().min(8)
    .has().uppercase()
    .has().lowercase()
    .has().digits()
    .has().not().spaces();

module.exports = schema;
