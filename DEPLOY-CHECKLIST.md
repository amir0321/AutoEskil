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
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. [ ] **Skapa Render-konto:** https://render.com (logga in med GitHub)

---

## 🚀 Render Deployment Steps

### ▶️ Steg 1: PostgreSQL Database

- [ ] Gå till Render Dashboard
- [ ] Ny → PostgreSQL
- [ ] Namn: `autoeskil`
- [ ] Region: `Frankfurt (eu-central-1)`
- [ ] Plan: **Free**
- [ ] Kopiera **Internal Database URL**

**Sparad URL:** `___________________________________`

---

### ▶️ Steg 2: Web Service (Backend)

- [ ] Ny → Web Service
- [ ] Anslut GitHub-repo
- [ ] **Name:** autoeskil-backend
- [ ] **Region:** Frankfurt (samma som DB!)
- [ ] **Branch:** main
- [ ] **Runtime:** Node
- [ ] **Build Command:** `npm install && npm run build`
- [ ] **Start Command:** `npm start`

**Environment Variables (Advanced):**

```
DATABASE_URL = [från PostgreSQL URL ovan]
JWT_SECRET = [generera: openssl rand -base64 32]
ALLOWED_ORIGINS = https://autoeskil.se,https://www.autoeskil.se
PUBLIC_SITE_URL = https://autoeskil.se
```

- [ ] Skapa Web Service
- [ ] Vänta på build (5-10 min) - se Logs
- [ ] Kopiera din Render URL: `_____________________.onrender.com`

---

### ▶️ Steg 3: Custom Domain (One.com)

**I Render Dashboard:**
- [ ] Gå till Web Service → Settings
- [ ] Custom Domain → Add Domain
- [ ] Skriv: `autoeskil.se`
- [ ] Kopiera DNS-instruktionerna från Render

**I One.com Dashboard:**
- [ ] Logga in på one.com
- [ ] Gå till DNS Records
- [ ] **Uppdatera:**
  - [ ] A/ANAME record: @ → [Render IP]
  - [ ] CNAME record: www → autoeskil.onrender.com

- [ ] Spara - Vänta på DNS (10-60 min)

---

## ✅ Verifiering

```bash
# Test att sidan laddar
curl https://autoeskil.se

# Test API
curl https://autoeskil.se/api/cars

# Kontrollera Render logs
# https://render.com → Web Service → Logs
```

---

## 📚 Dokumentation

- **Setup guide:** `RENDER-SETUP.md`
- **Environment vars:** `.env.example`
- **Backend start:** `packages/Backend/server.js`

---

## 🎯 Efter Deploy

Varje push till GitHub triggerar automatisk deploy:

```bash
git add .
git commit -m "Din meddelande"
git push origin main
# Render bygger och deployar automatiskt!
```

**Grattis! Din app leve nu på autoeskil.se** 🚀

