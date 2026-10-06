import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '..', 'data', 'moby.db'));

console.log('🔄 Criando dados de exemplo para Moby Dick...\n');

const hashedPassword = bcrypt.hashSync('moby123', 10);

try {
  db.prepare(`DELETE FROM images WHERE establishment_id > 0`).run();
  db.prepare(`DELETE FROM menu_items WHERE establishment_id > 0`).run();
  db.prepare(`DELETE FROM customers WHERE establishment_id > 0`).run();
  db.prepare(`DELETE FROM establishments WHERE owner_id > 0`).run();
  db.prepare(`DELETE FROM owners`).run();

  const ownerStmt = db.prepare(`
    INSERT INTO owners (restaurant_name, email, password)
    VALUES (?, ?, ?)
  `);
  const ownerResult = ownerStmt.run('Moby Dick', 'moby@example.com', hashedPassword);
  const ownerId = ownerResult.lastInsertRowid;

  const estStmt = db.prepare(`
    INSERT INTO establishments (owner_id, restaurant_name, slug, address, whatsapp, google_maps_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const estResult = estStmt.run(
    ownerId,
    'Moby Dick',
    'moby-dick',
    'Av. Paraguassu, 3786, Atlântida, Xangri-Lá',
    '5551999219896',
    'https://www.google.com/maps/search/?api=1&query=Av.%20Paraguassu%2C%203786%2C%20Atl%C3%A2ntida%2C%20Xangri-L%C3%A1'
  );
  const establishmentId = estResult.lastInsertRowid;

  const menuStmt = db.prepare(`
    INSERT INTO menu_items (establishment_id, type, name, description, price, image_url, is_available)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const items = [
    ['prato-do-dia', 'Sobrecoxa desossada', 'Grelhada acebolada com polenta frita, arroz e mix de folhas', 29.90, '/media/prato-sobrecoxa.png', 1],
    ['prato-do-dia', 'Ala minuta', 'Entrecot, peixe ou frango com arroz, fritas e salada', 29.90, '/media/prato-ala-minuta.png', 1],
    ['prato-do-dia', 'Frango à parmegiana', 'Arroz, batata rústica e mix de folhas', 29.90, '/media/prato-frango-parmegiana.png', 1],

    ['promocao', 'Entrecot à parmegiana', 'Para 2 pessoas com arroz, fritas e salada', 89.90, '/media/promo-entrecot-parmegiana.png', 1],
    ['promocao', 'Peixe à dorê com molho de camarão', 'Para 2 pessoas com arroz, batata sautée e salada', 89.90, '/media/promo-peixe-ao-dore.png', 1],
    ['promocao', 'Chope Brahma 300 ml', 'Promoção à noite toda', 9.90, '/media/chope-brahma.png', 1],

    ['cardapio', 'Frango xadrez', 'Batata rústica, arroz e mix de folhas com tomate', 29.90, '/media/prato-frango-xadrez.png', 1],
    ['cardapio', 'Penne ao molho de queijos e bife à milanesa', 'Mix de folhas com tomate-cereja e arroz opcional', 29.90, '/media/prato-penne-milanesa.png', 1],
    ['cardapio', 'Entrecot à parmegiana', 'Arroz, fritas e salada', 38.90, null, 1],
  ];

  items.forEach(item => {
    const [type, name, description, price, image_url, available] = item;
    menuStmt.run(establishmentId, type, name, description, price, image_url, available);
  });

  console.log('✅ Dados de exemplo criados com sucesso!\n');
  console.log('📋 Credenciais de teste:');
  console.log('   Email: moby@example.com');
  console.log('   Senha: moby123');
  console.log('\n🌐 URLs:');
  console.log('   Página pública: http://localhost:3000');
  console.log('   Painel do dono: http://localhost:3000/dono');
  console.log('\n💡 Para resetar os dados novamente, execute:');
  console.log('   node scripts/seed-moby-dick.js\n');

} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}

db.close();
