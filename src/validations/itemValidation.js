const { body, param } = require('express-validator');

const itemValidation = {
    create: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Item name is required')
            .isLength({ max: 100 })
            .withMessage('Item name must be less than 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description must be less than 500 characters'),
        body('category')
            .notEmpty()
            .withMessage('Category is required')
            .isIn(['electronics', '3d_printing', 'painting', 'cleaning', 'building_materials', 'other'])
            .withMessage('Invalid category'),
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
            .withMessage('Invalid storage ID'),
        body('container_id')
            .optional()
            .custom((value) => {
                if (value === '' || value === null) return true;
                return Number.isInteger(Number(value));
            })
            .withMessage('Invalid container ID'),
        body('quantity')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Quantity must be a positive number'),
        body('voltage')
            .optional()
            .customSanitizer(value => (value === '' || value === null) ? null : parseFloat(value))
            .isFloat({ min: 0 })
            .withMessage('Voltage must be a positive number'),        
        body('weight_grams')
            .optional()
            .customSanitizer(value => value === '' ? null : value)
            .isFloat({ min: 0 })
            .withMessage('Weight must be a positive number')
        
    ],
    update: [
        // Same as create
    ],
    delete: [
        param('id')
            .isInt()
            .withMessage('Invalid item ID')
            .notEmpty()
            .withMessage('Item ID is required')
    ]
};

module.exports = itemValidation;
