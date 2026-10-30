# AutoEskil – Bilförmedling & Automatisk Lead-matchning

AutoEskil är en fullstack-applikation byggd för en lokal bilförmedling i Eskilstuna. Tanken bakom projektet är att förenkla kontakten mellan bilköpare och lokala bilhandlare: istället för att kunden bara bläddrar runt i ett statiskt lager kan man skicka in en intresseanmälan (*lead*) med sina krav (märke, modell, drivmedel, årsmodell, maxpris och miltal), varpå systemet automatiskt matchar önskemålen mot bilar som finns i lager hos anslutna bilhandlare.

---

## 🛠️ Teknikstack

- **Frontend (`packages/Frontend`):** React, Vite, React Router
- **Backend (`packages/Backend`):** Node.js, Express, `helmet`, `cors`, `express-rate-limit`
- **Databas:** SQLite under tidig utveckling → migrerad till **PostgreSQL (`pg`)** inför driftsättning på Render
- **Autentisering:** Sessionsbaserad admin-inloggning med `HttpOnly`-cookies

---

## 🧠 Mina tekniska val, utmaningar & vad jag lärde mig

### 1. Varför jag bytte från SQLite till PostgreSQL (och hur jag löste migreringen)
Jag började bygga projektet med SQLite (`sqlite3`) eftersom det var snabbt och smidigt att jobba med lokalt under utvecklingen utan att behöva konfigurera en extern databasserver.
När jag sedan skulle driftsätta applikationen på Render stötte jag på ett klassiskt produktionsproblem: Render har ett temporärt filsystem (*ephemeral disk*), vilket innebar att SQLite-databasfilen nollställdes varje gång servern startade om.

**Hur jag löste det:**
- Jag bytte ut databasskiktet i `packages/Backend/db.js` till PostgreSQL (`pg.Pool`).
- För att slippa skriva om varenda SQL-anrop i alla befintliga filer samtidigt byggde jag en egen kompatibilitets-wrapper (`db.all()`, `db.get()`, `db.run()`) som automatiskt översatte mina befintliga `?`-parametrar till PostgreSQL:s `$1, $2`-syntax.

### 2. Direkt matchning vid kundförfrågan (`POST /api/leads`)
Jag ville att en kund som skickar in sina önskemål skulle få direkt återkoppling om det redan finns en bil inne som passar.
När en förfrågan skickas in sparas inte bara leaden för administratören, utan backend kör direkt en matchningsfråga mot bilhandlarnas lager och returnerar eventuella träffar i `matches`. Samtidigt kopplas relationerna i databasen med `ON DELETE CASCADE`, så att gamla matchningar städas bort automatiskt om en bil säljs eller en bilhandlare tas bort.

### 3. Säkerhet i adminpanelen med `HttpOnly`-cookies
Eftersom vanliga besökare på sajten inte behöver logga in för att se bilar eller skicka in en intresseanmälan är det bara administratören som har en session. Jag valde därför att lagra admin-sessionen (`admin_token`) i en `HttpOnly`-cookie istället för i `localStorage` för att skydda mot XSS, kombinerat med `helmet` och `express-rate-limit` på inloggningen.

### 4. Hur jag använde AI i projektet
Jag använde AI som bollplank när jag felsökte Render-driftsättningen, CORS/proxy-inställningarna (`trust proxy`) och migreringen från SQLite till PostgreSQL, medan jag själv bestämde affärslogiken kring bilhandlare, leads och automatisk matchning.

---

## 🚀 Köra projektet lokalt

1. **Installera beroenden för både frontend och backend:**
   ```bash
   npm run install-all
   ```

2. **Konfigurera miljövariabler:**
   Skapa en `.env`-fil utifrån `.env.example` och ange din PostgreSQL-anslutning (`DATABASE_URL`) samt admin-uppgifter.

3. **Bygg frontend och starta servern:**
   ```bash
   npm run build
   npm start
   ```
   Servern startar som standard på `http://localhost:3000` och serverar både API:et (`/api/*`) och den byggda React-applikationen.

---

## 📡 API-översikt

Fullständig dokumentation av alla endpoints finns i [`packages/Backend/README.md`](./packages/Backend/README.md):

- **Publika rutter:**
  - `GET /api/cars` – Hämta alla bilar i lager
  - `POST /api/leads` – Skicka in kundförfrågan och få direktmatchning mot lagret
- **Autentisering:**
  - `POST /api/login` / `GET /api/session` / `POST /api/logout`
- **Admin (`/api/admin/*`):**
  - Hantera bilar (`POST`, `PUT`, `DELETE /api/admin/cars`)
  - Hantera bilhandlare (`GET`, `POST`, `PUT`, `DELETE /api/admin/dealers`)
  - Hantera inkomna leads och se matchade bilar (`GET`, `DELETE /api/admin/leads`)
