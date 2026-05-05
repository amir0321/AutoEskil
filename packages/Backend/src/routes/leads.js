import express from "express";
import rateLimit from "express-rate-limit";
import {
  createLead,
  findMatchingCars,
  createCarMatches,
} from "../controllers/leadsController.js";

const router = express.Router();
const INTERNAL_ERROR_MESSAGE = "Internal server error";
const MIN_FORM_FILL_TIME_MS = 1500;
const MAX_FORM_AGE_MS = 1000 * 60 * 60 * 12;

const defaultRateLimitBypassIps = new Set(["127.0.0.1", "::1"]);
const envRateLimitBypassIps = new Set(
  (process.env.LEAD_RATE_LIMIT_BYPASS_IPS || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean),
);

function normalizeIp(ip = "") {
  return String(ip)
    .trim()
    .replace(/^::ffff:/, "");
}

function shouldBypassLeadRateLimit(req) {
  const bypassAll = process.env.LEAD_RATE_LIMIT_BYPASS_IPS === "*";
  if (bypassAll) return true;

  const requestIps = [req.ip, ...(Array.isArray(req.ips) ? req.ips : [])]
    .map(normalizeIp)
    .filter(Boolean);

  return requestIps.some(
    (ip) => defaultRateLimitBypassIps.has(ip) || envRateLimitBypassIps.has(ip),
  );
}

const leadSubmissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => shouldBypassLeadRateLimit(req),
  message: {
    error:
      "För många förfrågningar från samma IP. Vänta några minuter och försök igen.",
  },
});

function normalizeLeadPayload(raw = {}) {
  return {
    customer_name: String(raw.customer_name || "").trim(),
    customer_email: String(raw.customer_email || "")
      .trim()
      .toLowerCase(),
    customer_phone: String(raw.customer_phone || "").trim(),
    preferred_brand: String(raw.preferred_brand || "").trim(),
    preferred_model: String(raw.preferred_model || "").trim(),
    preferred_fuel_type: String(raw.preferred_fuel_type || "").trim(),
    min_year: raw.min_year,
    max_mileage: raw.max_mileage,
    max_budget: raw.max_budget,
    requirements: String(raw.requirements || "").trim(),
    source: raw.source === "interested" ? "interested" : "contact",
    website: String(raw.website || "").trim(),
    form_started_at: raw.form_started_at,
  };
}

function hasValidContactData(leadData) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9+\-()\s]{7,20}$/;

  if (!leadData.customer_name || leadData.customer_name.length < 2)
    return false;
  if (!leadData.customer_email || !emailRegex.test(leadData.customer_email)) {
    return false;
  }
  return Boolean(
    leadData.customer_phone && phoneRegex.test(leadData.customer_phone),
  );
}

function hasSuspiciousPayload(leadData) {
  if (leadData.website) {
    return true;
  }

  const startedAt = Number(leadData.form_started_at);
  if (!Number.isFinite(startedAt)) {
    return true;
  }

  const formAge = Date.now() - startedAt;
  if (formAge < MIN_FORM_FILL_TIME_MS || formAge > MAX_FORM_AGE_MS) {
    return true;
  }

  const suspiciousText =
    `${leadData.customer_name} ${leadData.requirements}`.toLowerCase();
  if (
    suspiciousText.includes("http://") ||
    suspiciousText.includes("https://") ||
    suspiciousText.includes("www.")
  ) {
    return true;
  }

  return false;
}

// Denna route är nu publik under /api/leads
router.post("/", leadSubmissionLimiter, async (req, res) => {
  const db = req.db;
  const leadData = normalizeLeadPayload(req.body);
  const isTrustedRequest = shouldBypassLeadRateLimit(req);

  if (!hasValidContactData(leadData)) {
    return res
      .status(400)
      .json({ error: "Ogiltig kontaktinformation i formuläret." });
  }

  if (!isTrustedRequest && hasSuspiciousPayload(leadData)) {
    return res.status(400).json({ error: "Formuläret kunde inte valideras." });
  }

  try {
    if (!isTrustedRequest) {
      const duplicateWindowMinutes = 10;
      const duplicateLead = await db.get(
        `
          SELECT id
          FROM leads
          WHERE customer_email = ?
            AND customer_phone = ?
            AND source = ?
            AND created_at >= datetime('now', ?)
          LIMIT 1
        `,
        [
          leadData.customer_email,
          leadData.customer_phone,
          leadData.source,
          `-${duplicateWindowMinutes} minutes`,
        ],
      );

      if (duplicateLead) {
        return res.status(429).json({
          error:
            "Du har redan skickat en liknande förfrågan nyligen. Vänta en stund innan du försöker igen.",
        });
      }
    }

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
                    WHERE c.id IN (${placeholders})
                `,
          matchingCarIds,
        );

        const matchedCarsDetails = matchedCarsRaw.map((car) => {
          let images = [];
          if (car.car_images_list) {
            const parsedImages = typeof car.car_images_list === 'string' ? JSON.parse(car.car_images_list) : car.car_images_list;
            images = (Array.isArray(parsedImages) ? parsedImages : []).filter((url) => url !== null);
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
