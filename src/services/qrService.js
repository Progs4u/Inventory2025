const db = require('../database');

class QRService {
    async getQRByUUID(uuid) {
        const { rows: [qrData] } = await db.query(`
            SELECT qr.*, 
                i.name as item_name, 
                i.description as item_description,
                i.quantity as item_quantity,
                i.unit as item_unit,
                c.name as container_name,
                c.description as container_description,
                s.name as storage_name,
                s.description as storage_description,
                r.name as room_name,
                CASE 
                    WHEN qr.storage_id IS NOT NULL THEN (
                        SELECT COUNT(*)
                        FROM (
                            SELECT i2.id
                            FROM inv_items i2
                            WHERE i2.storage_id = qr.storage_id 
                            UNION ALL
                            SELECT i3.id
                            FROM inv_items i3
                            WHERE i3.container_id IN (SELECT id FROM inv_containers WHERE storage_id = qr.storage_id)
                        ) AS combined_items
                    )
                    WHEN qr.container_id IS NOT NULL THEN (
                        SELECT COUNT(*)
                        FROM inv_items i2
                        WHERE i2.container_id = qr.container_id
                    )
                    ELSE 0
                END as total_items
            FROM inv_qr_codes qr
            LEFT JOIN inv_items i ON qr.item_id = i.id
            LEFT JOIN inv_containers c ON qr.container_id = c.id
            LEFT JOIN inv_storages s ON qr.storage_id = s.id
            LEFT JOIN inv_rooms r ON i.room_id = r.id OR c.room_id = r.id OR s.room_id = r.id
            WHERE qr.uuid = $1`,
            [uuid]
        );
        return qrData;
    }
    
    
    
    
    

    
    async updateQRStatus(uuid, status, notes = '') {
        const result = await db.query(
            `UPDATE inv_qr_codes 
            SET status = $1,
                status_updated_at = CURRENT_TIMESTAMP,
                status_notes = $2
            WHERE uuid = $3
            RETURNING *`,
            [status, notes, uuid]
        );
        return result.rows[0];
    }

    async assignQR(uuid, assignmentData) {
        const data = {
            item_id: this._parseIntOrNull(assignmentData.item_id),
            container_id: this._parseIntOrNull(assignmentData.container_id),
            storage_id: this._parseIntOrNull(assignmentData.storage_id)
        };
    
        const result = await db.query(
            `UPDATE inv_qr_codes 
            SET item_id = $1, 
                container_id = $2, 
                storage_id = $3,
                assigned_at = CURRENT_TIMESTAMP,
                status = 'available'
            WHERE uuid = $4
            RETURNING *`,
            [data.item_id, data.container_id, data.storage_id, uuid]
        );
        console.log("inside assignQR function/qrService.js: \n" + result.rows[0]);
        return result.rows[0];
    }
    

    _parseIntOrNull(value) {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    }
}

module.exports = new QRService();
