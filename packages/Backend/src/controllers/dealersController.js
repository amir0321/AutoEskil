import crypto from "crypto";

async function addDealer(db, dealerData) {
  const { name, contact_person, email, phone } = dealerData;
  const id = crypto.randomUUID();

  try {
    await db.run(
      `INSERT INTO dealers (id, name, contact_person, email, phone)
         VALUES (?, ?, ?, ?, ?)`,
      [id, name, contact_person, email, phone],
    );
    return { success: true, id };
  } catch (error) {
    console.error("Error adding dealer:", error);
    return { success: false, error: error.message };
  }
}

async function getAllDealers(db) {
  try {
    const dealers = await db.all("SELECT * FROM dealers ORDER BY id DESC");

    const cars = await db.all(`
      SELECT c.*,
             (
               SELECT json_agg(image_url)
               FROM (
                      SELECT image_url
                      FROM car_images
                      WHERE car_id = c.id
                      ORDER BY id ASC
                    )
             ) as car_images_list
      FROM cars c
      ORDER BY c.updated_at DESC
    `);

    // Loopa igenom varje handlare och matcha deras bilar
    const dealersWithCars = dealers.map((dealer) => {
      const dealerCars = cars
        .filter((car) => car.dealer_id === dealer.id)
        .map(({ dealer_id, car_images_list, ...carDetails }) => {
          let images = [];
          if (car_images_list) {
            images = JSON.parse(car_images_list).filter((url) => url !== null);
          }
          if (images.length === 0 && carDetails.image_url) {
            images = [carDetails.image_url];
          }
          return { ...carDetails, images };
        });

      return {
        ...dealer,
        cars: dealerCars,
      };
    });

    return dealersWithCars;
  } catch (error) {
    console.error("Error fetching dealers:", error);
    throw error;
  }
}

async function updateDealer(db, dealerId, dealerData) {
  const { name, contact_person, email, phone } = dealerData;
  try {
    // Bygger en dynamisk uppdateringsfråga för att bara ändra de fält som skickas med
    const fields = Object.entries({
      name,
      contact_person,
      email,
      phone,
    }).filter(([key, value]) => value !== undefined);

    if (fields.length === 0) {
      return { success: false, error: "Ingen data att uppdatera." };
    }

    const setClause = fields.map(([key]) => `${key} = ?`).join(", ");
    const params = fields.map(([key, value]) => value);
    params.push(dealerId);

    const result = await db.run(
      `UPDATE dealers SET ${setClause} WHERE id = ?`,
      params,
    );

    if (result.changes === 0) {
      return { success: false, error: "Handlare hittades inte." };
    }

    const updatedDealer = await db.get("SELECT * FROM dealers WHERE id = ?", [
      dealerId,
    ]);
    const dealerCars = await db.all(
      `
                SELECT c.*,
                       (
                         SELECT json_agg(image_url)
                         FROM (
                           SELECT image_url
                           FROM car_images
                           WHERE car_id = c.id
                           ORDER BY id ASC
                         )
                       ) as car_images_list
                FROM cars c
                WHERE c.dealer_id = ?
            `,
      [dealerId],
    );

    const formattedCars = dealerCars.map(
      ({ car_images_list, dealer_id, ...carDetails }) => {
        let images = [];
        if (car_images_list) {
          images = JSON.parse(car_images_list).filter((url) => url !== null);
        }
        if (images.length === 0 && carDetails.image_url) {
          images = [carDetails.image_url];
        }
        return { ...carDetails, images };
      },
    );

    return {
      success: true,
      dealer: {
        ...updatedDealer,
        cars: formattedCars,
      },
    };
  } catch (error) {
    console.error("Error updating dealer:", error);
    return { success: false, error: error.message };
  }
}

async function deleteDealer(db, dealerId) {
  try {
    // Hämta alla bilar för denna handlare
    const cars = await db.all("SELECT id FROM cars WHERE dealer_id = ?", [
      dealerId,
    ]);

    // Ta bort relaterade bilder och matchningar för varje bil för att garantera att inga Foreign Key-fel uppstår
    for (const car of cars) {
      await db.run("DELETE FROM car_images WHERE car_id = ?", [car.id]);
      await db.run("DELETE FROM car_matches WHERE car_id = ?", [car.id]);
    }

    // Ta därefter bort de relaterade bilarna
    await db.run("DELETE FROM cars WHERE dealer_id = ?", [dealerId]);

    // Och till sist ta bort handlaren
    const result = await db.run("DELETE FROM dealers WHERE id = ?", [dealerId]);
    if (result.changes === 0) {
      return { success: false, error: "Handlare hittades inte." };
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting dealer:", error);
    return { success: false, error: error.message };
  }
}

export { addDealer, getAllDealers, updateDealer, deleteDealer };
