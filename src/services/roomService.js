const db = require('../database');

class RoomService {
    async getAllRooms() {
        const result = await db.query(`
            SELECT r.*, 
                   COUNT(DISTINCT i.id) + COUNT(DISTINCT c.id) + COUNT(DISTINCT s.id) as total_items
            FROM inv_rooms r 
            LEFT JOIN inv_items i ON i.room_id = r.id 
            LEFT JOIN inv_containers c ON c.room_id = r.id
            LEFT JOIN inv_storages s ON s.room_id = r.id
            GROUP BY r.id
            ORDER BY r.name
        `);
        return result.rows;
    }

    async createRoom(name, description) {
        return await db.query(
            'INSERT INTO inv_rooms (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
    }

    async updateRoom(roomId, name, description) {
        return await db.query(
            'UPDATE inv_rooms SET name = $1, description = $2 WHERE id = $3 RETURNING *',
            [name, description, roomId]
        );
    }

    // Add other room-related database operations
    async deleteRoom(roomId) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            // Update references in related tables
            await client.query('UPDATE inv_items SET room_id = NULL WHERE room_id = $1', [roomId]);
            await client.query('UPDATE inv_containers SET room_id = NULL WHERE room_id = $1', [roomId]);
            await client.query('UPDATE inv_storages SET room_id = NULL WHERE room_id = $1', [roomId]);
            
            // Delete the room
            const result = await client.query('DELETE FROM inv_rooms WHERE id = $1', [roomId]);
            
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
}

module.exports = new RoomService();
