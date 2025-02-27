const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const containerService = require('../services/containerService');
const containerValidation = require('../validations/containerValidation');
const db = require('../database');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        const [containers, rooms, storages] = await Promise.all([
            containerService.getAllContainers(),
            db.query('SELECT id, name FROM inv_rooms ORDER BY name'),
            db.query('SELECT id, name FROM inv_storages ORDER BY name')
        ]);
        
        res.render('pages/inventory/containers', { 
            containers: containers,
            rooms: rooms.rows,
            storages: storages.rows
        });
    } catch (error) {
        console.error('Error fetching containers:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/', containerValidation.create, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, description, room_id, storage_id } = req.body;
        await containerService.createContainer(name, description, room_id, storage_id);
        res.redirect('/containers');
    } catch (error) {
        console.error('Error creating container:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', containerValidation.update, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, description, room_id, storage_id } = req.body;
        await containerService.updateContainer(req.params.id, name, description, room_id, storage_id);
        res.redirect('/containers');
    } catch (error) {
        console.error('Error updating container:', error);
        res.redirect('/containers');
    }
});

router.delete('/:id', containerValidation.delete, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        await containerService.deleteContainer(req.params.id);
        res.redirect('/containers');
    } catch (error) {
        console.error('Error deleting container:', error);
        res.redirect('/containers');
    }
});

// Add this route handler
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [container, items] = await Promise.all([
            containerService.getContainerById(req.params.id),
            containerService.getContainerItems(req.params.id)
        ]);
        
        if (!container) {
            return res.status(404).redirect('/containers');
        }

        res.render('pages/inventory/container_detail', { 
            container,
            items
        });
    } catch (error) {
        console.error('Error fetching container details:', error);
        res.redirect('/containers');
    }
});


module.exports = router;

/**
 * Container Management Routes
 * 
 * Purpose:
 * - Container tracking
 * - Content management
 * - Location assignment
 * 
 * Endpoints:
 * GET /containers: List containers
 * POST /containers: Create container
 * PUT /containers/:id: Update container
 * DELETE /containers/:id: Remove container
 */
