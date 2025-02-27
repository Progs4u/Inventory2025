const db = require('../database');

class ItemService {
    async getAllItems(category, search) {
        let query = `
            SELECT i.*, 
                   it.category,
                   COALESCE(c.name, s.name, r.name) as location,
                   c.name as container_name,
                   s.name as storage_name,
                   r.name as room_name
            FROM inv_items i
            LEFT JOIN inv_item_types it ON i.item_type_id = it.id
            LEFT JOIN inv_containers c ON i.container_id = c.id
            LEFT JOIN inv_storages s ON i.storage_id = s.id
            LEFT JOIN inv_rooms r ON i.room_id = r.id
            WHERE 1=1
        `;
        
        const params = [];
        if (category) {
            params.push(category);
            query += ` AND it.category = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            query += ` AND i.name ILIKE $${params.length}`;
        }
        
        const result = await db.query(query + ' ORDER BY i.name', params);
        return result.rows;
    }
    async searchItems(query, category = null) {
        try {
            const params = [`%${query}%`];
            let sql = `
                SELECT 
                    i.*,
                    it.category,
                    COALESCE(c.name, s.name, r.name) as location
                FROM inv_items i
                LEFT JOIN inv_item_types it ON i.item_type_id = it.id
                LEFT JOIN inv_containers c ON i.container_id = c.id
                LEFT JOIN inv_storages s ON i.storage_id = s.id
                LEFT JOIN inv_rooms r ON i.room_id = r.id
                WHERE LOWER(i.name) LIKE LOWER($1)
            `;
    
            if (category) {
                params.push(category);
                sql += ` AND it.category = $2`;
            }
    
            sql += ` ORDER BY i.name`;
            
            const result = await db.query(sql, params);
            return result.rows;
        } catch (error) {
            console.error('Database search error:', error);
            throw new Error('Failed to search items');
        }
    }
    
    
    async getRecentItems(limit = 5) {
        const result = await db.query(`
            SELECT i.*, 
                   it.category,
                   COALESCE(c.name, s.name, r.name) as location
            FROM inv_items i 
            LEFT JOIN inv_item_types it ON i.item_type_id = it.id
            LEFT JOIN inv_containers c ON i.container_id = c.id
            LEFT JOIN inv_storages s ON i.storage_id = s.id
            LEFT JOIN inv_rooms r ON i.room_id = r.id
            ORDER BY i.created_at DESC 
            LIMIT $1
        `, [limit]);
        return result.rows;
    }
    

    async createItem(itemData) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            // Handle item type
            let itemTypeResult = await client.query(
                'SELECT id FROM inv_item_types WHERE category = $1',
                [itemData.category]
            );
            
            let item_type_id;
            if (itemTypeResult.rows.length === 0) {
                const newType = await client.query(
                    'INSERT INTO inv_item_types (name, category) VALUES ($1, $2) RETURNING id',
                    [itemData.category, itemData.category]
                );
                item_type_id = newType.rows[0].id;
            } else {
                item_type_id = itemTypeResult.rows[0].id;
            }

            // Create item
            const result = await client.query(`
                INSERT INTO inv_items (
                    name, description, item_type_id,
                    room_id, storage_id, container_id,
                    quantity, unit,
                    component_type,
                    material_type
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `, [
                itemData.name,
                itemData.description,
                item_type_id,
                itemData.room_id || null,
                itemData.storage_id || null,
                itemData.container_id || null,
                itemData.quantity || 1,
                itemData.unit || 'pieces',
                itemData.component_type || null,
                itemData.material_type || null
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
    async updateItem(id, itemData) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            let itemTypeResult = await client.query(
                'SELECT id FROM inv_item_types WHERE category = $1',
                [itemData.category]
            );
            
            const result = await client.query(`
                UPDATE inv_items SET
                    name = $1, description = $2, item_type_id = $3,
                    room_id = $4, storage_id = $5, container_id = $6,
                    quantity = $7, unit = $8,
                    component_type = $9,
                    material_type = $10
                WHERE id = $11
                RETURNING *
            `, [
                itemData.name,
                itemData.description,
                itemTypeResult.rows[0].id,
                itemData.room_id || null,
                itemData.storage_id || null,
                itemData.container_id || null,
                itemData.quantity || 1,
                itemData.unit || 'pieces',
                itemData.component_type || null,
                itemData.material_type || null,
                id
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

    async deleteItem(id) {
        return await db.query('DELETE FROM inv_items WHERE id = $1', [id]);
    }

    async getItemWithLocationCheck(id) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            // First, update the item's storage location if it's in a container
            await client.query(`
                UPDATE inv_items i
                SET storage_id = c.storage_id
                FROM inv_containers c
                WHERE i.id = $1
                AND i.container_id = c.id
                AND i.storage_id IS DISTINCT FROM c.storage_id
            `, [id]);
    
            // Then fetch the updated item with all its location info
            const result = await client.query(`
                SELECT i.*, 
                       it.category,
                       c.name as container_name,
                       c.storage_id as container_storage_id,
                       s.name as storage_name,
                       r.name as room_name
                FROM inv_items i
                LEFT JOIN inv_item_types it ON i.item_type_id = it.id
                LEFT JOIN inv_containers c ON i.container_id = c.id
                LEFT JOIN inv_storages s ON COALESCE(c.storage_id, i.storage_id) = s.id
                LEFT JOIN inv_rooms r ON i.room_id = r.id
                WHERE i.id = $1
            `, [id]);
    
            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getItemById(id) {
        const result = await db.query(`
            SELECT 
                i.*,
                it.category,
                r.name as room_name,
                c.name as container_name,
                c.storage_id as container_storage_id,
                (SELECT s.name FROM inv_storages s WHERE s.id = c.storage_id) as container_storage_name
            FROM inv_items i
            LEFT JOIN inv_item_types it ON i.item_type_id = it.id
            LEFT JOIN inv_rooms r ON i.room_id = r.id
            LEFT JOIN inv_containers c ON i.container_id = c.id
            WHERE i.id = $1
        `, [id]);
        return result.rows[0];
    }
    
    
    
    
    
    

}

module.exports = new ItemService();
