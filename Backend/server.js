import express from "express";
import { setupDB } from "./db.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import publicRoutes from "./src/routes/publicRoutes.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

import cors from "cors";

const app = express();

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
      if (!origin || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// Basic security with Helmet
app.use(helmet());

app.use(express.json());
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

// Setup and start server
setupDB()
  .then((db) => {
    // Middleware to attach db to req
    app.use((req, res, next) => {
      req.db = db;
      next();
    });

    // Public and auth routes
    app.use("/api", publicRoutes);

    // Protected admin routes
    app.use("/api/admin", adminRoutes);

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
