const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const storageService = require('../services/storageService');
const storageValidation = require('../validations/storageValidation');
const db = require('../database');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        const [storages, rooms] = await Promise.all([
            storageService.getAllStorages(),
            db.query('SELECT id, name FROM inv_rooms ORDER BY name')
        ]);
        
        res.render('pages/inventory/storage', { 
            storages: storages,
            rooms: rooms.rows
        });
    } catch (error) {
        console.error('Error fetching storage:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/', storageValidation.create, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, description, room_id } = req.body;
        await storageService.createStorage(name, description, room_id);
        res.redirect('/storage');
    } catch (error) {
        console.error('Error creating storage:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', storageValidation.update, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, description, room_id } = req.body;
        await storageService.updateStorage(req.params.id, name, description, room_id);
        res.redirect('/storage');
    } catch (error) {
        console.error('Error updating storage:', error);
        res.redirect('/storage');
    }
});

router.delete('/:id', storageValidation.delete, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        await storageService.deleteStorage(req.params.id);
        res.redirect('/storage');
    } catch (error) {
        console.error('Error deleting storage:', error);
        res.redirect('/storage');
    }
});

// Add this route handler
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [storage, containers, items] = await Promise.all([
            storageService.getStorageById(req.params.id),
            storageService.getStorageContainers(req.params.id),
            storageService.getStorageItems(req.params.id)
        ]);
        
        if (!storage) {
            return res.status(404).redirect('/storage');
        }

        res.render('pages/inventory/storage_detail', { 
            storage,
            containers,
            items
        });
    } catch (error) {
        console.error('Error fetching storage details:', error);
        res.redirect('/storage');
    }
});


module.exports = router;

/*before update with validator and services
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        const [storages, rooms] = await Promise.all([
            db.query(`
                SELECT s.*, r.name as room_name,
                       COUNT(DISTINCT i.id) + COUNT(DISTINCT c.id) as total_items
                FROM inv_storages s
                LEFT JOIN inv_rooms r ON s.room_id = r.id
                LEFT JOIN inv_items i ON i.storage_id = s.id
                LEFT JOIN inv_containers c ON c.storage_id = s.id
                GROUP BY s.id, r.name
                ORDER BY s.name
            `),
            db.query('SELECT id, name FROM inv_rooms ORDER BY name')
        ]);
        
        res.render('pages/inventory/storage', { 
            storages: storages.rows,
            rooms: rooms.rows
        });
    } catch (error) {
        console.error('Error fetching storage:', error);
        res.redirect('/');
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, description, room_id } = req.body;
        await db.query(
            'INSERT INTO inv_storages (name, description, room_id) VALUES ($1, $2, $3)',
            [name, description, room_id || null]
        );
        res.redirect('/storage');
    } catch (error) {
        console.error('Error creating storage:', error);
        res.redirect('/storage');
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { name, description, room_id } = req.body;
        await db.query(
            'UPDATE inv_storages SET name = $1, description = $2, room_id = $3 WHERE id = $4',
            [name, description, room_id || null, req.params.id]
        );
        res.redirect('/storage');
    } catch (error) {
        console.error('Error updating storage:', error);
        res.redirect('/storage');
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM inv_storages WHERE id = $1', [req.params.id]);
        res.redirect('/storage');
    } catch (error) {
        console.error('Error deleting storage:', error);
        res.redirect('/storage');
    }
});

module.exports = router;

*/

/**
 * Storage Location Routes
 * 
 * Purpose:
 * - Storage area management
 * - Location hierarchies
 * - Capacity tracking
 * 
 * Endpoints:
 * GET /storage: List storage areas
 * POST /storage: Add storage location
 * PUT /storage/:id: Update storage
 * DELETE /storage/:id: Remove storage
 */
