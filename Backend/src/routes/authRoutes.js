import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { protect } from "../middleware/auth.js";

dotenv.config();

const router = express.Router();
const secret = process.env.API_SECRET_KEY;
const authCookieName = "admin_token";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 1000,
};

if (!secret) {
  throw new Error("API_SECRET_KEY is not defined in your .env file");
}

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const db = req.db;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        secret,
        { expiresIn: "1h" },
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
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
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
