import express from 'express';
import jwt from 'jsonwebtoken';
import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'moby-dick-jwt-secret-change-in-production';

fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'public', 'media'), { recursive: true });

let db;

async function initDB() {
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, 'data', 'moby.db');
  
  let data;
  if (fs.existsSync(dbPath)) {
    data = fs.readFileSync(dbPath);
  }
  
  db = new SQL.Database(data);
  
  db.run(`CREATE TABLE IF NOT EXISTS owners (
    id INTEGER PRIMARY KEY,
    restaurant_name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS establishments (
    id INTEGER PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    restaurant_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    address TEXT,
    whatsapp TEXT,
    google_maps_url TEXT,
    logo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY,
    establishment_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL,
    image_url TEXT,
    is_available INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    establishment_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY,
    establishment_id INTEGER NOT NULL,
    menu_item_id INTEGER,
    filename TEXT NOT NULL,
    content_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  )`);
}

function saveDB() {
  const dbPath = path.join(__dirname, 'data', 'moby.db');
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({ credentials: true }));
app.use(express.static(path.join(__dirname, 'public')));

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.ownerId = decoded.ownerId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

app.post('/api/owner/register', (req, res) => {
  try {
    const { restaurant_name, email, password } = req.body;
    if (!restaurant_name || !email || !password) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run(
      'INSERT INTO owners (restaurant_name, email, password) VALUES (?, ?, ?)',
      [restaurant_name, email, hashedPassword]
    );
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] || 1;
    const token = jwt.sign({ ownerId: id }, JWT_SECRET, { expiresIn: '24h' });
    saveDB();
    res.json({ id, restaurant_name, email, token });
  } catch (error) {
    res.status(400).json({ error: 'Restaurante ou email já registrado' });
  }
});

app.post('/api/owner/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const result = db.exec('SELECT * FROM owners WHERE email = ?', [email]);
    const owner = result[0]?.values[0];
    if (!owner || !bcrypt.compareSync(password, owner[3])) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    const token = jwt.sign({ ownerId: owner[0] }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ id: owner[0], restaurant_name: owner[1], token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/owner/logout', (req, res) => {
  res.json({ success: true });
});

