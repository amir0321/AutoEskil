import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const secret = process.env.API_SECRET_KEY;
const authCookieName = "admin_token";

if (!secret) {
  throw new Error("API_SECRET_KEY is not defined in your .env file");
}

// This middleware checks for a valid JWT in the Authorization header
export const protect = (req, res, next) => {
  const bearer = req.headers.authorization;
  let token = null;

  if (bearer && bearer.startsWith("Bearer ")) {
    token = bearer.split("Bearer ")[1].trim();
  }

  if (!token && req.cookies && req.cookies[authCookieName]) {
    token = req.cookies[authCookieName];
  }

  if (!token && req.headers.cookie) {
    const cookieToken = req.headers.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${authCookieName}=`));

    if (cookieToken) {
      token = decodeURIComponent(cookieToken.split("=")[1] || "");
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch (error) {
    console.error("Authentication failed:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
