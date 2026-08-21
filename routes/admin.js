const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, CATEGORIES } = require('../db');
const { UPLOAD_DIR } = require('../storage');
const { requireAdmin } = require('../middleware/auth');

const VALID_CATEGORIES = CATEGORIES.map(c => c.slug);

// ---------- Image upload config ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only JPG, PNG, WEBP or GIF images are allowed.'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ---------- Auth ----------
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  try {
    const admin = await db.one('SELECT * FROM admins WHERE username = $1', [username]);
    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    req.session.isAdmin = true;
    req.session.username = admin.username;
    res.json({ success: true, username: admin.username });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get('/session', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({ loggedIn: true, username: req.session.username });
  }
  res.json({ loggedIn: false });
});

router.post('/change-password', requireAdmin, async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  try {
    const admin = await db.one('SELECT * FROM admins WHERE username = $1', [req.session.username]);
    if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [newHash, admin.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Enquiries (protected) ----------
router.get('/enquiries', requireAdmin, async (req, res, next) => {
  try {
    const rows = await db.query('SELECT * FROM enquiries ORDER BY created_at DESC, id DESC');
    res.json(rows.rows);
  } catch (err) {
    next(err);
  }
});

router.patch('/enquiries/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const existing = await db.one('SELECT * FROM enquiries WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Enquiry not found.' });

    const status = req.body.status === 'read' ? 'read' : 'new';
    await db.query('UPDATE enquiries SET status = $1 WHERE id = $2', [status, req.params.id]);
    const updated = await db.one('SELECT * FROM enquiries WHERE id = $1', [req.params.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/enquiries/:id', requireAdmin, async (req, res, next) => {
  try {
    const existing = await db.one('SELECT * FROM enquiries WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Enquiry not found.' });

    await db.query('DELETE FROM enquiries WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Product CRUD (all protected) ----------
router.get('/products', requireAdmin, async (req, res, next) => {
  try {
    const rows = await db.query('SELECT * FROM products ORDER BY category ASC, sort_order ASC, id ASC');
    res.json(rows.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/products', requireAdmin, upload.single('image'), async (req, res, next) => {
  const { name, category, description } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'Product name and category are required.' });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;

  try {
    const maxOrder = await db.one('SELECT COALESCE(MAX(sort_order), -1) AS m FROM products WHERE category = $1', [category]);
    const nextOrder = Number(maxOrder?.m ?? -1) + 1;

    const result = await db.query(`
      INSERT INTO products (name, category, image_path, description, sort_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name.trim(), category, imagePath, description?.trim() || null, nextOrder]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/products/:id', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const existing = await db.one('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Product not found.' });

    const { name, category, description } = req.body;
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    let imagePath = existing.image_path;
    if (req.file) {
      if (existing.image_path) {
        const oldFile = path.join(__dirname, '..', 'public', existing.image_path);
        fs.unlink(oldFile, () => {});
      }
      imagePath = `/uploads/products/${req.file.filename}`;
    }

    await db.query(`
      UPDATE products SET name = $1, category = $2, image_path = $3, description = $4
      WHERE id = $5
    `, [
      name?.trim() || existing.name,
      category || existing.category,
      imagePath,
      description !== undefined ? (description.trim() || null) : existing.description,
      req.params.id,
    ]);

    const updated = await db.one('SELECT * FROM products WHERE id = $1', [req.params.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/products/:id', requireAdmin, async (req, res, next) => {
  try {
    const existing = await db.one('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Product not found.' });

    if (existing.image_path) {
      const filePath = path.join(__dirname, '..', 'public', existing.image_path);
      fs.unlink(filePath, () => {});
    }

    await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