app.get('/api/owner/me', requireAuth, (req, res) => {
  try {
    const result = db.exec('SELECT id, restaurant_name, email FROM owners WHERE id = ?', [req.ownerId]);
    const owner = result[0]?.values[0];
    if (!owner) return res.status(404).json({ error: 'Não encontrado' });
    res.json({ id: owner[0], restaurant_name: owner[1], email: owner[2] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/establishments', requireAuth, (req, res) => {
  try {
    const result = db.exec('SELECT * FROM establishments WHERE owner_id = ?', [req.ownerId]);
    const establishments = result[0]?.values || [];
    res.json({
      establishments: establishments.map(est => ({
        id: est[0],
        owner_id: est[1],
        restaurant_name: est[2],
        slug: est[3],
        address: est[4],
        whatsapp: est[5],
        google_maps_url: est[6],
        logo_url: est[7],
        created_at: est[8]
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/establishments', requireAuth, (req, res) => {
  try {
    const { restaurant_name, slug, address, whatsapp, google_maps_url } = req.body;
    db.run(
      'INSERT INTO establishments (owner_id, restaurant_name, slug, address, whatsapp, google_maps_url) VALUES (?, ?, ?, ?, ?, ?)',
      [req.ownerId, restaurant_name, slug, address, whatsapp, google_maps_url]
    );
    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const id = idResult[0]?.values[0]?.[0] || 1;
    saveDB();
    res.json({
      id,
      owner_id: req.ownerId,
      restaurant_name,
      slug,
      address,
      whatsapp,
      google_maps_url
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/establishments/:slug', (req, res) => {
  try {
    const estResult = db.exec('SELECT * FROM establishments WHERE slug = ?', [req.params.slug]);
    if (!estResult[0]) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    }
    const est = estResult[0].values[0];
    const itemsResult = db.exec('SELECT * FROM menu_items WHERE establishment_id = ? ORDER BY type, name', [est[0]]);
    const items = itemsResult[0]?.values || [];
    const custResult = db.exec('SELECT COUNT(*) as count FROM customers WHERE establishment_id = ?', [est[0]]);
    const customers = custResult[0]?.values[0]?.[0] || 0;
    
    res.json({
      id: est[0],
      owner_id: est[1],
      restaurant_name: est[2],
      slug: est[3],
      address: est[4],
      whatsapp: est[5],
      google_maps_url: est[6],
      logo_url: est[7],
      created_at: est[8],
      items,
      customers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/establishments/:id/config', requireAuth, (req, res) => {
  try {
    const estResult = db.exec(
      'SELECT * FROM establishments WHERE id = ? AND owner_id = ?',
      [req.params.id, req.ownerId]
    );
    if (!estResult[0]) return res.status(404).json({ error: 'Não encontrado' });
    const est = estResult[0].values[0];
    const itemsResult = db.exec('SELECT * FROM menu_items WHERE establishment_id = ?', [est[0]]);
    const items = itemsResult[0]?.values || [];

    res.json({
      establishment: {
        id: est[0],
        owner_id: est[1],
        restaurant_name: est[2],
        slug: est[3],
        address: est[4],
        whatsapp: est[5],
        google_maps_url: est[6],
        items
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/establishments/:id', requireAuth, (req, res) => {
  try {
    const { restaurant_name, address, whatsapp, google_maps_url } = req.body;
    db.run(
      'UPDATE establishments SET restaurant_name = ?, address = ?, whatsapp = ?, google_maps_url = ? WHERE id = ? AND owner_id = ?',
      [restaurant_name, address, whatsapp, google_maps_url, req.params.id, req.ownerId]
    );
    saveDB();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/menu-items', requireAuth, (req, res) => {
  try {
    const { establishment_id, type, name, description, price, image_url } = req.body;
    const estResult = db.exec('SELECT * FROM establishments WHERE id = ? AND owner_id = ?', [establishment_id, req.ownerId]);
    if (!estResult[0]) return res.status(401).json({ error: 'Acesso negado' });
    db.run(
      'INSERT INTO menu_items (establishment_id, type, name, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [establishment_id, type, name, description, price, image_url]
    );
    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const id = idResult[0]?.values[0]?.[0] || 1;
    saveDB();
    res.json({
      id,
      establishment_id,
      type,
      name,
      description,
      price,
      image_url
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/menu-items/:id', requireAuth, (req, res) => {
  try {
    const { name, description, price, is_available } = req.body;
    const itemResult = db.exec('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    const item = itemResult[0]?.values[0];
    const estResult = db.exec('SELECT * FROM establishments WHERE id = ? AND owner_id = ?', [item[1], req.ownerId]);
    if (!estResult[0]) return res.status(401).json({ error: 'Acesso negado' });
    db.run(
      'UPDATE menu_items SET name = ?, description = ?, price = ?, is_available = ? WHERE id = ?',
      [name, description, price, is_available, req.params.id]
    );
    saveDB();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/menu-images', requireAuth, (req, res) => {
  try {
    const { establishment_id, menu_item_id, content_id, data_url } = req.body;
    const estResult = db.exec('SELECT * FROM establishments WHERE id = ? AND owner_id = ?', [establishment_id, req.ownerId]);
    if (!estResult[0]) return res.status(401).json({ error: 'Acesso negado' });
    const buffer = Buffer.from(data_url.split(',')[1], 'base64');
    const filename = `${Date.now()}-${content_id}.png`;
    const filepath = path.join(__dirname, 'public', 'media', filename);
    fs.writeFileSync(filepath, buffer);
    db.run(
      'INSERT INTO images (establishment_id, menu_item_id, filename, content_id) VALUES (?, ?, ?, ?)',
      [establishment_id, menu_item_id, filename, content_id]
    );
    saveDB();
    res.json({ url: `/media/${filename}`, content_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/menu-images', (req, res) => {
  try {
    const { establishment_id } = req.query;
    const result = db.exec('SELECT * FROM images WHERE establishment_id = ?', [establishment_id]);
    const images = result[0]?.values || [];
    res.json({ images });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { establishment_id, name, phone } = req.body;
    if (!establishment_id || !name || !phone) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    db.run(
      'INSERT INTO customers (establishment_id, name, phone) VALUES (?, ?, ?)',
      [establishment_id, name, phone]
    );
    saveDB();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/customers/:establishment_id', requireAuth, (req, res) => {
  try {
    const estResult = db.exec('SELECT * FROM establishments WHERE id = ? AND owner_id = ?', [req.params.establishment_id, req.ownerId]);
    if (!estResult[0]) return res.status(401).json({ error: 'Acesso negado' });
    const result = db.exec('SELECT * FROM customers WHERE establishment_id = ? ORDER BY created_at DESC', [req.params.establishment_id]);
    const customers = result[0]?.values.map(c => ({
      id: c[0],
      establishment_id: c[1],
      name: c[2],
      phone: c[3],
      created_at: c[4]
    })) || [];
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Moby Dick White Label rodando em http://localhost:${PORT}`);
    console.log(`Acesso do dono: http://localhost:${PORT}/dono`);
  });
});
