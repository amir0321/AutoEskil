import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { protect } from "../middleware/auth.js";
import rateLimit from "express-rate-limit"; // Lägg till denna!

dotenv.config();

const router = express.Router();
const secret = process.env.API_SECRET_KEY;
const authCookieName = "admin_token";

const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "lax" : "none",
  secure: process.env.NODE_ENV === "production" ? true : true,
  maxAge: 60 * 60 * 1000,
};

if (!secret) {
  throw new Error("API_SECRET_KEY is not defined in your .env file");
}

// SÄKERHETSUPPDATERING: Skapa en strikt rate-limiter bara för inloggningen
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuter
  max: 5, // BARA 5 försök tillåtna!
  message: { message: "För många inloggningsförsök. Du är tillfälligt blockerad i 15 minuter." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Applicera 'loginLimiter' innan själva inloggningskoden körs
router.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const db = req.db;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          secret,
          { expiresIn: "1h" }
      );
      res.cookie(authCookieName, token, cookieOptions);
      res.json({ message: "Login successful" });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(authCookieName, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "lax" : "none",
    secure: process.env.NODE_ENV === "production" ? true : true,
    path: "/",
  });
  res.json({ message: "Logout successful" });
});

router.get("/session", protect, (req, res) => {
  res.json({
    authenticated: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
    },
  });
});

export default router;