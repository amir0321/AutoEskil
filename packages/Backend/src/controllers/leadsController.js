import crypto from "crypto";

export async function createLead(db, leadData) {
  const {
    customer_name,
    customer_email,
    customer_phone,
    preferred_brand,
    preferred_model,
    preferred_fuel_type,
    min_year,
    max_mileage,
    max_budget,
    requirements,
    source,
  } = leadData;

  const id = crypto.randomUUID();

  try {
    await db.run(
      `
            INSERT INTO leads (
                id, customer_name, customer_email, customer_phone, 
                preferred_brand, preferred_model, preferred_fuel_type, min_year, max_mileage, 
                max_budget, requirements, source
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        customer_name,
        customer_email,
        customer_phone,
        preferred_brand,
        preferred_model,
        preferred_fuel_type,
        min_year,
        max_mileage,
        max_budget,
        requirements,
        source || "contact",
      ],
    );

    return { success: true, leadId: id };
  } catch (error) {
    console.error("Error creating lead:", error);
    return { success: false, error: error.message };
  }
}

/**
 * @param {object} db - Databasanslutningen.
 * @param {object} leadData - Datan från kundens förfrågan.
 * @returns {Promise<Array>} En lista med ID:n för matchande bilar.
 */
export async function findMatchingCars(db, leadData) {
  let {
    preferred_brand,
    preferred_model,
    preferred_fuel_type,
    min_year,
    max_mileage,
    max_budget,
  } = leadData;

  // Säkra upp så att tomma strängar tolkar som null (viktigt om frontend skickar tomma värden)
  preferred_brand = preferred_brand ? preferred_brand.trim() : null;
  preferred_model = preferred_model ? preferred_model.trim() : null;
  preferred_fuel_type = preferred_fuel_type ? preferred_fuel_type.trim() : null;
  min_year = min_year || null;
  max_mileage = max_mileage || null;
  max_budget = max_budget || null;

  // UPPDATERING: Vi kollar BARA på bil-kriterier nu. Om kunden bara skickat ett
  // meddelande/kontaktinfo returnerar vi direkt en tom lista.
  if (
    !preferred_brand &&
    !preferred_model &&
    !preferred_fuel_type &&
    !min_year &&
    !max_mileage &&
    !max_budget
  ) {
    return [];
  }

  let query = `
    SELECT id,
           (
             (CASE WHEN ? IS NULL OR TRIM(LOWER(brand)) LIKE TRIM(LOWER(?)) THEN 2 ELSE 0 END) +
             (CASE WHEN ? IS NULL OR TRIM(LOWER(model)) = TRIM(LOWER(?)) THEN 2 ELSE 0 END) +
             (CASE WHEN ? IS NULL OR TRIM(LOWER(fuel_type)) = TRIM(LOWER(?)) THEN 2 ELSE 0 END) +
             (CASE WHEN ? IS NULL OR year >= ? THEN 1 ELSE 0 END) +
             (CASE WHEN ? IS NULL OR mileage <= ? THEN 1 ELSE 0 END) +
             (CASE WHEN ? IS NULL OR price <= ? THEN 1 ELSE 0 END)
             ) as match_score
    FROM cars
    WHERE
      (price <= ? OR ? IS NULL) AND
      (year >= ? OR ? IS NULL) AND
      (mileage <= ? OR ? IS NULL) AND
      (TRIM(LOWER(brand)) LIKE TRIM(LOWER(?)) OR ? IS NULL) AND
      (TRIM(LOWER(model)) = TRIM(LOWER(?)) OR ? IS NULL) AND
      (TRIM(LOWER(fuel_type)) = TRIM(LOWER(?)) OR ? IS NULL)
    ORDER BY match_score DESC
      LIMIT 10;
  `;

  const params = [
    preferred_brand,
    `%${preferred_brand}%`,
    preferred_model,
    preferred_model,
    preferred_fuel_type,
    preferred_fuel_type,
    min_year,
    min_year,
    max_mileage,
    max_mileage,
    max_budget,
    max_budget,
    max_budget,
    max_budget,
    min_year,
    min_year,
    max_mileage,
    max_mileage,
    `%${preferred_brand}%`,
    preferred_brand,
    preferred_model,
    preferred_model,
    preferred_fuel_type,
    preferred_fuel_type,
  ];

  try {
    const matchingCars = await db.all(query, params);
    // Filtrera bort de som har 0 i poäng och returnera bara ID.
    return matchingCars
      .filter((car) => car.match_score > 0)
      .map((car) => car.id);
  } catch (error) {
    console.error("Error finding matching cars:", error);
    return [];
  }
}

/**
 * Skapar matchnings-poster i databasen för att koppla en lead till hittade bilar.
 * @param {object} db - Databasanslutningen.
 * @param {string} leadId - ID för den skapade leaden.
 * @param {Array<string>} carIds - En lista med ID:n för matchande bilar.
 */
export async function createCarMatches(db, leadId, carIds) {
  // Om inga bilar matchade, behöver vi inte göra något.
  if (carIds.length === 0) {
    return;
  }

  // Förbered en SQL-fråga för att snabbt kunna lägga till flera rader.
  const stmt = await db.prepare(
    "INSERT INTO car_matches (lead_id, car_id) VALUES (?, ?)",
  );

  // Loopa igenom alla matchande bil-ID:n och skapa en post i car_matches.
  for (const carId of carIds) {
    await stmt.run(leadId, carId);
  }

  // Avsluta och städa upp SQL-frågan.
  await stmt.finalize();
  console.log(`Skapade ${carIds.length} bilmatchningar för lead ${leadId}.`);
}

export async function deleteLead(db, leadId) {
  try {
    const result = await db.run("DELETE FROM leads WHERE id = ?", [leadId]);
    if (result.changes === 0) {
      return { success: false, error: "Lead hittades inte." };
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting lead:", error);
    return { success: false, error: error.message };
  }
}

export async function getAllLeads(db) {
  try {
    const leads = await db.all("SELECT * FROM leads ORDER BY created_at DESC");

    // Hämta alla matchningar med tillhörande bilinformation och bilder
    const allMatches = await db.all(`
            SELECT cm.lead_id, c.*,
                   (
                     SELECT json_agg(image_url)
                     FROM (
                       SELECT image_url
                       FROM car_images
                       WHERE car_id = c.id
                       ORDER BY id ASC
                     )
                   ) as car_images_list
            FROM car_matches cm
            JOIN cars c ON cm.car_id = c.id
            GROUP BY cm.lead_id, c.id
        `);

    // Mappa ihop varje lead med dess bilar
    const leadsWithMatches = leads.map((lead) => {
      return {
        ...lead,
        matches: allMatches
          .filter((m) => m.lead_id === lead.id)
          .map(({ lead_id, car_images_list, ...carDetails }) => {
            let images = [];
            if (car_images_list) {
              images = JSON.parse(car_images_list).filter(
                (url) => url !== null,
              );
            }
            return { ...carDetails, images };
          }),
      };
    });

    return { success: true, data: leadsWithMatches };
  } catch (error) {
    console.error("Error fetching leads:", error);
    return { success: false, error: error.message };
  }
}

export async function updateLeadStatus(db, leadId, newStatus) {
  const validStatuses = ["active", "confirmed"];
  if (!validStatuses.includes(newStatus)) {
    return { success: false, error: "Invalid status" };
  }

  try {
    const result = await db.run("UPDATE leads SET status = ? WHERE id = ?", [
      newStatus,
      leadId,
    ]);

    if (result.changes === 0) {
      return { success: false, error: "Lead not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating lead status:", error);
    return { success: false, error: error.message };
  }
}
