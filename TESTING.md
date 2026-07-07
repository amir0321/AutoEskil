# 🧪 Lokal Testing Guide

Innan du deplayer till Render, testa att allt fungerar lokalt:

---

## 1. Installera Dependencies

```bash
cd /Users/amir/Desktop/Project/FullStack-projekt/AutoEskil

# Installera alla deps (inklusive nya PostgreSQL-paket)
npm run install-all
```

**Obs!** Backend använder nu PostgreSQL (`pg`-paketet) istället för SQLite.

---

## 2. Sätt DATABASE_URL-miljövariabel

**Option A: Lokal PostgreSQL (om du har den)**
```bash
export DATABASE_URL="postgresql://username:password@localhost:5432/autoeskil"
```

**Option B: Använd Render-databasen (enkelt)**
```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME"
```

---

## 3. Bygg Frontend

```bash
# Bygg React-frontend för production
npm run frontend:build

# Du bör se:
# ✓ packages/Frontend/dist/ skapas
```

---

## 4. Starta Backend (serverar både API + Frontend)

```bash
# Med DATABASE_URL från Render
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME" PORT=3001 npm start

# Du bör se:
# --- BILFÖRMEDLING ESKILSTUNA ---
# Servern körs på: http://localhost:3001
# Databasen är ansluten och redo.
```

**Obs!** Första gången backend ansluter skapar det automatiskt alla PostgreSQL-tabeller.

---

## 5. Testa i Browser

```
http://localhost:3001
```

✅ Du bör se AutoEskil-hemsidan ladda!

---

## 5. Testa API-routes

```bash
# I ny terminal:

# Hämta alla bilar
curl http://localhost:3001/api/cars

# Admin login (om setup)
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

---

## 6. Testa React Router (Viktigt!)

Besök dessa i browser och se att sidan laddar (inte 404):

- http://localhost:3001/ (Home)
- http://localhost:3001/bilar (Bilar)
- http://localhost:3001/om-oss (Om oss)
- http://localhost:3001/kontakt (Kontakt)
- http://localhost:3001/admin (Admin)
- http://localhost:3001/något-som-inte-finns (404 från React)

✅ Alla ska ladda utan felmeddelanden.

---

## 7. Kontrollera Logs

I bakgrunden (där server körs):

```
Servern körs på: http://localhost:3001
Databasen är ansluten och redo.
```

**Inga erro?** Du är redo för Render! ✅

---

## Felsökning

### "Cannot GET /"
- Kontrollera att `Frontend/dist/` existerar
- Kör `npm run frontend:build` igen

### "Port 3001 is already in use"
```bash
# Använd annan port
PORT=3002 npm start
```

### "Database connection error"
- Backend använder lokal SQLite
- Rendering kräver PostgreSQL (vi fixar senare om nödvändigt)

### CORS Error
- Lokalt utveckling är OK
- Production CORS är konfigurerad för autoeskil.se

---

## ✅ Checklist före Render Deploy

- [x] `npm run frontend:build` lyckas
- [x] `PORT=3001 npm start` lyckas
- [x] http://localhost:3001 laddar
- [x] http://localhost:3001/bilar laddar
- [x] http://localhost:3001/api/cars fungerar (besök i browser)
- [x] Ingen felmeddelanden i terminal

**Allt OK?** Du kan börja Render-deployment! 🚀

Se `DEPLOY-CHECKLIST.md` för nästa steg.
