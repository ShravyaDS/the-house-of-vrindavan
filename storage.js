const path = require('path');
const fs = require('fs');

const isRender = Boolean(process.env.RENDER);
const DATA_DIR = process.env.DATA_DIR || (isRender ? '/var/data/data' : path.join(__dirname, 'data'));
const UPLOAD_DIR = process.env.UPLOAD_DIR || (isRender ? '/var/data/uploads/products' : path.join(__dirname, 'public', 'uploads', 'products'));

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

module.exports = { DATA_DIR, UPLOAD_DIR };