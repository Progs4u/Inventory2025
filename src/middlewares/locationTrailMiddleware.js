const db = require('../database');

async function locationTrailMiddleware(req, res, next) {
    try {
        const itemId = req.params.id;
        
        // Update items with containers
        await db.query(`
            UPDATE inv_items
            SET 
                storage_id = COALESCE(inv_items.storage_id, ic.storage_id),
                room_id = COALESCE(inv_items.room_id, ic.room_id)
            FROM 
                inv_containers ic
            WHERE 
                inv_items.container_id = ic.id
                AND inv_items.id = $1
        `, [itemId]);

        // Update items directly in storage
        await db.query(`
            UPDATE inv_items
            SET 
                room_id = COALESCE(inv_items.room_id, is2.room_id)
            FROM 
                inv_storages is2
            WHERE 
                inv_items.storage_id = is2.id
                AND inv_items.container_id IS NULL
                AND inv_items.id = $1
        `, [itemId]);

        next();
    } catch (err) {
        console.error('Location trail update error:', err);
        next(err);
    }
}

module.exports = { locationTrailMiddleware };
