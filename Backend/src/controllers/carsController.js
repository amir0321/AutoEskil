import crypto from "crypto";

async function addCar(db, carData) {
  const {
    dealer_id,
    brand,
    model,
    variant,
    color,
    transmission,
    year,
    price,
    mileage,
    fuel_type,
    description,
  } = carData;
  const id = crypto.randomUUID();

  let imageList = [];
  let primaryImage = "";

  if (carData.images && Array.isArray(carData.images)) {
    imageList = carData.images;
    primaryImage = imageList[0] || "";
  } else if (carData.image_url) {
    imageList = [carData.image_url];
    primaryImage = carData.image_url;
  }

  try {
    await db.run(
      `
            INSERT INTO cars (id, dealer_id, brand, model, variant, color, transmission, year, price, mileage, fuel_type, description, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      [
        id,
        dealer_id,
        brand,
        model,
        variant || "",
        color || "",
        transmission || "",
        year,
        price,
        mileage,
        fuel_type,
        description,
        primaryImage,
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

    return { success: true, carId: id };
  } catch (error) {
    console.error("Error adding car:", error);
    return { success: false, error: error.message };
  }
}

async function updateCar(db, carId, carData) {
  try {
    let { images, ...fieldsToUpdate } = carData;
    let updateImages = false;

    if (images && Array.isArray(images)) {
      updateImages = true;
      // Uppdatera även huvudbilden
      fieldsToUpdate.image_url = images[0] || "";
    } else if (carData.image_url) {
      updateImages = true;
      images = [carData.image_url];
    }

    const allowedKeys = [
      "dealer_id",
      "brand",
      "model",
      "variant",
      "color",
      "transmission",
      "year",
      "price",
      "mileage",
      "fuel_type",
      "description",
      "image_url",
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
