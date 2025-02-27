const { body, param } = require('express-validator');

const storageValidation = {
    create: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Storage name is required')
            .isLength({ max: 100 })
            .withMessage('Storage name must be less than 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description must be less than 500 characters'),
        body('room_id')
            .optional()
            .isInt()
            .withMessage('Invalid room ID')
    ],
    update: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Storage name is required')
            .isLength({ max: 100 })
            .withMessage('Storage name must be less than 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description must be less than 500 characters'),
        body('room_id')
            .optional()
            .isInt()
            .withMessage('Invalid room ID')
    ],
    delete: [
        param('id')
            .isInt()
            .withMessage('Invalid storage ID')
            .notEmpty()
            .withMessage('Storage ID is required')
    ]
};

module.exports = storageValidation;
