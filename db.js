const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const isNeon = !!connectionString;

const pool = new Pool({
  connectionString,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: isNeon
    ? { rejectUnauthorized: false }
    : process.env.PGSSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
});

async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result;
}

async function one(text, params = []) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

const CATEGORIES = [
  { slug: 'bags-travel', label: 'Bags & Travel' },
  { slug: 'gourmet-festive', label: 'Gourmet & Festive' },
  { slug: 'joining-essentials', label: 'Joining & Writing Essentials' },
];

async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      image_path TEXT,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      designation TEXT,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      occasion TEXT,
      category TEXT,
      quantity TEXT,
      timeline TEXT,
      location TEXT,
      message TEXT,
      whatsapp_message TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function seedAdmin() {
  const existing = await one('SELECT COUNT(*)::int AS c FROM admins');
  if (existing && existing.c === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'vrindavan@123';
    const hash = bcrypt.hashSync(password, 10);
    await query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', [username, hash]);
    console.log('----------------------------------------------------');
    console.log(' Default admin account created:');
    console.log(`   username: ${username}`);
    console.log(`   password: ${password}`);
    console.log(' CHANGE THIS PASSWORD after first login (see README).');
    console.log('----------------------------------------------------');
  }
}

async function seedProducts() {
  const existing = await one('SELECT COUNT(*)::int AS c FROM products');
  if (existing && existing.c > 0) return;

  const starter = {
    'bags-travel': ['Duffle Bags', 'Messenger Bags', 'Laptop Backpacks', 'Side Bags', 'Cabin Luggage', 'Travel Organisers'],
    'gourmet-festive': ['Dry Fruits', 'Honey', 'Dates', 'Gond Laddu', 'Badam Katli', 'Kaju Katli'],
    'joining-essentials': ['Diaries', 'Bottles', 'Cups', 'Joining Kits', 'Selected Corporate Essentials', 'Premium Pens'],
  };

  for (const [category, names] of Object.entries(starter)) {
    for (let i = 0; i < names.length; i += 1) {
      await query(
        'INSERT INTO products (name, category, image_path, description, sort_order) VALUES ($1, $2, $3, $4, $5)',
        [names[i], category, null, null, i]
      );
    }
  }
  console.log('Seeded starter product list (no images yet — add real photos from the admin panel).');
}

const initPromise = (async () => {
  await ensureSchema();
  await seedAdmin();
  await seedProducts();
})();

async function close() {
  await pool.end();
}

module.exports = {
  db: { query, one },
  CATEGORIES,
  initPromise,
  close,
};
