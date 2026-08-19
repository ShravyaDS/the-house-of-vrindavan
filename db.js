const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'vrindavan.db');
const isNewDatabase = !fs.existsSync(DB_PATH);
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// ---------- Schema ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    image_path TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ---------- Categories (fixed to match the site's 3 collection pages) ----------
// To add a new category in future: add it here + build a matching
// products-<slug>.html page (copy an existing one and change the fetch category).
const CATEGORIES = [
  { slug: 'bags-travel', label: 'Bags & Travel' },
  { slug: 'gourmet-festive', label: 'Gourmet & Festive' },
  { slug: 'joining-essentials', label: 'Joining & Writing Essentials' },
];

// ---------- Seed default admin (only if no admin exists yet) ----------
function seedAdmin() {
  const existing = db.prepare('SELECT COUNT(*) AS c FROM admins').get();
  if (existing.c === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'vrindavan@123';
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(username, hash);
    console.log('----------------------------------------------------');
    console.log(' Default admin account created:');
    console.log(`   username: ${username}`);
    console.log(`   password: ${password}`);
    console.log(' CHANGE THIS PASSWORD after first login (see README).');
    console.log('----------------------------------------------------');
  }
}

// ---------- Seed starter products (only when the DB file is first created) ----------
function seedProducts() {
  if (!isNewDatabase) return;
  const existing = db.prepare('SELECT COUNT(*) AS c FROM products').get();
  if (existing.c > 0) return;

  const insert = db.prepare(`
    INSERT INTO products (name, category, image_path, description, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  const starter = {
    'bags-travel': ['Duffle Bags', 'Messenger Bags', 'Laptop Backpacks', 'Side Bags', 'Cabin Luggage', 'Travel Organisers'],
    'gourmet-festive': ['Dry Fruits', 'Honey', 'Dates', 'Gond Laddu', 'Badam Katli', 'Kaju Katli'],
    'joining-essentials': ['Diaries', 'Bottles', 'Cups', 'Joining Kits', 'Customised Essentials', 'Premium Pens'],
  };

  const insertMany = db.transaction(() => {
    Object.entries(starter).forEach(([category, names]) => {
      names.forEach((name, i) => {
        insert.run(name, category, null, null, i);
      });
    });
  });
  insertMany();
  console.log('Seeded starter product list (no images yet — add real photos from the admin panel).');
}

seedAdmin();
seedProducts();

module.exports = { db, CATEGORIES };


