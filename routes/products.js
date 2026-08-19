const express = require('express');
const router = express.Router();
const { db, CATEGORIES } = require('../db');

// GET /api/categories — list the fixed collection categories
router.get('/categories', (req, res) => {
  res.json(CATEGORIES);
});

// GET /api/products?category=bags-travel — list products, optionally filtered
router.get('/products', (req, res) => {
  const { category } = req.query;
  let rows;
  if (category) {
    rows = db.prepare('SELECT * FROM products WHERE category = ? ORDER BY sort_order ASC, id ASC').all(category);
  } else {
    rows = db.prepare('SELECT * FROM products ORDER BY category ASC, sort_order ASC, id ASC').all();
  }
  res.json(rows);
});

// GET /api/products/:id — single product
router.get('/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Product not found' });
  res.json(row);
});

module.exports = router;
