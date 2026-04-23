import express from "express";
import {
  createLead,
  findMatchingCars,
  createCarMatches,
} from "../controllers/leadsController.js";

const router = express.Router();
const INTERNAL_ERROR_MESSAGE = "Internal server error";

// Denna route är nu publik under /api/leads
router.post("/", async (req, res) => {
  const db = req.db;
  const leadData = req.body;

  if (
    !leadData.customer_name ||
    !leadData.customer_email ||
    !leadData.customer_phone
  ) {
    return res
      .status(400)
      .json({ error: "Namn, e-post och telefon är obligatoriskt." });
  }

  try {
    // 1. Skapa leaden i databasen
    const leadResult = await createLead(db, leadData);

    if (leadResult.success) {
      // 2. Hitta bilar som matchar leadens kriterier
      const matchingCarIds = await findMatchingCars(db, leadData);

      if (matchingCarIds.length > 0) {
        // 3a. Om bilar hittades, skapa matchningar och hämta deras detaljer
        await createCarMatches(db, leadResult.leadId, matchingCarIds);

        // Hämta detaljerad information om de matchade bilarna inklusive bilder
        const placeholders = matchingCarIds.map(() => "?").join(",");
        const matchedCarsRaw = await db.all(
          `
                    SELECT c.*, 
                           json_group_array(ci.image_url) as car_images_list
                    FROM cars c
                    LEFT JOIN car_images ci ON c.id = ci.car_id
                    WHERE c.id IN (${placeholders})
                    GROUP BY c.id
                `,
          matchingCarIds,
        );

        const matchedCarsDetails = matchedCarsRaw.map((car) => {
          let images = [];
          if (car.car_images_list) {
            images = JSON.parse(car.car_images_list).filter(
              (url) => url !== null,
            );
          }
          if (images.length === 0 && car.image_url) {
            images = [car.image_url];
          }
          delete car.car_images_list;
          return {
            ...car,
            images: images,
          };
        });

        res.status(201).json({
          message: `Tack för din förfrågan! Vi har hittat ${matchingCarIds.length} bil(ar) som matchar dina önskemål.`,
          leadId: leadResult.leadId,
          matches: matchedCarsDetails, // Skicka detaljerad bil-data
        });
      } else {
        // 3b. Om inga bilar hittades...
        res.status(201).json({
          message:
            "Tack för din förfrågan! Vi har för närvarande ingen bil som matchar dina önskemål, men vi har sparat din förfrågan och återkommer så fort vi får in något passande.",
          leadId: leadResult.leadId,
          matches: [], // Skicka en tom lista
        });
      }
    } else {
      res.status(500).json({ error: "Kunde inte spara din förfrågan." });
    }
  } catch (error) {
    console.error("Error creating lead request:", error);
    res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
  }
});

export default router;
