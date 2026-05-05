# 🧪 Lokal Testing Guide

Innan du deplayer till Render, testa att allt fungerar lokalt:

---

## 1. Installera Dependencies

```bash
cd /Users/amir/Desktop/Project/FullStack-projekt/AutoEskil

# Installera alla deps
npm run install-all
```

---

## 2. Bygg Frontend

```bash
# Bygg React-frontend för production
npm run frontend:build

# Du bör se:
# ✓ packages/Frontend/dist/ skapas
```

---

## 3. Starta Backend (serverar beide API + Frontend)

```bash
# Sätt PORT-miljövariabel och starta
PORT=3001 npm start

# Du bör se:
# --- BILFÖRMEDLING ESKILSTUNA ---
# Servern körs på: http://localhost:3001
# Databasen är ansluten och redo.
```

---

## 4. Testa i Browser

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

