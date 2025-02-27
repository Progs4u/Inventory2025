const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const qrsService = require('../services/qrsService');
const { validationResult } = require('express-validator');
const qrsValidation = require('../validations/qrsValidation');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const [stats, assignedQRs] = await Promise.all([
            qrsService.getQRsStats(),
            qrsService.getAllAssignedQRs()
        ]);

        res.render('pages/inventory/qrs', {
            stats,
            assignedQRs
        });
    } catch (error) {
        console.error('Error fetching QRs data:', error);
        res.status(500).send('Server error');
    }
});

router.post('/generate', authMiddleware, qrsValidation.generateQR, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const newQR = await qrsService.generateNewQR();
        res.json({ success: true, data: newQR });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/generate-batch', authMiddleware, async (req, res) => {
    const { quantity } = req.body;
    
    if (![48, 80].includes(Number(quantity))) {
        return res.status(400).json({ 
            success: false, 
            message: 'Quantity must be either 48 or 80' 
        });
    }

    try {
        const newQRs = await qrsService.generateBatchQRs(quantity);
        res.json({ 
            success: true, 
            data: newQRs,
            count: newQRs.length 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

router.get('/api/search/items', async (req, res) => {
    const results = await qrsService.searchItems(req.query.q);
    res.json(results);
});

router.get('/api/search/containers', async (req, res) => {
    const results = await qrsService.searchContainers(req.query.q);
    res.json(results);
});

router.get('/api/search/storages', async (req, res) => {
    const results = await qrsService.searchStorages(req.query.q);
    res.json(results);
});

router.post('/:uuid/assign', async (req, res) => {
    try {
        const { uuid } = req.params;
        const { type, id } = req.body;
        
        if (!type || !id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const updateData = {};
        switch(type) {
            case 'item':
                updateData.item_id = id;
                break;
            case 'container':
                updateData.container_id = id;
                break;
            case 'storage':
                updateData.storage_id = id;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid type'
                });
        }

        const result = await qrsService.assignQR(uuid, updateData);
        
        // Determine redirect URL based on assignment type
        let redirectUrl;
        if (result.item_id) {
            redirectUrl = `/items/${result.item_id}`;
        } else if (result.container_id) {
            redirectUrl = `/containers/${result.container_id}`;
        } else if (result.storage_id) {
            redirectUrl = `/storage/${result.storage_id}`;
        }

        res.json({
            success: true,
            message: 'QR code assigned successfully',
            redirect: redirectUrl
        });
    } catch (error) {
        console.error('Error assigning QR code:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});



module.exports = router;
