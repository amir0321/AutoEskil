# 🔄 PostgreSQL Migration Guide

Du har just migrerat från **SQLite** till **PostgreSQL**. Här är vad som hände och varför.

---

## ❓ Varför PostgreSQL?

### SQLite Problem på Render ❌
- SQLite lagrar data i en **filsystem-fil** (`.db`)
- Render har en **ephemeral filesystem** - filer raderas vid omstart
- **Resultat:** All din data försvinner varje gång servern startar om!

### PostgreSQL Solution ✅
- PostgreSQL är en **managed database** på Render
- Data lagras **permanent** på en dedikerad databas-server
- **Resultat:** Data är säker och persistent!

---

## 🔧 Vad ändrades?

### File: `packages/Backend/db.js`

**Från SQLite:**
```javascript
import sqlite3 from "sqlite3";
const dbPath = "./database/bilformedling_etuna.db";
const db = await open({ filename: dbPath, driver: sqlite3.Database });
```

**Till PostgreSQL:**
```javascript
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
```

### SQL Syntax Ändring

**SQLite:** Använder `?` för parameters
```javascript
db.get("SELECT * FROM cars WHERE id = ?", [carId])
```

**PostgreSQL:** Använder `$1`, `$2` för parameters
```javascript
pool.query("SELECT * FROM cars WHERE id = $1", [carId])
```

**✅ GOOD NEWS:** Jag har redan gjort en wrapper så ny kod fungerar med båda!

---

## 📦 Package Changes

**Innan:**
```json
{
  "sqlite": "^5.1.1",
  "sqlite3": "^6.0.1"
}
```

**Efter:**
```json
{
  "pg": "^8.11.3"
}
```

---

## 🗄️ Din PostgreSQL Databas

Du har redan skapat en databas på Render:

```
Databas URL: postgresql://autoeskil_user:ljqRQpmhOmtuR2Y0jjLTeGGn3Mi7liFZ@dpg-d7sr4o1kh4rs739aib5g-a/autoeskil
```

Denna URL är redan inställd i:
- ✅ `.env.example`
- ✅ Kan användas lokalt: `export DATABASE_URL="..."`
- ✅ Kommer att användas på Render

---

## 🧪 Testa Lokalt

```bash
# Installera nya PostgreSQL-paket
npm --prefix packages/Backend install

# Testa med Render-databasen
export DATABASE_URL="postgresql://autoeskil_user:ljqRQpmhOmtuR2Y0jjLTeGGn3Mi7liFZ@dpg-d7sr4o1kh4rs739aib5g-a/autoeskil"
npm run frontend:build
PORT=3001 npm start
```

Besök: `http://localhost:3001`

---

## ⚠️ Viktiga Notes

### Existerande SVT-data?
Om du förluster redan hade data i SQLite:
1. Data är fortfarande på din lokala `.db`-fil
2. Den finns INTE i PostgreSQL ännu
3. Vi kan importera datan senare vid behov

### Connections
- PostgreSQL tillåter ~10 samtidiga connections på Free-plan
- Render auto-reconnects vid timeout
- Du behöver inte göra något!

### Performance
- PostgreSQL är **mycket snappare** än SQLite för denna datamängd
- Queries är snabbare
- Databasen är managed av Render

---

## 📚 Nästa Steg

1. **Test lokalt:** `npm run frontend:build && PORT=3001 npm start`
2. **Push till GitHub:** `git push origin main`
3. **Deploy på Render:** Följ `DEPLOY-CHECKLIST.md`

---

## 🆘 Felsökning

### "Connection refused" på PostgreSQL
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Lösning:** Använd rätt DATABASE_URL från Render, inte localhost.

### "Database does not exist"
**Lösning:** Render skapar databasen automatiskt första gången server startar. Vänta 5 sekunder och försök igen.

### "Column does not exist"
**Trolig orsak:** Databaskema uppdaterades men koden använder gamla kolumner.  
**Lösning:** Se till att db.js är uppdaterad (redan gjort!).

---

## ✅ Allt är klart!

Din backend använder nu PostgreSQL och är redo för Render! ✅

**Nästa:** Läs `DEPLOY-CHECKLIST.md` för deployment-steg.

