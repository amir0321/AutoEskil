import pg from "pg";
import crypto from "crypto";

const { Pool } = pg;

// Få DATABASE_URL från miljövariabel (från Render)
let DATABASE_URL = process.env.DATABASE_URL;

// Debugging: log a masked DATABASE_URL (don't print credentials)
function maskDatabaseUrl(url) {
  try {
    if (!url) return "(not set)";
    const parsed = new URL(url);
    const host = parsed.host || parsed.hostname;
    const pathname = parsed.pathname || "";
    return `${parsed.protocol}//${host}${pathname}`;
  } catch (e) {
    return "(invalid url)";
  }
}

console.log("DATABASE_URL from env:", maskDatabaseUrl(DATABASE_URL));

// Om DATABASE_URL inte är satt, använd default
if (!DATABASE_URL) {
  DATABASE_URL = "postgresql://localhost:5432/autoeskil";
  console.warn("WARNING: DATABASE_URL not set, using localhost");
}

// Ensure SSL is configured for Render databases (dpg-)
const isRenderDatabase = (DATABASE_URL || "").includes("dpg-");
const sslConfig = isRenderDatabase ? { rejectUnauthorized: false } : false;

console.log("Using SSL:", sslConfig ? "YES (Render database)" : "NO");

// Pool för PostgreSQL
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: sslConfig,
});

async function generateUniqueListingId(client) {
  let candidate = "";
  let exists = true;

  while (exists) {
    candidate = String(crypto.randomInt(10000000, 100000000));
    const result = await client.query(
      "SELECT 1 FROM cars WHERE listing_id = $1 LIMIT 1",
      [candidate],
    );
    exists = result.rows.length > 0;
  }

  return candidate;
}

