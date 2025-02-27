const { body } = require('express-validator');

exports.generateQR = [
    body('quantity')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Quantity must be between 1 and 100')
];
