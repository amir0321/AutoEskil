import crypto from "crypto";

function parseDecimalValue(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const normalized = String(value).trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

async function generateUniqueListingId(db) {
  let listingId = "";
  let exists = true;

  while (exists) {
    listingId = String(Math.floor(10000000 + Math.random() * 90000000));
    const row = await db.get(
      "SELECT 1 FROM cars WHERE listing_id = ? LIMIT 1",
      [listingId],
    );
    exists = Boolean(row);
  }

  return listingId;
}

async function addCar(db, carData) {
  const now = new Date().toISOString();

  const {
    dealer_id,
    brand,
    model,
    variant,
    color,
    transmission,
    horsepower,
    registration_number,
    registration_date,
    max_trailer_weight,
    drivetrain,
    seats,
    engine_volume,
    range_wltp,
    year,
    price,
    mileage,
    fuel_type,
    description,
    equipment,
    location,
    weight,
    fuel_consumption,
    number_of_owners,
    next_inspection_date,
  } = carData;
  const id = crypto.randomUUID();
  const listingId = await generateUniqueListingId(db);

  let imageList = [];
  let primaryImage = "";

  if (carData.images && Array.isArray(carData.images)) {
    imageList = carData.images;
    primaryImage = imageList[0] || "";
  } else if (carData.image_url) {
    imageList = [carData.image_url];
    primaryImage = carData.image_url;
  }

  // Hantera equipment som kan komma som sträng (från FormData) eller array
  let equipmentArray = [];
  if (typeof equipment === "string") {
    try {
      const parsed = JSON.parse(equipment);
      equipmentArray = Array.isArray(parsed) ? parsed : [];
    } catch {
      equipmentArray = [];
    }
  } else if (Array.isArray(equipment)) {
    equipmentArray = equipment;
  }
  const equipmentJson = JSON.stringify(equipmentArray);

  try {
    await db.run(
      `
            INSERT INTO cars (
              id, listing_id, dealer_id, brand, model, variant, color, transmission,
              horsepower, registration_number, registration_date, max_trailer_weight, drivetrain, seats, engine_volume, range_wltp,
              year, price, mileage, fuel_type, description, equipment, location, weight, fuel_consumption, number_of_owners, next_inspection_date, image_url, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      [
        id,
        listingId,
        dealer_id,
        brand,
        model,
        variant || "",
        color || "",
        transmission || "",
        horsepower ? Number(horsepower) : null,
        registration_number || "",
        registration_date || "",
        max_trailer_weight ? Number(max_trailer_weight) : null,
        drivetrain || "",
        seats ? Number(seats) : null,
        parseDecimalValue(engine_volume),
        range_wltp ? Number(range_wltp) : null,
        year,
        price,
        mileage,
        fuel_type,
        description,
        equipmentJson,
        location || "Eskilstuna",
        weight ? Number(weight) : null,
        parseDecimalValue(fuel_consumption),
        number_of_owners ? Number(number_of_owners) : null,
        next_inspection_date || "",
        primaryImage,
        now,
      ],
    );

    if (imageList.length > 0) {
      for (const imgUrl of imageList) {
        await db.run(
          `INSERT INTO car_images (car_id, image_url) VALUES (?, ?)`,
          [id, imgUrl],
        );
      }
    }

    return { success: true, carId: id, listingId };
  } catch (error) {
    console.error("Error adding car:", error);
    return { success: false, error: error.message };
  }
}

async function updateCar(db, carId, carData) {
  try {
    const now = new Date().toISOString();

    let { images, ...fieldsToUpdate } = carData;
    fieldsToUpdate.updated_at = now;
    let updateImages = false;

    if (images && Array.isArray(images)) {
      updateImages = true;
      // Uppdatera även huvudbilden
      fieldsToUpdate.image_url = images[0] || "";
    } else if (carData.image_url) {
      updateImages = true;
      images = [carData.image_url];
    }

    if (fieldsToUpdate.equipment !== undefined) {
      // Hantera equipment som kan komma som sträng (från FormData) eller array
      let equipmentArray = [];
      if (typeof fieldsToUpdate.equipment === "string") {
        try {
          const parsed = JSON.parse(fieldsToUpdate.equipment);
          equipmentArray = Array.isArray(parsed) ? parsed : [];
        } catch {
          equipmentArray = [];
        }
      } else if (Array.isArray(fieldsToUpdate.equipment)) {
        equipmentArray = fieldsToUpdate.equipment;
      }
      fieldsToUpdate.equipment = JSON.stringify(equipmentArray);
    }

    const numericFields = [
      "horsepower",
      "max_trailer_weight",
      "seats",
      "range_wltp",
      "weight",
      "number_of_owners"
    ];
    for (const key of numericFields) {
      if (fieldsToUpdate[key] !== undefined) {
        if (fieldsToUpdate[key] === "" || fieldsToUpdate[key] === null) {
          fieldsToUpdate[key] = null;
        } else {
          const num = Number(fieldsToUpdate[key]);
          fieldsToUpdate[key] = Number.isNaN(num) ? null : num;
        }
      }
    }
    if (fieldsToUpdate.engine_volume !== undefined) {
      fieldsToUpdate.engine_volume = parseDecimalValue(
        fieldsToUpdate.engine_volume,
      );
    }
    if (fieldsToUpdate.fuel_consumption !== undefined) {
      fieldsToUpdate.fuel_consumption = parseDecimalValue(
        fieldsToUpdate.fuel_consumption,
      );
    }

    const allowedKeys = [
      "dealer_id",
      "brand",
      "model",
      "variant",
      "color",
      "transmission",
      "horsepower",
      "registration_number",
      "registration_date",
      "max_trailer_weight",
      "drivetrain",
      "seats",
      "engine_volume",
      "range_wltp",
      "year",
      "price",
      "mileage",
      "fuel_type",
      "description",
      "location",
      "weight",
      "fuel_consumption",
      "number_of_owners",
      "next_inspection_date",
      "image_url",
      "equipment",
      "updated_at",
    ];

    const fields = Object.entries(fieldsToUpdate).filter(
      ([key, value]) => value !== undefined && allowedKeys.includes(key),
    );

    if (fields.length === 0 && !updateImages) {
      return { success: false, error: "Ingen data att uppdatera." };
    }

    if (fields.length > 0) {
      const setClause = fields.map(([key]) => `${key} = ?`).join(", ");
      const params = fields.map(([key, value]) => value);
      params.push(carId);

      const result = await db.run(
        `UPDATE cars SET ${setClause} WHERE id = ?`,
        params,
      );
      if (result.changes === 0 && !updateImages) {
        return { success: false, error: "Bil hittades inte." };
      }
    }

    if (updateImages) {
      await db.run(`DELETE FROM car_images WHERE car_id = ?`, [carId]);
      if (images.length > 0) {
        for (const imgUrl of images) {
          await db.run(
            `INSERT INTO car_images (car_id, image_url) VALUES (?, ?)`,
            [carId, imgUrl],
          );
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating car:", error);
    return { success: false, error: error.message };
  }
}

async function deleteCar(db, carId) {
  try {
    const result = await db.run("DELETE FROM cars WHERE id = ?", [carId]);
    if (result.changes === 0) {
      return { success: false, error: "Bil hittades inte." };
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting car:", error);
    return { success: false, error: error.message };
  }
}

export { addCar, updateCar, deleteCar };
