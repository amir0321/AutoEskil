import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const RENDER_URL = process.env.RENDER_DATABASE_URL;
const LOCAL_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/autoeskil';

if (!RENDER_URL) {
  process.exit(1);
}

const render = new Pool({ connectionString: RENDER_URL, ssl: { rejectUnauthorized: false } });
const local = new Pool({ connectionString: LOCAL_URL });

const TABLES = ['dealers', 'cars', 'car_images', 'leads', 'car_matches', 'sell_requests', 'sell_request_images'];

async function migrate() {
  console.log('🚀 Startar migrering från Render → Lokalt...\n');

  for (const table of TABLES) {
    try {
      const { rows } = await render.query(`SELECT * FROM ${table}`);
      if (rows.length === 0) {
        console.log(`⏩ ${table}: tom, hoppar över`);
        continue;
      }

      // Rensa lokal tabell
      await local.query(`DELETE FROM ${table}`);

      // Bygg INSERT för varje rad
      let inserted = 0;
      for (const row of rows) {
        const cols = Object.keys(row);
        const vals = Object.values(row);
        const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        await local.query(sql, vals);
        inserted++;
      }
      console.log(`✅ ${table}: ${inserted} rader kopierade`);
    } catch (err) {
      console.log(`⚠️  ${table}: ${err.message}`);
    }
  }

  console.log('\n✨ Klar! Data är nu kopierad till din lokala databas.');
  await render.end();
  await local.end();
}

migrate().catch(err => {
  console.error('❌ Fel:', err.message);
  process.exit(1);
});
