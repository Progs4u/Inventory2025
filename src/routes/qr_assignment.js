const express = require('express');
const router = express.Router();
const qrsService = require('../services/qrsService');

router.get('/:uuid', async (req, res) => {
    try {
        const qrCode = await qrsService.getQRByUUID(req.params.uuid);
        
        if (!qrCode) {
            return res.status(404).redirect('/');
        }

        if (qrCode.assigned_at) {
            if (qrCode.item_id) {
                return res.redirect(`/items/${qrCode.item_id}`);
            }
            if (qrCode.container_id) {
                return res.redirect(`/containers/${qrCode.container_id}`);
            }
            if (qrCode.storage_id) {
                return res.redirect(`/storage/${qrCode.storage_id}`);
            }

        } else {
            // If QR is not assigned, show assignment page
            res.render('pages/inventory/qr_assignment', { qrCode });
        }
    } catch (error) {
        console.error('Error processing QR code:', error);
        res.status(500).redirect('/');
    }
});


module.exports = router;
