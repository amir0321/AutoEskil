import crypto from "crypto";

export async function createSellRequest(db, payload) {
  const id = crypto.randomUUID();

  try {
    await db.run(
      `
        INSERT INTO sell_requests (
          id,
          seller_name,
          seller_email,
          seller_phone,
          reg_number,
          car_brand,
          car_model,
          car_year,
          mileage,
          expected_price,
          has_damage,
          damage_details,
          condition_notes,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `,
      [
        id,
        payload.seller_name,
        payload.seller_email,
        payload.seller_phone,
        payload.reg_number,
        payload.car_brand,
        payload.car_model,
        payload.car_year,
        payload.mileage,
        payload.expected_price,
        payload.has_damage ? 1 : 0,
        payload.damage_details,
        payload.condition_notes,
      ],
    );

    // Insert images if provided
    if (
      payload.images &&
      Array.isArray(payload.images) &&
      payload.images.length > 0
    ) {
      for (const imgUrl of payload.images) {
        await db.run(
          `INSERT INTO sell_request_images (sell_request_id, image_url) VALUES (?, ?)`,
          [id, imgUrl],
        );
      }
    }

    return { success: true, id };
  } catch (error) {
    console.error("Error creating sell request:", error);
    return { success: false, error: error.message };
  }
}

export async function getAllSellRequests(db) {
  try {
    const rows = await db.all(
      `SELECT sr.*, 
              json_agg(sri.image_url) as sell_request_images_list
       FROM sell_requests sr
       LEFT JOIN sell_request_images sri ON sr.id = sri.sell_request_id
       GROUP BY sr.id
       ORDER BY sr.created_at DESC`,
    );

    return {
      success: true,
      data: rows.map((row) => {
        let images = [];
        if (row.sell_request_images_list) {
          const parsedImages = typeof row.sell_request_images_list === 'string' ? JSON.parse(row.sell_request_images_list) : row.sell_request_images_list;
          images = (Array.isArray(parsedImages) ? parsedImages : []).filter((url) => url !== null);
        }
        delete row.sell_request_images_list;
        return {
          ...row,
          has_damage: Boolean(row.has_damage),
          images: images,
        };
      }),
    };
  } catch (error) {
    console.error("Error fetching sell requests:", error);
    return { success: false, error: error.message };
  }
}

export async function updateSellRequestStatus(db, id, status) {
  const validStatuses = ["active", "confirmed"];
  if (!validStatuses.includes(status)) {
    return { success: false, error: "Invalid status" };
  }

  try {
    const result = await db.run(
      "UPDATE sell_requests SET status = ? WHERE id = ?",
      [status, id],
    );

    if (result.changes === 0) {
      return { success: false, error: "Förfrågan hittades inte." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating sell request status:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteSellRequest(db, id) {
  try {
    const result = await db.run("DELETE FROM sell_requests WHERE id = ?", [id]);

    if (result.changes === 0) {
      return { success: false, error: "Förfrågan hittades inte." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting sell request:", error);
    return { success: false, error: error.message };
  }
}
