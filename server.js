require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { DATA_DIR, UPLOAD_DIR } = require('./storage');

const { initPromise } = require('./db'); // initializes DB + seeds admin/products on first run

const productsRouter = require('./routes/products');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Keep admin/frontend product data fresh during local editing.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.endsWith('.html') || req.path.endsWith('.js')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
    httpOnly: true,
    // secure: true, // enable this once the site is served over HTTPS
  },
}));

// ---------- API ----------
app.use('/api', productsRouter);
app.use('/api/admin', adminRouter);

// ---------- Static site + admin panel ----------
app.use(express.static(path.join(__dirname, 'public')));
// Product images use the same URL whether stored locally or on Render's disk.
app.use('/uploads/products', express.static(UPLOAD_DIR));

// Fallback: unknown routes go to 404 (or you could redirect to index.html)
app.use((req, res) => {
  res.status(404).send('Page not found.');
});

(async () => {
  await initPromise;
  app.listen(PORT, () => {
    console.log(`The House of Vrindavan server running at http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin/login.html`);
  });
})();


