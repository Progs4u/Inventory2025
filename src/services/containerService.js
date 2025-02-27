const db = require('../database');

class ContainerService {
    async getAllContainers() {
        const result = await db.query(`
            SELECT 
                c.*,
                COALESCE(r.name, sr.name) as room_name,
                s.name as storage_name,
                COUNT(i.id) as items_count
            FROM inv_containers c
            LEFT JOIN inv_rooms r ON c.room_id = r.id
            LEFT JOIN inv_storages s ON c.storage_id = s.id
            LEFT JOIN inv_rooms sr ON s.room_id = sr.id
            LEFT JOIN inv_items i ON i.container_id = c.id
            GROUP BY c.id, r.name, s.name, sr.name
            ORDER BY c.name
        `);
        return result.rows;
    }
    
    async createContainer(name, description, room_id, storage_id) {
        return await db.query(
            'INSERT INTO inv_containers (name, description, room_id, storage_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, room_id || null, storage_id || null]
        );
    }

    async updateContainer(id, name, description, room_id, storage_id) {
        return await db.query(
            'UPDATE inv_containers SET name = $1, description = $2, room_id = $3, storage_id = $4 WHERE id = $5 RETURNING *',
            [name, description, room_id || null, storage_id || null, id]
        );
    }

    async deleteContainer(id) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            // Update items to remove container reference
            await client.query('UPDATE inv_items SET container_id = NULL WHERE container_id = $1', [id]);
            
            // Delete the container
            const result = await client.query('DELETE FROM inv_containers WHERE id = $1', [id]);
            
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getContainerById(id) {
        const result = await db.query(`
            SELECT c.*, 
                   r.name as room_name,
                   s.name as storage_name
            FROM inv_containers c
            LEFT JOIN inv_rooms r ON c.room_id = r.id
            LEFT JOIN inv_storages s ON c.storage_id = s.id
            WHERE c.id = $1
        `, [id]);
        return result.rows[0];
    }

    async getContainerItems(id) {
        const result = await db.query(`
            SELECT i.*
            FROM inv_items i
            WHERE i.container_id = $1
            ORDER BY i.name
        `, [id]);
        return result.rows;
    }
}

module.exports = new ContainerService();
