# 🐙 Git Push Guide - Render Deployment

Här är exakt hur du pushar dina ändringar till GitHub för deployment på Render.

---

## 1️⃣ Kontrollera Git Status

```bash
cd /Users/amir/Desktop/Project/FullStack-projekt/AutoEskil
git status
```

Du bör se:
- ✅ Ändrade filer (`.js`, `.json`, `.md`)
- ✅ Nya filer (PostgreSQL-filer, dokumentation)
- ❌ Inte `node_modules/`, `.env`, atau `.db`-filer

---

## 2️⃣ Lägg till alla ändringer

```bash
git add .
```

---

## 3️⃣ Skapa commit

```bash
git commit -m "PostgreSQL migration + prepare for Render.com deployment"
```

---

## 4️⃣ Push till GitHub

```bash
git push origin main
```

⏱️ Din kod är nu på GitHub!

---

## ✅ Verifiering

Besök https://github.com/DITT_USERNAME/DITT_REPO och kontrollera:
- ✅ Nya filer synliga
- ✅ `db.js` visar PostgreSQL-kod
- ✅ `package.json` visar `"pg"` dependency

---

## 🎯 Nästa

Render detekterar automatiskt ändringar. Gå till https://render.com/dashboard och:

1. Skapa Web Service (anslut GitHub-repo)
2. Ställ in miljövariabler
3. Render deployar automatiskt!

---

## 🆘 Felsökning

### "Permission denied" på git push
```bash
# Kolla SSH-nyckel
ssh -T git@github.com

# Eller använd HTTPS istället
git remote set-url origin https://github.com/USERNAME/REPO.git
```

### "Changes not showing on GitHub"
- Vänta 10 sekunder
- Refresh sidan
- Kontrollera att du är på rätt branch (`main`)

---

**Lycka till! 🚀**