async function migrateLeadsTable(client) {
  // Check if source and status columns exist
  const columnsResult = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'leads'
  `);
  const columnNames = new Set(columnsResult.rows.map((row) => row.column_name));

  const hasSourceColumn = columnNames.has("source");
  const hasStatusColumn = columnNames.has("status");

  // If both columns already exist, no migration needed
  if (hasSourceColumn && hasStatusColumn) {
    return;
  }

  // Lägg till columns om de saknas
  if (!hasSourceColumn) {
    await client.query(
      "ALTER TABLE leads ADD COLUMN source TEXT DEFAULT 'contact'",
    );
  }

  if (!hasStatusColumn) {
    await client.query(
      "ALTER TABLE leads ADD COLUMN status TEXT DEFAULT 'active'",
    );
  }

  console.log("Leads schema migrated: added source and status columns.");
}

async function migrateCarsTable(client) {
  // Hämta alla kolumner för cars-tabellen
  const columnsResult = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'cars'
  `);
  const columnNames = new Set(columnsResult.rows.map((row) => row.column_name));

  // Lägg till columns som saknas
  if (!columnNames.has("listing_id")) {
    await client.query("ALTER TABLE cars ADD COLUMN listing_id TEXT");
  }

  if (!columnNames.has("variant")) {
    await client.query("ALTER TABLE cars ADD COLUMN variant TEXT DEFAULT ''");
  }

  if (!columnNames.has("color")) {
    await client.query("ALTER TABLE cars ADD COLUMN color TEXT DEFAULT ''");
  }

  if (!columnNames.has("transmission")) {
    await client.query(
      "ALTER TABLE cars ADD COLUMN transmission TEXT DEFAULT ''",
    );
  }

  if (!columnNames.has("equipment")) {
    await client.query(
      "ALTER TABLE cars ADD COLUMN equipment TEXT DEFAULT '[]'",
    );
  }

  if (!columnNames.has("horsepower")) {
    await client.query("ALTER TABLE cars ADD COLUMN horsepower INTEGER");
  }

  if (!columnNames.has("registration_number")) {
    await client.query(
      "ALTER TABLE cars ADD COLUMN registration_number TEXT DEFAULT ''",
    );
  }

  if (!columnNames.has("registration_date")) {
    await client.query(
      "ALTER TABLE cars ADD COLUMN registration_date TEXT DEFAULT ''",
    );
  }

  if (!columnNames.has("max_trailer_weight")) {
    await client.query(
      "ALTER TABLE cars ADD COLUMN max_trailer_weight INTEGER",
    );
  }

  if (!columnNames.has("drivetrain")) {
    await client.query(
      "ALTER TABLE cars ADD COLUMN drivetrain TEXT DEFAULT ''",
    );
  }

  if (!columnNames.has("seats")) {
    await client.query("ALTER TABLE cars ADD COLUMN seats INTEGER");
  }

  if (!columnNames.has("engine_volume")) {
    await client.query("ALTER TABLE cars ADD COLUMN engine_volume REAL");
  }

  if (!columnNames.has("range_wltp")) {
    await client.query("ALTER TABLE cars ADD COLUMN range_wltp INTEGER");
  }

  if (!columnNames.has("updated_at")) {
    await client.query(
      "ALTER TABLE cars ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    );
  }

  // Skapa index för listing_id
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_cars_listing_id ON cars(listing_id)
  `);

  // Uppdatera cars som saknar listing_id
  const carsResult = await client.query(
    "SELECT id FROM cars WHERE listing_id IS NULL OR listing_id = ''",
  );

  for (const car of carsResult.rows) {
    const listingId = await generateUniqueListingId(client);
    await client.query("UPDATE cars SET listing_id = $1 WHERE id = $2", [
      listingId,
      car.id,
    ]);
  }
}

async function setupDB() {
  const client = await pool.connect();

  try {
    console.log("Ansluter till PostgreSQL-databas...");

    // 1. Tabell för Bilhandlare
    await client.query(`
      CREATE TABLE IF NOT EXISTS dealers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tabell för Bilar
    await client.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id TEXT PRIMARY KEY,
        listing_id TEXT UNIQUE,
        dealer_id TEXT NOT NULL,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        variant TEXT DEFAULT '',
        color TEXT DEFAULT '',
        transmission TEXT DEFAULT '',
        horsepower INTEGER,
        registration_number TEXT DEFAULT '',
        registration_date TEXT DEFAULT '',
        max_trailer_weight INTEGER,
        drivetrain TEXT DEFAULT '',
        seats INTEGER,
        engine_volume REAL,
        range_wltp INTEGER,
        year TEXT NOT NULL,
        price INTEGER NOT NULL,
        mileage INTEGER NOT NULL,
        fuel_type TEXT NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        equipment TEXT DEFAULT '[]',
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE
      );
    `);

    // Migrera cars-tabell
    await migrateCarsTable(client);

    // 2.5 Tabell för flera bilder per bil
    await client.query(`
      CREATE TABLE IF NOT EXISTS car_images (
        id SERIAL PRIMARY KEY,
        car_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
      );
    `);

    // 3. Tabell för Leads
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        preferred_brand TEXT,
        preferred_model TEXT,
        preferred_fuel_type TEXT,
        min_year INTEGER,
        max_mileage INTEGER,
        max_budget INTEGER,
        requirements TEXT,
        source TEXT DEFAULT 'contact',
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrera leads-tabell
    await migrateLeadsTable(client);

    // 3.5 Tabell för sälj-förfrågningar
    await client.query(`
      CREATE TABLE IF NOT EXISTS sell_requests (
        id TEXT PRIMARY KEY,
        seller_name TEXT NOT NULL,
        seller_email TEXT NOT NULL,
        seller_phone TEXT NOT NULL,
        reg_number TEXT NOT NULL,
        car_brand TEXT,
        car_model TEXT,
        car_year INTEGER,
        mileage INTEGER,
        expected_price INTEGER,
        has_damage INTEGER NOT NULL DEFAULT 0,
        damage_details TEXT,
        condition_notes TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3.6 Tabell för bilder från sälj-förfrågningar
    await client.query(`
      CREATE TABLE IF NOT EXISTS sell_request_images (
        id SERIAL PRIMARY KEY,
        sell_request_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        FOREIGN KEY (sell_request_id) REFERENCES sell_requests(id) ON DELETE CASCADE
      );
    `);

    // 4. Tabell för bil-matchningar
    await client.query(`
      CREATE TABLE IF NOT EXISTS car_matches (
        id SERIAL PRIMARY KEY,
        lead_id TEXT NOT NULL,
        car_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending_notification',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
      );
    `);

    // 5. Tabell för Användare (admin-inloggning)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin'
      );
    `);

    // Skapa trigger för uppdaterad tidsstämpel på cars
    await client.query(`
      CREATE OR REPLACE FUNCTION update_cars_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_cars_timestamp ON cars;
    `);

    await client.query(`
      CREATE TRIGGER update_cars_timestamp
      BEFORE UPDATE ON cars
      FOR EACH ROW
      EXECUTE FUNCTION update_cars_timestamp();
    `);

    console.log("Databasen är konfigurerad och redo!");

    // Returnera ett wrapper-objekt som är kompatibelt med den gamla koden
    return createDBWrapper(pool);
  } finally {
    client.release();
  }
}

// Skapa ett wrapper-objekt för backward kompatibilitet
function createDBWrapper(pool) {
  return {
    // all(sql, params) - returnera alla rader
    all: async (sql, params = []) => {
      const result = await pool.query(convertSQLToPostgres(sql), params);
      return result.rows;
    },

    // get(sql, params) - returnera första rad
    get: async (sql, params = []) => {
      const result = await pool.query(convertSQLToPostgres(sql), params);
      return result.rows[0] || null;
    },

    // run(sql, params) - kör utan att returnera
    run: async (sql, params = []) => {
      const result = await pool.query(convertSQLToPostgres(sql), params);
      return { changes: result.rowCount };
    },

    // exec(sql) - kör raw SQL
    exec: async (sql) => {
      await pool.query(sql);
    },

    // query(sql, params) - raw query
    query: async (sql, params = []) => {
      return pool.query(convertSQLToPostgres(sql), params);
    },

    // pool - direktåtkomst för advanced användning
    pool,
  };
}

// Konvertera SQLite ? placeholders till PostgreSQL $1, $2, etc.
function convertSQLToPostgres(sql) {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

export { setupDB };
