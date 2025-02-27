const db = require('../database');

class StorageService {
    async getAllStorages() {
        const result = await db.query(`
            SELECT s.*, r.name as room_name,
                   COUNT(DISTINCT i.id) + COUNT(DISTINCT c.id) as total_items
            FROM inv_storages s
            LEFT JOIN inv_rooms r ON s.room_id = r.id
            LEFT JOIN inv_items i ON i.storage_id = s.id
            LEFT JOIN inv_containers c ON c.storage_id = s.id
            GROUP BY s.id, r.name
            ORDER BY s.name
        `);
        return result.rows;
    }

    async createStorage(name, description, room_id) {
        return await db.query(
            'INSERT INTO inv_storages (name, description, room_id) VALUES ($1, $2, $3) RETURNING *',
            [name, description, room_id || null]
        );
    }

    async updateStorage(id, name, description, room_id) {
        return await db.query(
            'UPDATE inv_storages SET name = $1, description = $2, room_id = $3 WHERE id = $4 RETURNING *',
            [name, description, room_id || null, id]
        );
    }

    async deleteStorage(id) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            // Update references in related tables
            await client.query('UPDATE inv_items SET storage_id = NULL WHERE storage_id = $1', [id]);
            await client.query('UPDATE inv_containers SET storage_id = NULL WHERE storage_id = $1', [id]);
            
            // Delete the storage
            const result = await client.query('DELETE FROM inv_storages WHERE id = $1', [id]);
            
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getStorageById(id) {
        const result = await db.query(`
            SELECT s.*, r.name as room_name
            FROM inv_storages s
            LEFT JOIN inv_rooms r ON s.room_id = r.id
            WHERE s.id = $1
        `, [id]);
        return result.rows[0];
    }

    async getStorageContainers(id) {
        const result = await db.query(`
            SELECT c.*, COUNT(i.id) as items_count
            FROM inv_containers c
            LEFT JOIN inv_items i ON i.container_id = c.id
            WHERE c.storage_id = $1
            GROUP BY c.id
            ORDER BY c.name
        `, [id]);
        return result.rows;
    }

    async getStorageItems(id) {
        const result = await db.query(`
            SELECT i.*
            FROM inv_items i
            WHERE i.storage_id = $1 AND i.container_id IS NULL
            ORDER BY i.name
        `, [id]);
        return result.rows;
    }
}

module.exports = new StorageService();
