# 📦 Deployment Guide: Render.com

Denna guide hjälper dig att lägga upp AutoEskil på Render.com en gång för alla.

---

## ✅ Förutsättningar

- [x] GitHub-konto med projektet uppladdat
- [x] Render.com-konto (logga in med GitHub)
- [x] One.com-domän (autoeskil.se)
- [x] PostgreSQL-databas redan skapad på Render

---

## 📋 Steg 1-4: Render Setup

### Steg 1: Förbered koden ✓
Projektet är redan förberett! Vi har redan:
- ✓ Migrerat från SQLite till PostgreSQL
- ✓ Satt `PORT = process.env.PORT || 3001` i server.js
- ✓ Skapat build-scripts i root package.json
- ✓ Konfigurerat backend att serva React-frontend
- ✓ Backend använder PostgreSQL via `pg`-paketet

**Checklist:**
```bash
# Installera nya dependencies
npm install
npm --prefix packages/Backend install

# Kontrollera att allt är i GitHub
git status
git add .
git commit -m "Migrate to PostgreSQL"
git push origin main
```

---

### Steg 2: PostgreSQL Database på Render ✅ (REDAN SKAPAD!)

Du har redan skapat en PostgreSQL-databas! Din URL är:

```
postgresql://USER:PASSWORD@HOST/DBNAME
```

**Denna URL är redan konfigurerad i:**
- ✓ `.env.example` (referens)
- ✓ Din db.js använder `process.env.DATABASE_URL`

Du behöver inte göra något i det här steget! Gå direkt till **Steg 3**.

---

### Steg 3: Skapa Web Service (Backend)

1. Gå till https://render.com/dashboard
2. Klicka **"New"** → **"Web Service"**
3. Välj **"Connect a repository"** → ditt GitHub-repo
4. Fyll i:
   - **Name:** `autoeskil-backend` (eller valfritt namn)
   - **Region:** Samma som databasen (Frankfurt/eu-central-1)
   - **Branch:** `main` (eller din branch)
   - **Runtime:** `Node`
   - **Build Command:** 
     ```
     npm install && npm run build
     ```
   - **Start Command:**
     ```
     npm start
     ```

5. Under **"Advanced"** → klicka **"Add Environment Variable"**
   
   Lägg till dessa variabler:
   
    | Nyckel | Värde |
    |--------|-------|
    | `DATABASE_URL` | `postgresql://USER:PASSWORD@HOST/DBNAME` |
    | `JWT_SECRET` | Generera: `openssl rand -base64 32` |
    | `ALLOWED_ORIGINS` | `https://autoeskil.se,https://www.autoeskil.se` |
    | `PUBLIC_SITE_URL` | `https://autoeskil.se` |
    | `NODE_ENV` | `production` |

6. Klicka **"Create Web Service"**

⏱️ Vänta ~5-10 minuter på build. Du ser progress i **Logs**.

✅ Du får en gratis URL: `autoeskil-backend.onrender.com` (eller liknande)

---

### Steg 4: Koppla One.com domän

Nu ska vi peka `autoeskil.se` till Render:

**I Render dashboard:**
1. Gå till din Web Service
2. Klicka **"Settings"** (högst upp)
3. Scrolla ner till **"Custom Domain"**
4. Klicka **"Add Custom Domain"**
5. Skriv: `autoeskil.se`
6. Klicka **"Add Domain"**

Render visar då DNS-instruktioner. **Kopiera värdena!**

**I One.com dashboard:**
1. Logga in på https://one.com (eller administrationspanelen för din domän)
2. Gå till **"DNS Records"** eller **"Zonefil"**
3. **Uppdatera:**

   | Typ | Namn | Värde |
   |-----|------|-------|
   | A eller ANAME | `@` | Rendering IP (från Render) |
   | CNAME | `www` | `autoeskil.onrender.com` |

4. **Spara** - DNS uppdateras inom 24 timmar (ofta inom minuter)

✅ Besök `https://autoeskil.se` - det bör fungera!

---

## 🧪 Testa Deploymentet

```bash
# 1. Kontrollera att sidan laddar
curl https://autoeskil.se

# 2. Kontrollera that API fungerar
curl https://autoeskil.se/api/cars

# 3. Kontrollera logs på Render
# → Web Service → Logs
```

---

## 🔧 Uppdatera Koden

Varje gång du gör `git push` till main:

1. Render detekterar ändring automatiskt
2. Bygger och deployerar automatiskt (~5-10 min)
3. Se progress i Render dashboard → Logs

**Det är det!** Ingen manuell deployment behövs.

---

## 📌 Backend Server.js Ändringar (redan gjorda)

Din server.js är nu uppdaterad för:
- ✓ Läsa PORT från `process.env.PORT`
- ✓ Serva React-frontenden från `/dist`
- ✓ Hantera React Router med catch-all route
- ✓ Aktiverad `trust proxy` för Render

---

## 🆘 Felsökning

### "Connection refused" på databasen
- Kontrollera att `DATABASE_URL` är rätt i Render Settings
- Warten på databasen att starta (2-3 min)

### "CORS error"
- Lägg till din domän i `ALLOWED_ORIGINS` (med https://)
- Redeploy eller ändra miljövariabeln

### Sidan visar "cannot GET /"
- Kontrollera att build-commando kördes: `Web Service → Logs`
- Se till att `Frontend/dist` är genererad

### SQLite databas problem
- Render stöder INTE SQLite genom fil-system
- Du MÅSTE använda PostgreSQL (Steg 2)
- Uppdatera din db.js för PostgreSQL (vi gör detta vid behov)

---

## 💰 Kostnad

- **Postgres Database (Free):** Gratis första 90 dagar, sen ~$7/mån
- **Web Service (Free):** Gratis så länge < 750 timmar/mån
- **Domän:** ~$10/år (One.com)

**Total:** ~$17-20/år för låg trafik

---

## 🚀 Nästa Steg

1. Push koden till GitHub
2. Följ Steg 1-4 ovan
3. Testa på `autoeskil.se`
4. Grattis! 🎉

---

**Frågor?** Kontakta support@render.com eller se docs.render.com
