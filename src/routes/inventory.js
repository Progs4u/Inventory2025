const express = require('express');
const router = express.Router();
const itemService = require('../services/itemService');
const db = require('../database');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);


router.get('/', async (req, res) => {
    try {
        const [stats, recentItems] = await Promise.all([
            db.query(`
                SELECT 
                    (SELECT COUNT(*) FROM inv_items) as items_count,
                    (SELECT COUNT(*) FROM inv_rooms) as rooms_count,
                    (SELECT COUNT(*) FROM inv_storages) as storage_count,
                    (SELECT COUNT(*) FROM inv_containers) as containers_count
            `),
            itemService.getRecentItems(5)
        ]);

        res.render('pages/inventory/dashboard', {
            stats: stats.rows[0],
            recentItems: recentItems
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('pages/inventory/dashboard', { 
            stats: { items_count: 0, rooms_count: 0, storage_count: 0, containers_count: 0 },
            recentItems: []
        });
    }
});

router.get('/search', async (req, res) => {
    try {
        const { query, category } = req.query;
        
        // Validate search parameters
        if (!query?.trim()) {
            return res.status(400).json({ 
                message: 'Search query is required' 
            });
        }

        // Get search results
        const searchResults = await itemService.searchItems(query, category);
        
        // Return JSON response
        return res.json({ 
            success: true,
            results: searchResults 
        });

    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({ 
            message: 'Error performing search',
            error: error.message 
        });
    }
});


/*
router.get('/', async (req, res) => {
    try {
        // Get statistics
        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM inv_items) as items_count,
                (SELECT COUNT(*) FROM inv_rooms) as rooms_count,
                (SELECT COUNT(*) FROM inv_storages) as storage_count,
                (SELECT COUNT(*) FROM inv_containers) as containers_count
        `);

        // Get recent items
        const recentItems = await db.query(`
            SELECT i.*, 
                   it.category,
                   COALESCE(c.name, s.name, r.name) as location
            FROM inv_items i 
            LEFT JOIN inv_item_types it ON i.item_type_id = it.id
            LEFT JOIN inv_containers c ON i.container_id = c.id
            LEFT JOIN inv_storages s ON i.storage_id = s.id
            LEFT JOIN inv_rooms r ON i.room_id = r.id
            ORDER BY i.created_at DESC 
            LIMIT 5
        `);

        res.render('pages/inventory/dashboard', {
            stats: stats.rows[0],
            recentItems: recentItems.rows
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        // Provide default values when error occurs
        res.render('pages/inventory/dashboard', { 
            stats: { 
                items_count: 0, 
                rooms_count: 0, 
                storage_count: 0, 
                containers_count: 0 
            },
            recentItems: []
        });
    }
});

router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.redirect('/inventory');
        }

        const searchResults = await pool.query(`
            SELECT 
                i.*, 
                r.name as room_name,
                s.name as storage_name,
                c.name as container_name
            FROM items i
            LEFT JOIN rooms r ON i.room_id = r.id
            LEFT JOIN storage s ON i.storage_id = s.id
            LEFT JOIN containers c ON i.container_id = c.id
            WHERE 
                LOWER(i.name) LIKE LOWER($1) OR
                LOWER(i.description) LIKE LOWER($1)
        `, [`%${query}%`]);

        res.render('pages/inventory/dashboard', {
            searchResults: searchResults.rows,
            query,
            // Include your existing dashboard data here
            stats: await getInventoryStats(), // You'll need to implement this
            recentItems: await getRecentItems() // You'll need to implement this
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).send('Error performing search');
    }
});

*/


module.exports = router;

/**
 * Main Inventory Routes
 * 
 * Purpose:
 * - Dashboard rendering
 * - Overview statistics
 * - Recent activity tracking
 * - System health monitoring
 * 
 * Endpoints:
 * GET /: Main dashboard
 * GET /stats: System statistics
 * GET /recent: Recent activities
 */
