# AutoEskil API Dokumentation

Detta dokument beskriver de API-endpoints som finns tillgängliga i backend-systemet. Systemet är byggt i Node.js med Express och använder en SQLite-databas för att spara data.

## Servern
* **Port:** Som standard körs servern på `http://localhost:3000`.
* **Middlewares:** Systemet använder `helmet` för säkerhet, `cors` för cross-origin requests (konfigurerat), and `express-rate-limit` för att förhindra överbelastningsattacker.

---

## 🔐 Autentisering
Alla skyddade rutter i systemet (primärt under `/api/admin/`) kräver en giltig session via en `HttpOnly` cookie.

* **Logga in**: `POST /api/login`
  * **Body JSON:**
    ```json
    {
      "username": "admin_username",
      "password": "admin_password"
    }
    ```
  * **Svar (Success):** `{ "message": "Login successful" }`
  * **Notering:** Servern sätter en `HttpOnly` cookie (`admin_token`) automatiskt.

* **Verifiera session:** `GET /api/session`
  * **Svar (Success):** `{ "authenticated": true, "user": { "id": "...", "username": "...", "role": "admin" } }`

* **Logga ut:** `POST /api/logout`
  * **Notering:** Servern rensar `admin_token`-cookien.

---

## 🌍 Publika Rutter (`/api`)
Dessa rutter är öppna för alla (inklusive frontend) och behöver ingen token.

### 🚗 Bilar
* **Hämta alla bilar från lagret:** `GET /api/cars`
  * **Svar:** Array med alla bilar i databasen.

### 👥 Kundförfrågningar (Leads)
* **Sen en ny förfrågan:** `POST /api/leads`
  * **Beskrivning:** Används för att registrera en kunds önskemål. Om en bil i lagret matchar kundens önskemål returneras denna direkt.
  * **Body JSON (Exempel):**
    ```json
    {
      "customer_name": "Anna Andersson",
      "customer_email": "anna@example.com",
      "customer_phone": "0701234567",
      "preferred_brand": "Volvo",
      "preferred_model": "V60",
      "preferred_fuel_type": "El",
      "min_year": 2018,
      "max_mileage": 100000,
      "max_budget": 250000,
      "requirements": "Dragkrok är ett måste"
    }
    ```
  * **Svar:** Meddelande som bekräftar att leaden har sparats. Om bilen fanns i lagret innehåller `"matches"` information om den.

---

## 🛡️ Administratörsrutter (`/api/admin`)
Samtliga dessa rutter kräver inloggning via cookie-session.

### 🚗 Bilhantering
*(Används `/api/admin/cars` även om originalfilerna styrs från `cars.js` router som i sin tur skyddas i admin)*
* **Lägg till ny bil:** `POST /api/admin/cars`
  * **Body JSON (alla fält utom ID):** `dealer_id`, `brand`, `model`, `year`, `price`, `mileage`, `fuel_type`, `description` (frivillig text för skatt/besiktning/osv), `image_url`.
* **Uppdatera existerande bil:** `PUT /api/admin/cars/:id`
  * **Body JSON:** Valfria fält som du vill uppdatera (t.ex. `{ "price": 185000 }`).
* **Ta bort bil:** `DELETE /api/admin/cars/:id`
  * Tar bort bilen ifrån databasen.

### 🤝 Bilhandlare (Dealers)
* **Hämta alla bilhandlare:** `GET /api/admin/dealers`
  * **Svar:** Lista på anslutna handlare, **inklusive de bilar som tillhör varje handlare**.
  * **Exempelsvar:**
    ```json
    [
      {
        "id": "abc...",
        "name": "Eskilstuna Bilar AB",
        "contact_person": "Pelle Pil",
        "email": "kontakt@eskilstunabilar.se",
        "phone": "0701234567",
        "cars": [
          {
            "id": "def...",
            "brand": "Volvo",
            "model": "XC60"
          }
        ]
      }
    ]
    ```
* **Lägg till ny bilhandlare:** `POST /api/admin/dealers`
  * **Body JSON:** `{ "name": "...", "contact_person": "...", "email": "...", "phone": "..." }`
* **Uppdatera handlare:** `PUT /api/admin/dealers/:id`
  * **Body JSON:** Fält som ska ändras (t.ex. `{ "phone": "0700000000" }`).
* **Ta bort handlare:** `DELETE /api/admin/dealers/:id`

### 👥 Leads (Endast Admin)
* **Hämta alla inkomna leads:** `GET /api/admin/leads`
  * **Svar:** En lista med alla kundförfrågningar, sorterade med de senaste först. **Innehåller även en lista på de bilar som matchade kundens förfrågan under fältet `matches`.**
* **Ta bort en lead:** `DELETE /api/admin/leads/:id`
  * Tar bort leaden permanent från databasen.

---
**Obs:** Systemet har strikta foreign key constraint regler via databasen (`ON DELETE CASCADE`), vilket betyder att om en Dealer eller Lead raderas så tas även relaterade "Car Matches" bort automatiskt.
