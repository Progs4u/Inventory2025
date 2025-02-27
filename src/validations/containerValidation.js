const { body, param } = require('express-validator');

const containerValidation = {
    create: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Container name is required')
            .isLength({ max: 100 })
            .withMessage('Container name must be less than 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description must be less than 500 characters'),
        body('room_id')
            .optional()
            .custom((value) => {
                if (value === '' || value === null) return true;
                return Number.isInteger(Number(value));
            })
            .withMessage('Invalid room ID'),
        body('storage_id')
            .optional()
            .custom((value) => {
                if (value === '' || value === null) return true;
                return Number.isInteger(Number(value));
            })
            .withMessage('Invalid storage ID')
    ],
    update: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Container name is required')
            .isLength({ max: 100 })
            .withMessage('Container name must be less than 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description must be less than 500 characters'),
        body('room_id')
            .optional()
            .custom((value) => {
                if (value === '' || value === null) return true;
                return Number.isInteger(Number(value));
            })
            .withMessage('Invalid room ID'),
        body('storage_id')
            .optional()
            .custom((value) => {
                if (value === '' || value === null) return true;
                return Number.isInteger(Number(value));
            })
            .withMessage('Invalid storage ID')
    ],
    delete: [
        param('id')
            .isInt()
            .withMessage('Invalid container ID')
            .notEmpty()
            .withMessage('Container ID is required')
    ]
};

module.exports = containerValidation;