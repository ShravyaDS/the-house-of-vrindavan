# The House of Vrindavan — Website + Product Admin Panel

This is your existing website (all the pages you already had) plus a Node.js
backend that adds a **login-protected admin panel** for managing products —
add, edit, delete, with photo upload — without touching any HTML code.

Once a product is added/edited/deleted in the admin panel, it shows up (or
disappears) automatically on the live "Bags & Travel" / "Gourmet & Festive" /
"Joining & Writing Essentials" pages — no code changes needed.

---

## 1. What's inside

```
vrindavan-backend/
├── server.js              → main server file
├── db.js                  → PostgreSQL setup + starter data
├── routes/
│   ├── products.js        → public API (read-only, used by the website)
│   └── admin.js            → admin API (login, add/edit/delete products)
├── middleware/auth.js       → protects admin routes
├── public/                  → your actual website files
│   ├── index.html, about.html, collections.html, contact.html, corporate-solutions.html
│   ├── products-bags-travel.html, products-gourmet-festive.html, products-joining-essentials.html
│   ├── styles.css, script.js
│   ├── js/products.js       → loads products from the database onto the product pages
│   ├── uploads/products/    → uploaded product photos are stored here
│   └── admin/                → the admin panel itself
│       ├── login.html
│       ├── dashboard.html
│       ├── admin.js
│       └── admin.css
└── .env                     → your settings (admin password, session secret)
```

---

## 2. Running it on your computer (first time)

You need [Node.js](https://nodejs.org) installed (version 18 or higher) and
access to a PostgreSQL database.

```bash
cd vrindavan-backend
npm install
npm start
```

You should see:

```
The House of Vrindavan server running at http://localhost:3000
Admin panel: http://localhost:3000/admin/login.html
```

Now open in your browser:
- **Website:** http://localhost:3000
- **Admin panel:** http://localhost:3000/admin/login.html

---

## 3. Admin login

On the very first run, a default admin account is created automatically:

```
username: admin
password: vrindavan@123
```

**Please change this password immediately** — log in, click **"Change
Password"** in the top right of the dashboard, and set your own.

If you ever want to set a different default password *before* the first
run (e.g. for a fresh deployment), create a file named `.env` in this folder
with:

```
ADMIN_USERNAME=youradminname
ADMIN_PASSWORD=yourpassword
SESSION_SECRET=some-long-random-string
DATABASE_URL=postgresql://user:password@host:5432/database
```

(This only affects the account created on first run — after that, always
use "Change Password" in the dashboard.)

---

## 4. Using the admin panel

- **Add Product** → click "+ Add Product", fill in name, pick a category,
  optionally add a description, and upload a photo. Click Save.
- **Edit Product** → click "Edit" on any row. You can update the name,
  category, description, or replace the photo (leave the photo field empty
  to keep the current photo).
- **Delete Product** → click "Delete" — this also removes the uploaded photo
  file from the server, so it doesn't pile up unused files.
- **Filter by category** → use the tabs at the top (All / Bags & Travel /
  Gourmet & Festive / Joining & Writing Essentials).

Any change is reflected on the live website within seconds — no need to
touch HTML or re-upload files.

---

## 5. Adding a brand-new category (beyond the current 3)

The 3 categories are currently fixed to match your 3 existing collection
pages. To add a 4th one in future:

1. Open `db.js` and add a new entry to the `CATEGORIES` array, e.g.:
   ```js
   { slug: 'desk-essentials', label: 'Desk Essentials' }
   ```
2. Copy `public/products-bags-travel.html` to `public/products-desk-essentials.html`
   and update the title, heading, and the `data-product-grid="desk-essentials"`
   attribute on the grid container.
3. Add a "View Products" button/section for it on `collections.html`, same as
   the existing three.
4. Restart the server. The new category will now appear in the admin panel's
   category dropdown and tabs automatically.

(This part does need a developer's help — but day-to-day product
add/edit/delete does not.)

---

## 6. Deploying it live (so it's not just on your computer)

Your current site was plain HTML/CSS, which works on any basic hosting
(GoDaddy, Hostinger shared hosting, etc.). **This backend needs hosting that
can run Node.js**, since it's now a live server, not just static files.

Good beginner-friendly options that support Node.js and have free/cheap tiers:
- **Render** (render.com) — easiest for beginners, free tier available
- **Railway** (railway.app)
- A VPS (DigitalOcean, Hostinger VPS, AWS Lightsail) if you want full control

General deployment steps (any of the above):
1. Push this project to a GitHub repository.
2. Connect that repository to Render/Railway.
3. Set environment variables there: `ADMIN_USERNAME`, `ADMIN_PASSWORD`,
   `SESSION_SECRET` (use a long random string for the secret).
4. It will run `npm install` then `npm start` automatically.
5. Point your domain (houseofvrindavan.com) to the new hosting.

**Important for production:**
- In `server.js`, uncomment `secure: true` under the cookie settings once
  your site is served over HTTPS (all the platforms above provide HTTPS
  automatically).
- The app now uses PostgreSQL instead of the old SQLite file. Set
  `DATABASE_URL` in production and the server will create the tables and seed
  starter data automatically on first launch.

---

## 7. Notes

- Product photos are stored in `public/uploads/products/`. Make sure this
  folder (and the `data/` folder with your database) is included in your
  backups.
- The public product pages fetch live data from `/api/products?category=...`
  — you don't need to edit `products-bags-travel.html` etc. by hand anymore
  for day-to-day product changes.
- The starter products already in the system (Duffle Bags, Dry Fruits, etc.)
  are placeholders with no photo yet — edit them from the admin panel to add
  real photos, rename, or delete them.
