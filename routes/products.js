const express = require('express');
const router = express.Router();
const { db, CATEGORIES } = require('../db');

// GET /api/categories — list the fixed collection categories
router.get('/categories', (req, res) => {
  res.json(CATEGORIES);
});


function clean(value) {
  return String(value ?? '').trim();
}

function buildWhatsAppMessage(data) {
  const line = '━━━━━━━━━━━━━━━━━━━━';
  return `*New Gifting Enquiry — The House of Vrindavan*
${line}
• *Name:* ${data.name}
• *Company:* ${data.company}${data.designation ? `
• *Designation:* ${data.designation}` : ''}
• *Phone / WhatsApp:* ${data.phone}
• *Email:* ${data.email}
• *Gifting Occasion:* ${data.occasion || '—'}
• *Preferred Category:* ${data.category || '—'}
• *Approximate Quantity:* ${data.quantity || '—'}
• *Required By:* ${data.timeline || '—'}
• *Delivery Location:* ${data.location || '—'}

*Message:*
${data.message || '—'}`;
}

// POST /api/enquiries — store website enquiries before redirecting to WhatsApp
router.post('/enquiries', async (req, res, next) => {
  const data = {
    name: clean(req.body.name),
    company: clean(req.body.company),
    designation: clean(req.body.designation),
    phone: clean(req.body.phone),
    email: clean(req.body.email),
    occasion: clean(req.body.occasion),
    category: clean(req.body.category),
    quantity: clean(req.body.quantity),
    timeline: clean(req.body.timeline),
    location: clean(req.body.location),
    message: clean(req.body.message),
  };

  if (!data.name || !data.company || !data.phone || !data.email) {
    return res.status(400).json({ error: 'Name, company, phone and email are required.' });
  }

  try {
    const whatsappMessage = buildWhatsAppMessage(data);
    const result = await db.query(`
      INSERT INTO enquiries (
        name, company, designation, phone, email, occasion, category,
        quantity, timeline, location, message, whatsapp_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, [
      data.name,
      data.company,
      data.designation || null,
      data.phone,
      data.email,
      data.occasion || null,
      data.category || null,
      data.quantity || null,
      data.timeline || null,
      data.location || null,
      data.message || null,
      whatsappMessage,
    ]);

    res.status(201).json({
      success: true,
      id: result.rows[0].id,
      whatsapp_message: whatsappMessage,
    });
  } catch (err) {
    next(err);
  }
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
