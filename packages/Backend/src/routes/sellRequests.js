import express from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileTypeFromFile } from "file-type";
import fsPromises from "fs/promises";
import { createSellRequest } from "../controllers/sellRequestsController.js";
import { uploadImage } from "../services/imageService.js";

const router = express.Router();
const MIN_FORM_FILL_TIME_MS = 2000;
const MAX_FORM_AGE_MS = 1000 * 60 * 60 * 12;

// Skapa en lokal uppladdningsmapp om den inte finns
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const allowedImageExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const upload = multer({
  dest: "uploads/",
  limits: {
    files: 10,
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const isImageMime = (file.mimetype || "").startsWith("image/");
    if (isImageMime && allowedImageExt.has(ext)) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed (jpg, jpeg, png, webp, gif)."));
  },
});

const defaultRateLimitBypassIps = new Set(["127.0.0.1", "::1"]);
const envRateLimitBypassIps = new Set(
  (process.env.SELL_REQUEST_RATE_LIMIT_BYPASS_IPS || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean),
);

function normalizeIp(ip = "") {
  return String(ip)
    .trim()
    .replace(/^::ffff:/, "");
}

function shouldBypassRateLimit(req) {
  const bypassAll = process.env.SELL_REQUEST_RATE_LIMIT_BYPASS_IPS === "*";
  if (bypassAll) return true;

  const requestIps = [req.ip, ...(Array.isArray(req.ips) ? req.ips : [])]
    .map(normalizeIp)
    .filter(Boolean);

  return requestIps.some(
    (ip) => defaultRateLimitBypassIps.has(ip) || envRateLimitBypassIps.has(ip),
  );
}

const sellRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => shouldBypassRateLimit(req),
  message: {
    error:
      "För många förfrågningar från samma IP. Vänta några minuter och försök igen.",
  },
});

function sanitizeText(value, maxLength = 255) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/[&]/g, "&amp;")
    .trim()
    .slice(0, maxLength);
}

