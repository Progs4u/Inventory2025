const express = require('express');
const router = express.Router();
const qrsService = require('../services/qrsService');
const db = require('../database');

router.get('/search/:type', async (req, res) => {
    const { type } = req.params;
    const { q } = req.query;
    
    try {
        let results;
        switch(type) {
            case 'items':
                results = await qrsService.searchUnassignedItems(q);
                break;
            case 'containers':
                results = await qrsService.searchUnassignedContainers(q);
                break;
            case 'storages':
                results = await qrsService.searchUnassignedStorages(q);
                break;
            default:
                return res.status(400).json({ error: 'Invalid type' });
        }
        
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/locations/rooms', async (req, res) => {
    try {
        const result = await db.query('SELECT id, name FROM inv_rooms ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

router.get('/locations/storages', async (req, res) => {
    try {
        const result = await db.query('SELECT id, name FROM inv_storages ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching storages:', error);
        res.status(500).json({ error: 'Failed to fetch storages' });
    }
});

router.get('/locations/containers', async (req, res) => {
    try {
        const result = await db.query('SELECT id, name FROM inv_containers ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching containers:', error);
        res.status(500).json({ error: 'Failed to fetch containers' });
    }
});


module.exports = router;