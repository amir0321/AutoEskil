import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ändrade namnet på databasen till något som passar ditt projekt
const dbPath = path.join(__dirname, "database", "bilformedling_etuna.db");
const dbDir = path.dirname(dbPath);

async function migrateLeadsTable(db) {
  const leadsTable = await db.get(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'leads'",
  );
  const leadsSql = leadsTable && leadsTable.sql ? leadsTable.sql : "";

  // Check if source and status columns exist
  const hasSourceColumn = leadsSql.includes("source");
  const hasStatusColumn = leadsSql.includes("status");

  // If both columns already exist, no migration needed
  if (hasSourceColumn && hasStatusColumn) {
    return;
  }

  const hasLegacyUniqueInSchema =
    leadsSql.includes("customer_email TEXT NOT NULL UNIQUE") ||
    leadsSql.includes("customer_phone TEXT NOT NULL UNIQUE");

  const indexes = await db.all("PRAGMA index_list('leads')");
  let hasLegacyUniqueInIndexes = false;

  for (const index of indexes) {
    if (!index.unique) {
      continue;
    }

    const indexInfo = await db.all(`PRAGMA index_info('${index.name}')`);
    const indexedColumns = indexInfo.map((column) => column.name);
    if (
      indexedColumns.includes("customer_email") ||
      indexedColumns.includes("customer_phone")
    ) {
      hasLegacyUniqueInIndexes = true;
      break;
    }
  }

  const hasLegacyUnique = hasLegacyUniqueInSchema || hasLegacyUniqueInIndexes;

  await db.exec("PRAGMA foreign_keys = OFF");

  try {
    await db.exec("BEGIN IMMEDIATE TRANSACTION");
    await db.exec(`
            CREATE TABLE leads_new (
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
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

    await db.exec(`
            INSERT INTO leads_new (
                id, customer_name, customer_email, customer_phone,
                preferred_brand, preferred_model, preferred_fuel_type,
                min_year, max_mileage, max_budget, requirements, source, status, created_at
            )
            SELECT
                id, customer_name, customer_email, customer_phone,
                preferred_brand, preferred_model, preferred_fuel_type,
                min_year, max_mileage, max_budget, requirements, 
                COALESCE(source, 'contact'), COALESCE(status, 'active'), created_at
            FROM leads;
        `);

    await db.exec("DROP TABLE leads");
    await db.exec("ALTER TABLE leads_new RENAME TO leads");
    await db.exec("COMMIT");
    console.log("Leads schema migrated: added source and status columns.");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  } finally {
    await db.exec("PRAGMA foreign_keys = ON");
  }
}

async function migrateCarsTable(db) {
  const columns = await db.all("PRAGMA table_info('cars')");
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("variant")) {
    await db.exec("ALTER TABLE cars ADD COLUMN variant TEXT DEFAULT ''");
  }

  if (!columnNames.has("color")) {
    await db.exec("ALTER TABLE cars ADD COLUMN color TEXT DEFAULT ''");
  }

  if (!columnNames.has("transmission")) {
    await db.exec("ALTER TABLE cars ADD COLUMN transmission TEXT DEFAULT ''");
  }
}

async function setupDB() {
  await fs.mkdir(dbDir, { recursive: true });

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Aktivera Foreign Key-stöd i SQLite (viktigt!)
  await db.get("PRAGMA foreign_keys = ON");

  // 1. Tabell för Bilhandlare i Eskilstuna
  await db.exec(`
        CREATE TABLE IF NOT EXISTS dealers (
                                               id TEXT PRIMARY KEY,
                                               name TEXT NOT NULL,
                                               contact_person TEXT NOT NULL,
                                               email TEXT NOT NULL UNIQUE,
                                               phone TEXT NOT NULL UNIQUE
        );
    `);

  // 2. Tabell för Bilar (Lagerlista)
  await db.exec(`
        CREATE TABLE IF NOT EXISTS cars (
                                            id TEXT PRIMARY KEY,
                                            dealer_id TEXT NOT NULL,
                                            brand TEXT NOT NULL,
                                            model TEXT NOT NULL,
                  variant TEXT DEFAULT '',
                  color TEXT DEFAULT '',
                                            transmission TEXT DEFAULT '',
                                            year TEXT NOT NULL,
                                            price INTEGER NOT NULL,
                                            mileage INTEGER NOT NULL,
                                            fuel_type TEXT NOT NULL,
                                            description TEXT,
                                            image_url TEXT NOT NULL,
                                            FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE
            );
    `);

  await migrateCarsTable(db);

  // 2.5 Tabell för flera bilder per bil
  await db.exec(`
        CREATE TABLE IF NOT EXISTS car_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            car_id TEXT NOT NULL,
            image_url TEXT NOT NULL,
            FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
        );
    `);
  // 3. Tabell för Leads (Kundförfrågningar från formuläret)
  await db.exec(`
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
                                             created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

  await migrateLeadsTable(db);

  // 4. Tabell för bil-matchningar (Kopplar en lead till en specifik bil)
  await db.exec(`
        CREATE TABLE IF NOT EXISTS car_matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id TEXT NOT NULL,
            car_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending_notification',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
            FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
        );
    `);

  // 5. Tabell för Användare (för admin-inloggning)
  await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'admin'
        );
    `);

  console.log("Databasen är konfigurerad och redo!");
  return db;
}

export { setupDB };