function normalizeRegNumber(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

function normalizePayload(raw = {}) {
  const rawYear = Number(raw.car_year);
  const rawMileage = Number(raw.mileage);
  const rawExpectedPrice = Number(raw.expected_price);

  return {
    seller_name: sanitizeText(raw.seller_name, 120),
    seller_email: sanitizeText(raw.seller_email, 120).toLowerCase(),
    seller_phone: sanitizeText(raw.seller_phone, 30),
    reg_number: normalizeRegNumber(raw.reg_number),
    car_brand: sanitizeText(raw.car_brand, 60),
    car_model: sanitizeText(raw.car_model, 60),
    car_year: Number.isFinite(rawYear) ? rawYear : null,
    mileage: Number.isFinite(rawMileage) ? rawMileage : null,
    expected_price: Number.isFinite(rawExpectedPrice) ? rawExpectedPrice : null,
    has_damage: raw.has_damage === true || raw.has_damage === "true",
    damage_details: sanitizeText(raw.damage_details, 1500),
    condition_notes: sanitizeText(raw.condition_notes, 1500),
    website: sanitizeText(raw.website, 255),
    form_started_at: Number(raw.form_started_at),
  };
}

function hasValidPayload(data) {
  // Improved email regex according to RFC 5322 (simplified)
  const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneRegex = /^[0-9+\-()\s]{7,20}$/;
  const regRegex = /^[A-Z]{3}[0-9]{2}[A-Z0-9]$/;

  if (!data.seller_name || data.seller_name.length < 2) return false;
  if (!data.seller_email || !emailRegex.test(data.seller_email)) return false;
  if (!data.seller_phone || !phoneRegex.test(data.seller_phone)) return false;
  if (!data.reg_number || !regRegex.test(data.reg_number)) return false;

  if (data.car_year !== null && (data.car_year < 1950 || data.car_year > 2100)) {
    return false;
  }

  if (data.mileage !== null && (data.mileage < 0 || data.mileage > 150000)) {
    return false;
  }

  if (
    data.expected_price !== null &&
    (data.expected_price < 0 || data.expected_price > 10000000)
  ) {
    return false;
  }

  if (data.has_damage && !data.damage_details) {
    return false;
  }

  return true;
}

function hasSuspiciousPayload(data) {
  if (data.website) {
    return true;
  }

  if (!Number.isFinite(data.form_started_at)) {
    return true;
  }

  const formAge = Date.now() - data.form_started_at;
  if (formAge < MIN_FORM_FILL_TIME_MS || formAge > MAX_FORM_AGE_MS) {
    return true;
  }

  const suspiciousText =
    `${data.seller_name} ${data.damage_details} ${data.condition_notes}`.toLowerCase();

  return (
    suspiciousText.includes("http://") ||
    suspiciousText.includes("https://") ||
    suspiciousText.includes("www.")
  );
}

router.post("/", sellRequestLimiter, upload.array("images", 10), async (req, res) => {
  const db = req.db;
  const payload = normalizePayload(req.body);
  const isTrustedRequest = shouldBypassRateLimit(req);

  if (!hasValidPayload(payload)) {
    return res.status(400).json({
      error: "Ogiltig eller ofullstandig information i formular.",
    });
  }

  if (!isTrustedRequest && hasSuspiciousPayload(payload)) {
    return res.status(400).json({
      error: "Formularet kunde inte valideras.",
    });
  }

  try {
    if (!isTrustedRequest) {
      const duplicateWindowMinutes = 15;
      const thresholdDate = new Date(Date.now() - duplicateWindowMinutes * 60 * 1000).toISOString();
      const duplicate = await db.get(
        `
          SELECT id
          FROM sell_requests
          WHERE seller_email = ?
            AND seller_phone = ?
            AND reg_number = ?
            AND created_at >= ?
          LIMIT 1
        `,
        [
          payload.seller_email,
          payload.seller_phone,
          payload.reg_number,
          thresholdDate,
        ],
      );

      if (duplicate) {
        return res.status(429).json({
          error:
            "Du har redan skickat en liknande saljforfragan nyligen. Forsok igen om en stund.",
        });
      }
    }

    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        // 1. Verifiera att alla filer FAKTISKT är bilder (Magic Bytes Check)
        for (const file of req.files) {
          const meta = await fileTypeFromFile(file.path);

          // Om filen inte har en känd signatur, eller om den inte är en bild
          if (!meta || !meta.mime.startsWith("image/")) {
            console.warn(`Säkerhetsvarning: Försök till uppladdning av fejkad fil blockerad (${file.originalname})`);

            // Städa upp (radera) ALLA filer från denna uppladdning från hårddisken
            for (const f of req.files) {
              await fsPromises.unlink(f.path).catch(() => {});
            }

            return res.status(400).json({
              error: "Säkerhetsfel: En eller flera filer är inte riktiga bilder.",
            });
          }
        }

        const uploadPromises = req.files.map((file) => uploadImage(file.path));
        imageUrls = await Promise.all(uploadPromises);

        // 3. Städa upp de lokala filerna efter att Cloudinary är klart (bra för hårddiskutrymmet!)
        for (const file of req.files) {
          await fsPromises.unlink(file.path).catch(() => {});
        }

      } catch (uploadError) {
        console.error("Error handling images:", uploadError);
        // Om något går fel med Cloudinary, städa upp filerna från disken
        for (const file of req.files) {
          await fsPromises.unlink(file.path).catch(() => {});
        }
      }
    }

    payload.images = imageUrls;

    const result = await createSellRequest(db, payload);

    if (!result.success) {
      return res.status(500).json({
        error: "Kunde inte spara saljforfragan.",
      });
    }

    return res.status(201).json({
      message: "Tack! Din saljforfragan ar mottagen.",
      sellRequestId: result.id,
    });
  } catch (error) {
    console.error("Error creating sell request:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.message });
  }
  if (
    error &&
    error.message &&
    error.message.includes("Only image files are allowed")
  ) {
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

export default router;

