const express = require('express');
const router = express.Router();
const { db, CATEGORIES } = require('../db');

// GET /api/categories — list the fixed collection categories
router.get('/categories', (req, res) => {
  res.json(CATEGORIES);
});

// GET /api/products?category=bags-travel — list products, optionally filtered
router.get('/products', async (req, res, next) => {
  const { category } = req.query;
  try {
    const result = category
      ? await db.query('SELECT * FROM products WHERE category = $1 ORDER BY sort_order ASC, id ASC', [category])
      : await db.query('SELECT * FROM products ORDER BY category ASC, sort_order ASC, id ASC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id — single product
router.get('/products/:id', async (req, res, next) => {
  try {
    const row = await db.one('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
