const { body, param } = require('express-validator');

const roomValidation = {
    create: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Room name is required')
            .isLength({ max: 100 })
            .withMessage('Room name must be less than 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description must be less than 500 characters')
    ],
    update: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Room name is required')
            .isLength({ max: 100 })
            .withMessage('Room name must be less than 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description must be less than 500 characters')
    ],
    delete: [
        param('id')
            .isInt()
            .withMessage('Invalid room ID')
            .notEmpty()
            .withMessage('Room ID is required')
    ]
};

module.exports = roomValidation;
