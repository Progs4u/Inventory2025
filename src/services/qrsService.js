const db = require('../database');

class QRsService {
    async getQRsStats() {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total_qrs,
                COUNT(CASE WHEN assigned_at IS NOT NULL THEN 1 END) as assigned_qrs,
                COUNT(CASE WHEN assigned_at IS NULL THEN 1 END) as unassigned_qrs
            FROM inv_qr_codes
        `);
        return result.rows[0];
    }

    async getAllAssignedQRs() {
        const result = await db.query(`
            SELECT 
                qr.*,
                i.name as item_name,
                c.name as container_name,
                s.name as storage_name
            FROM inv_qr_codes qr
            LEFT JOIN inv_items i ON qr.item_id = i.id
            LEFT JOIN inv_containers c ON qr.container_id = c.id
            LEFT JOIN inv_storages s ON qr.storage_id = s.id
            WHERE qr.assigned_at IS NOT NULL
            ORDER BY qr.assigned_at DESC
        `);
        return result.rows;
    }

    async getQRByUUID(uuid) {
        const { rows: [qrData] } = await db.query(`
            SELECT qr.*, 
                i.name as item_name, 
                i.description as item_description,
                c.name as container_name,
                c.description as container_description,
                s.name as storage_name,
                s.description as storage_description
            FROM inv_qr_codes qr
            LEFT JOIN inv_items i ON qr.item_id = i.id
            LEFT JOIN inv_containers c ON qr.container_id = c.id
            LEFT JOIN inv_storages s ON qr.storage_id = s.id
            WHERE qr.uuid = $1`,
            [uuid]
        );
        return qrData;
    }

    async generateBatchQRs(quantity) {
        const result = await db.query(`
            INSERT INTO inv_qr_codes (uuid)
            SELECT gen_random_uuid()
            FROM generate_series(1, $1)
            RETURNING uuid
        `, [quantity]);
        return result.rows;
    }

    // Add these methods to existing qrsService.js
    async searchItems(query) {
        const result = await db.query(`
            SELECT id, name, description 
            FROM inv_items 
            WHERE name ILIKE $1 OR description ILIKE $1
            ORDER BY name
            LIMIT 10
        `, [`%${query}%`]);
        return result.rows;
    }

    async searchContainers(query) {
        const result = await db.query(`
            SELECT id, name, description 
            FROM inv_containers 
            WHERE name ILIKE $1 OR description ILIKE $1
            ORDER BY name
            LIMIT 10
        `, [`%${query}%`]);
        return result.rows;
    }

    async searchStorages(query) {
        const result = await db.query(`
            SELECT id, name, description 
            FROM inv_storages 
            WHERE name ILIKE $1 OR description ILIKE $1
            ORDER BY name
            LIMIT 10
        `, [`%${query}%`]);
        return result.rows;
    }

    async searchUnassignedItems(query) {
        const result = await db.query(`
            SELECT id, name, description 
            FROM inv_items 
            WHERE (name ILIKE $1 OR description ILIKE $1)
            AND id NOT IN (SELECT item_id FROM inv_qr_codes WHERE item_id IS NOT NULL)
            ORDER BY name
            LIMIT 10
        `, [`%${query}%`]);
        return result.rows;
    }

    async searchUnassignedContainers(query) {
        const result = await db.query(`
            SELECT id, name, description 
            FROM inv_containers 
            WHERE (name ILIKE $1 OR description ILIKE $1)
            AND id NOT IN (SELECT container_id FROM inv_qr_codes WHERE container_id IS NOT NULL)
            ORDER BY name
            LIMIT 10
        `, [`%${query}%`]);
        return result.rows;
    }

    async searchUnassignedStorages(query) {
        const result = await db.query(`
            SELECT id, name, description 
            FROM inv_storages 
            WHERE (name ILIKE $1 OR description ILIKE $1)
            AND id NOT IN (SELECT storage_id FROM inv_qr_codes WHERE storage_id IS NOT NULL)
            ORDER BY name
            LIMIT 10
        `, [`%${query}%`]);
        return result.rows;
    }

    async assignQR(uuid, updateData) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            const result = await client.query(`
                UPDATE inv_qr_codes 
                SET 
                    item_id = $1,
                    container_id = $2,
                    storage_id = $3,
                    assigned_at = CURRENT_TIMESTAMP
                WHERE uuid = $4
                RETURNING item_id, container_id, storage_id
            `, [
                updateData.item_id || null,
                updateData.container_id || null,
                updateData.storage_id || null,
                uuid
            ]);
    
            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getQRAssignmentForItem(itemId) {
        const result = await db.query(`
            SELECT uuid, assigned_at, status
            FROM inv_qr_codes
            WHERE item_id = $1
            AND assigned_at IS NOT NULL
            LIMIT 1
        `, [itemId]);
        return {
            uuid: result.rows[0]?.uuid || null,
            status: result.rows[0]?.status || null,
            assigned_at: result.rows[0]?.assigned_at || null
        };
    }
    
    
    async updateQRStatus(itemId, newStatus) {
        const result = await db.query(`
            UPDATE inv_qr_codes 
            SET status = $1
            WHERE item_id = $2
            RETURNING uuid, status
        `, [newStatus, itemId]);
        
        if (!result.rows[0]) {
            throw new Error('No QR code found for this item');
        }
        return result.rows[0];
    }
    
    



}



module.exports = new QRsService();
