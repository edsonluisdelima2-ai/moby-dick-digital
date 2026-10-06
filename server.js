import express from 'express';
import session from 'express-session';
import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

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

  // Criar usuário padrão se o banco estiver vazio
  try {
    const ownerCheck = db.exec('SELECT COUNT(*) as count FROM owners');
    const ownerCount = ownerCheck[0]?.values[0][0] || 0;

    if (ownerCount === 0) {
      console.log('📌 Criando usuário padrão...');
      const hashedPassword = bcrypt.hashSync('moby123', 10);
      db.run(
        'INSERT INTO owners (restaurant_name, email, password) VALUES (?, ?, ?)',
        ['Moby Dick', 'moby@example.com', hashedPassword]
      );

      const ownerResult = db.exec('SELECT id FROM owners WHERE email = ?', ['moby@example.com']);
      const ownerId = ownerResult[0]?.values[0][0];

      if (ownerId) {
        // Criar estabelecimento padrão
        db.run(
          'INSERT INTO establishments (owner_id, restaurant_name, slug, address, whatsapp, google_maps_url) VALUES (?, ?, ?, ?, ?, ?)',
          [ownerId, 'Moby Dick', 'moby-dick', 'Av. Paraguassu, 3786, Atlântida, Xangri-Lá', '5551999219896', 'https://www.google.com/maps/search/?api=1&query=Av.%20Paraguassu%2C%203786%2C%20Atl%C3%A2ntida%2C%20Xangri-L%C3%A1']
        );

        const estResult = db.exec('SELECT id FROM establishments WHERE owner_id = ?', [ownerId]);
        const establishmentId = estResult[0]?.values[0][0];

        if (establishmentId) {
          // Criar itens de menu padrão
          const items = [
            [establishmentId, 'prato-do-dia', 'Sobrecoxa desossada', 'Grelhada acebolada com polenta frita, arroz e mix de folhas', 29.90, '/media/prato-sobrecoxa.png', 1],
            [establishmentId, 'prato-do-dia', 'Ala minuta', 'Entrecot, peixe ou frango com arroz, fritas e salada', 29.90, '/media/prato-ala-minuta.png', 1],
            [establishmentId, 'prato-do-dia', 'Frango à parmegiana', 'Arroz, batata rústica e mix de folhas', 29.90, '/media/prato-frango-parmegiana.png', 1],
            [establishmentId, 'promocao', 'Entrecot à parmegiana', 'Para 2 pessoas com arroz, fritas e salada', 89.90, '/media/promo-entrecot-parmegiana.png', 1],
            [establishmentId, 'promocao', 'Peixe à dorê com molho de camarão', 'Para 2 pessoas com arroz, batata sautée e salada', 89.90, '/media/promo-peixe-ao-dore.png', 1],
            [establishmentId, 'promocao', 'Chope Brahma 300 ml', 'Promoção à noite toda', 9.90, '/media/chope-brahma.png', 1],
            [establishmentId, 'cardapio', 'Frango xadrez', 'Batata rústica, arroz e mix de folhas com tomate', 29.90, '/media/prato-frango-xadrez.png', 1],
            [establishmentId, 'cardapio', 'Penne ao molho de queijos e bife à milanesa', 'Mix de folhas com tomate-cereja e arroz opcional', 29.90, '/media/prato-penne-milanesa.png', 1],
            [establishmentId, 'cardapio', 'Entrecot à parmegiana', 'Arroz, fritas e salada', 38.90, null, 1],
          ];

          items.forEach(item => {
            db.run(
              'INSERT INTO menu_items (establishment_id, type, name, description, price, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?, ?)',
              item
            );
          });
        }
      }

      saveDB();
      console.log('✅ Usuário padrão criado!');
      console.log('   Email: moby@example.com');
      console.log('   Senha: moby123');
    }
  } catch (error) {
    console.error('⚠️ Erro ao criar usuário padrão:', error.message);
  }
}

function saveDB() {
  const dbPath = path.join(__dirname, 'data', 'moby.db');
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'moby-dick-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

const requireAuth = (req, res, next) => {
  if (!req.session.ownerId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  next();
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
    req.session.ownerId = id;
    saveDB();
    res.json({ id, restaurant_name, email });
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
    req.session.ownerId = owner[0];
    res.json({ id: owner[0], restaurant_name: owner[1] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/owner/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/owner/me', requireAuth, (req, res) => {
  try {
    const result = db.exec('SELECT id, restaurant_name, email FROM owners WHERE id = ?', [req.session.ownerId]);
    const owner = result[0]?.values[0];
    if (!owner) return res.status(404).json({ error: 'Não encontrado' });
    res.json({ id: owner[0], restaurant_name: owner[1], email: owner[2] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/establishments', requireAuth, (req, res) => {
  try {
    const result = db.exec('SELECT id, owner_id, restaurant_name, slug, address, whatsapp, google_maps_url FROM establishments WHERE owner_id = ?', [req.session.ownerId]);
    const establishments = result[0]?.values?.map(row => ({
      id: row[0],
      owner_id: row[1],
      restaurant_name: row[2],
      slug: row[3],
      address: row[4],
      whatsapp: row[5],
      google_maps_url: row[6]
    })) || [];
    res.json({ establishments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/establishments', requireAuth, (req, res) => {
  try {
    const { restaurant_name, slug, address, whatsapp, google_maps_url } = req.body;
    db.run(
      'INSERT INTO establishments (owner_id, restaurant_name, slug, address, whatsapp, google_maps_url) VALUES (?, ?, ?, ?, ?, ?)',
      [req.session.ownerId, restaurant_name, slug, address, whatsapp, google_maps_url]
    );
    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const id = idResult[0]?.values[0]?.[0] || 1;
    saveDB();
    res.json({
      id,
      owner_id: req.session.ownerId,
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
      [req.params.id, req.session.ownerId]
    );
    if (!estResult[0]) return res.status(404).json({ error: 'Não encontrado' });
    const est = estResult[0].values[0];
    const itemsResult = db.exec('SELECT * FROM menu_items WHERE establishment_id = ?', [est[0]]);
    const items = itemsResult[0]?.values || [];
    
    res.json({
      id: est[0],
      owner_id: est[1],
      restaurant_name: est[2],
      slug: est[3],
      address: est[4],
      whatsapp: est[5],
      google_maps_url: est[6],
      items
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
      [restaurant_name, address, whatsapp, google_maps_url, req.params.id, req.session.ownerId]
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
    const estResult = db.exec('SELECT * FROM establishments WHERE id = ? AND owner_id = ?', [establishment_id, req.session.ownerId]);
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
    const estResult = db.exec('SELECT * FROM establishments WHERE id = ? AND owner_id = ?', [item[1], req.session.ownerId]);
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
    const estResult = db.exec('SELECT * FROM establishments WHERE id = ? AND owner_id = ?', [establishment_id, req.session.ownerId]);
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
    const estResult = db.exec('SELECT * FROM establishments WHERE id = ? AND owner_id = ?', [req.params.establishment_id, req.session.ownerId]);
    if (!estResult[0]) return res.status(401).json({ error: 'Acesso negado' });
    const result = db.exec('SELECT * FROM customers WHERE establishment_id = ? ORDER BY created_at DESC', [req.params.establishment_id]);
    const customers = result[0]?.values || [];
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
