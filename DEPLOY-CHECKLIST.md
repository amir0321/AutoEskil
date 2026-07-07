# ✅ Render.com Deployment Checklist

## 🔧 Code Preparation (redan gjord!)

- [x] Server.js använder `process.env.PORT`
- [x] Root package.json har `build` og `start` scripts
- [x] Server servar React-frontend från `/dist`
- [x] CORS är konfigurerad för production
- [x] Catch-all route för React Router

## 📋 Prima du börjar

1. [ ] **GitHub:** Pusha all kod till din repo
   ```bash
   git add .
   git commit -m "Migrate to PostgreSQL and prepare for Render deployment"
   git push origin main
   ```

2. [ ] **Skapa Render-konto:** https://render.com (logga in med GitHub)

---

## 🚀 Render Deployment Steps

### ▶️ Steg 1: PostgreSQL Database (REDAN SKAPAD!) ✅

Du har redan GÅ och skapat en PostgreSQL-databas på Render!

**Din DATABASE_URL:**
```
postgresql://USER:PASSWORD@HOST/DBNAME
```

**Spara denna!** Du behöver den i nästa steg.

---

### ▶️ Steg 2: Web Service (Backend)

- [ ] Gå till Render Dashboard: https://render.com/dashboard
- [ ] Klicka **"New +" → "Web Service"**
- [ ] Anslut ditt GitHub-repo (Select the repo)
- [ ] Fyll i dessa inställningar:

  | Setting | Värde |
  |---------|-------|
  | **Name** | autoeskil-backend |
  | **Region** | Frankfurt (eu-central-1) |
  | **Branch** | main |
  | **Runtime** | Node |
  | **Build Command** | `npm install && npm run build` |
  | **Start Command** | `npm start` |

- [ ] Klicka **"Advanced"** och sedan **"Add Environment Variable"**

**Lee till dessa Environment Variables:**

```
DATABASE_URL = postgresql://USER:PASSWORD@HOST/DBNAME
JWT_SECRET = [generera: openssl rand -base64 32]
ALLOWED_ORIGINS = https://autoeskil.se,https://www.autoeskil.se
PUBLIC_SITE_URL = https://autoeskil.se
NODE_ENV = production
```

- [ ] Klicka **"Create Web Service"**
- [ ] Vänta på build (5-10 minuter) - Se progress i **Logs**
- [ ] **Kopiera din Render URL** (ser ut som: `autoeskil-backend.onrender.com`)

---

### ▶️ Steg 3: Custom Domain (One.com)

**I Render Dashboard:**
- [ ] Gå till din Web Service → **Settings** (längst upp)
- [ ] Scrolla ner till **"Custom Domain"**
- [ ] Klicka **"Add Custom Domain"**
- [ ] Skriv: `autoeskil.se`
- [ ] Klicka **"Add Domain"**

Render visar DNS-instruktioner. **Kopiera värdena!**

**I One.com Dashboard:**
- [ ] Logga in: https://one.com
- [ ] Gå till **Domains** → **DNS Records** (eller Zonefil)
- [ ] **Uppdatera:**

  | Record Type | Namn | Värde |
  |-------------|------|-------|
  | **A eller ANAME** | `@` | [Render IP-adress] |
  | **CNAME** | `www` | `autoeskil.onrender.com` |

- [ ] **Spara** - DNS uppdateras inom 10-60 min

---

## ✅ Verifiering

```bash
# Test att sidan laddar
curl https://autoeskil.se

# Test att API fungerar
curl https://autoeskil.se/api/cars

# Kontrollera Render logs
# https://render.com → Web Service → Logs
```

---

## 📚 Dokumentation

- **Render Setup guide:** `RENDER-SETUP.md`
- **Alla environment vars:** `.env.example`

---

## 🎯 Efter Deploy

Varje push till GitHub triggerar automatisk deploy:

```bash
git add .
git commit -m "Din ändring"
git push origin main
# Render bygger och deployar automatiskt!
```

**Grattis!** 🚀
