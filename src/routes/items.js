const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { validationResult } = require('express-validator');
const itemService = require('../services/itemService');
const qrsService = require('../services/qrsService');
const itemValidation = require('../validations/itemValidation');
const db = require('../database');
const { authMiddleware } = require('../middlewares/auth');
const { locationTrailMiddleware } = require('../middlewares/locationTrailMiddleware');

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;
        const [items, rooms, storages, containers] = await Promise.all([
            itemService.getAllItems(category, search),
            db.query('SELECT id, name FROM inv_rooms ORDER BY name'),
            db.query('SELECT id, name FROM inv_storages ORDER BY name'),
            db.query('SELECT id, name FROM inv_containers ORDER BY name')
        ]);

        res.render('pages/inventory/items', { 
            items: items,
            rooms: rooms.rows,
            storages: storages.rows,
            containers: containers.rows
        });
    } catch (error) {
        console.error('Error fetching items:', error);
        res.redirect('/');
    }
});

router.post('/', itemValidation.create, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }

  try {
      const newItem = await itemService.createItem(req.body);
      // Check if request expects JSON response
      if (req.headers.accept === 'application/json') {
          return res.json({
              success: true,
              data: newItem
          });
      }
      // Default to redirect for form submissions
      res.redirect('/items');
  } catch (error) {
      console.error('Error creating item:', error);
      if (req.headers.accept === 'application/json') {
          return res.status(500).json({
              success: false,
              message: error.message
          });
      }
      res.redirect('/items');
  }
});


router.put('/:id', itemValidation.update, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        await itemService.updateItem(req.params.id, req.body);
        res.redirect('/items');
    } catch (error) {
        console.error('Error updating item:', error);
        res.redirect('/items');
    }
});

router.delete('/:id', itemValidation.delete, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        await itemService.deleteItem(req.params.id);
        res.redirect('/items');
    } catch (error) {
        console.error('Error deleting item:', error);
        res.redirect('/items');
    }
});

const storage = multer.diskStorage({
    destination: './src/public/uploads/',
    filename: function(req, file, cb) {
      cb(null, 'item-' + Date.now() + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function(req, file, cb) {
      checkFileType(file, cb);
    }
  });
  
  // Check file type function
  function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
  
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
  
  // Get item detail// Get item detail
  router.get('/:id', locationTrailMiddleware, async (req, res) => {
    try {
        const itemId = req.params.id;
        const [itemResult, qrAssignment] = await Promise.all([
            db.query(`
                SELECT i.*, 
                    it.category,
                    r.name as room_name, 
                    s.name as storage_name, 
                    c.name as container_name
                FROM inv_items i
                LEFT JOIN inv_item_types it ON i.item_type_id = it.id
                LEFT JOIN inv_rooms r ON i.room_id = r.id
                LEFT JOIN inv_storages s ON i.storage_id = s.id
                LEFT JOIN inv_containers c ON i.container_id = c.id
                WHERE i.id = $1
            `, [itemId]),
            qrsService.getQRAssignmentForItem(itemId)
        ]);

        if (itemResult.rows.length === 0) {
            return res.status(404).send('Item not found');
        }

        const item = {
            ...itemResult.rows[0],
            qr_uuid: qrAssignment.uuid,
            qr_status: qrAssignment.status,
            qr_assigned_at: qrAssignment.assigned_at
        };

        res.render('pages/inventory/item_detail', { item: item });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

  
  // Handle image upload
  router.post('/:id/image', upload.single('item_image'), async (req, res) => {
    try {
      const itemId = req.params.id;
      const imagePath = '/uploads/' + req.file.filename;
      
      await db.query(
        'UPDATE inv_items SET image_url = $1 WHERE id = $2',
        [imagePath, itemId]
      );
  
      res.redirect(`/items/${itemId}`);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });

  // Get item notes
router.get('/:id/notes', async (req, res) => {
    const notes = await db.query(
        'SELECT * FROM inv_item_notes WHERE item_id = $1 ORDER BY created_at DESC',
        [req.params.id]
    );
    res.json(notes.rows);
});

// Add note
router.post('/:id/notes', upload.array('note_images', 5), async (req, res) => {
    const { title, content } = req.body;
    const images = req.files ? req.files.map(f => '/uploads/' + f.filename) : [];
    
    await db.query(
        'INSERT INTO inv_item_notes (item_id, title, content, images, created_by) VALUES ($1, $2, $3, $4, $5)',
        [req.params.id, title, content, images, req.user.id]
    );
    
    res.redirect(`/items/${req.params.id}`);
});

// Delete note
router.delete('/:itemId/notes/:noteId', async (req, res) => {
  try {
      await db.query('DELETE FROM inv_item_notes WHERE id = $1', [req.params.noteId]);
      res.json({ success: true });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Update note
router.put('/:itemId/notes/:noteId', upload.array('note_images', 5), async (req, res) => {
  try {
      const { title, content } = req.body;
      const images = req.files ? req.files.map(f => '/uploads/' + f.filename) : null;
      
      await db.query(
          'UPDATE inv_item_notes SET title = $1, content = $2, images = COALESCE($3, images) WHERE id = $4',
          [title, content, images, req.params.noteId]
      );
      res.json({ success: true });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update note' });
  }
}); 

router.post('/:id/qr/status', async (req, res) => {
  try {
      const { status } = req.body;
      const itemId = req.params.id;
      await qrsService.updateQRStatus(itemId, status);
      res.redirect(`/items/${itemId}`);
  } catch (error) {
      console.error('Error updating QR status:', error);
      res.status(500).json({ error: error.message });
  }
});


module.exports = router;

/**
 * Item Tracking Routes
 * 
 * Purpose:
 * - Individual item management
 * - Item categorization
 * - Location tracking
 * 
 * Endpoints:
 * GET /items: List all items
 * POST /items: Add new item
 * PUT /items/:id: Update item
 * DELETE /items/:id: Remove item
 */

