import express from "express";
import { setupDB } from "./db.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import publicRoutes from "./src/routes/publicRoutes.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigins =
  allowedOrigins.length > 0 ? allowedOrigins : defaultAllowedOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      // Tillåt requests utan origin (samma domän/mobile apps)
      if (!origin) {
        return callback(null, true);
      }

      // Tillåt localhost för development
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true);
      }

      // Tillåt samma domän (Render kommer att serva frontend på samma domän)
      const host = process.env.RENDER_EXTERNAL_HOSTNAME || "";
      const publicUrl = process.env.PUBLIC_SITE_URL || "";

      if (origin.includes(host) || origin.includes(publicUrl)) {
        return callback(null, true);
      }

      // Tillåt inställda origins
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// Basic security with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          // React inline scripts (nonce-based would be better, but this covers build output)
          "'unsafe-inline'",
          "https://www.google.com",
          "https://www.gstatic.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://res.cloudinary.com",
        ],
        frameSrc: ["https://www.google.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// Limit JSON payload size to prevent large-body DoS attacks
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  skip: (req) => {
    return (
      req.path.startsWith("/api/login") ||
      req.path.startsWith("/api/session") ||
      req.path.startsWith("/api/logout")
    );
  },
});
app.use(limiter);

const PORT = process.env.PORT || 3000;

// Startup security checks
if (!process.env.RECAPTCHA_SECRET_KEY) {
  console.warn("⚠️  VARNING: RECAPTCHA_SECRET_KEY är inte satt. Alla publika formulär kommer att blockera alla inskick!");
}
if (!process.env.API_SECRET_KEY && !process.env.JWT_SECRET) {
  console.error("❌  FEL: Varken API_SECRET_KEY eller JWT_SECRET är satt. Autentisering fungerar inte!");
}

// Setup and start server
setupDB()
  .then((db) => {
    // Middleware to attach db to req
    app.use((req, res, next) => {
      req.db = db;
      next();
    });

    // Serva statiska filer från React-frontenden
    const distPath = path.join(__dirname, "../Frontend/dist");
    app.use(express.static(distPath));

    app.get("/sitemap.xml", async (req, res) => {
      try {
        const forwardedProto = req.headers["x-forwarded-proto"];
        const proto =
          (Array.isArray(forwardedProto)
            ? forwardedProto[0]
            : String(forwardedProto || "").split(",")[0]) || req.protocol;
        const host = req.get("host") || "autoeskil.se";
        const baseUrl = (
          process.env.PUBLIC_SITE_URL || `${proto}://${host}`
        ).replace(/\/$/, "");

        const staticUrls = [
          { path: "/", priority: "1.0", changefreq: "daily" },
          { path: "/bilar", priority: "0.9", changefreq: "daily" },
          { path: "/om-oss", priority: "0.6", changefreq: "monthly" },
          { path: "/kontakt", priority: "0.7", changefreq: "weekly" },
          { path: "/sell-car", priority: "0.6", changefreq: "weekly" },
        ];

        const cars = await db.all(
          `SELECT id, listing_id, COALESCE(updated_at, CURRENT_TIMESTAMP) AS lastmod
           FROM cars
           ORDER BY COALESCE(updated_at, CURRENT_TIMESTAMP) DESC`,
        );

        const now = new Date().toISOString().slice(0, 10);

        const staticEntries = staticUrls
          .map(
            (entry) => `
  <url>
    <loc>${escapeXml(`${baseUrl}${entry.path}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
          )
          .join("");

        const carEntries = cars
          .map((car) => {
            const slug = car.listing_id || car.id;
            const lastmod = car.lastmod
              ? new Date(car.lastmod).toISOString().slice(0, 10)
              : now;
            return `
  <url>
    <loc>${escapeXml(`${baseUrl}/bilar/${slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
          })
          .join("");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticEntries}${carEntries}
</urlset>`;

        res.set("Content-Type", "application/xml; charset=utf-8");
        res.set("Cache-Control", "public, max-age=600");
        res.status(200).send(xml);
      } catch (error) {
        console.error("Error generating sitemap:", error);
        res.status(500).send("Failed to generate sitemap");
      }
    });

    // Public and admin routes
    app.use("/api", publicRoutes);

    // Protected admin routes
    app.use("/api/admin", adminRoutes);

    // Skicka index.html för alla andra routes (React Router)
    app.get(/(.*)/, (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });

    app.listen(PORT, () => {
      console.log(`--- BILFÖRMEDLING ESKILSTUNA ---`);
      console.log(`Servern körs på: http://localhost:${PORT}`);
      console.log(`Databasen är ansluten och redo.`);
      console.log(`---------------------------------`);
    });
  })
  .catch((error) => {
    console.error("Kunde inte starta servern:", error);
    process.exit(1); // Avsluta processen om databasen inte kan startas
  });
