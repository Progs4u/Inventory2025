
const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const roomService = require('../services/roomService');
const roomValidation = require('../validations/roomValidation');
const db = require('../database');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        const rooms = await roomService.getAllRooms();
        res.render('pages/inventory/rooms', { rooms });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.render('pages/inventory/rooms', { error: 'Failed to load rooms' });
    }
});

router.post('/', roomValidation.create, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, description } = req.body;
        await roomService.createRoom(name, description);
        res.redirect('/rooms');
    } catch (error) {
        console.error('Error creating room:', error);
        res.redirect('/rooms');
    }
});

router.put('/:id', roomValidation.update, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, description } = req.body;
        await roomService.updateRoom(req.params.id, name, description);
        res.redirect('/rooms');
    } catch (error) {
        console.error('Error updating room:', error);
        res.redirect('/rooms');
    }
});

router.delete('/:id', roomValidation.delete, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        await roomService.deleteRoom(req.params.id);
        res.redirect('/rooms');
    } catch (error) {
        console.error('Error deleting room:', error);
        res.redirect('/rooms');
    }
});

module.exports = router;

const methodOverride = require('method-override');
router.use(methodOverride('_method'));

/**
 * Room Management Routes
 * 
 * Purpose:
 * - Physical location tracking
 * - Room capacity management
 * - Space utilization
 * 
 * Endpoints:
 * GET /rooms: List all rooms
 * POST /rooms: Create new room
 * PUT /rooms/:id: Update room
 * DELETE /rooms/:id: Remove room
 */
