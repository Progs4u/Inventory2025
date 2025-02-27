const { body, param } = require('express-validator');

const VALID_STATUSES = {
    AVAILABLE: 'available',
    IN_USE: 'in_use',
    CHECKED_OUT: 'checked_out',
    USED_UP: 'used_up'
};

exports.assign = [
    param('uuid')
        .isUUID()
        .withMessage('Invalid QR code UUID'),
    body()
        .custom((value) => {
            const assignments = {
                item_id: value.item_id,
                container_id: value.container_id,
                storage_id: value.storage_id
            };
            
            const filledFields = Object.entries(assignments)
                .filter(([_, value]) => value !== undefined && value !== null && value !== '');
                
            if (filledFields.length !== 1) {
                throw new Error('Exactly one assignment type must be specified');
            }
            return true;
        })
];


exports.updateStatus = [
    param('uuid')
        .isUUID()
        .withMessage('Invalid QR code UUID'),
    body('status')
        .isIn(Object.values(VALID_STATUSES))
        .withMessage('Invalid status value'),
    body('notes')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters')
];

// Export statuses for use in other files
exports.VALID_STATUSES = VALID_STATUSES;