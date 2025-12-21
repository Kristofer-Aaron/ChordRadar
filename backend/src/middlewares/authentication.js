import jwt from "jsonwebtoken";
import pool from "../config/db.js";


export function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], // or ['RS256'] if using asymmetric keys
    });
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function requireActiveToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    const [rows] = await pool.query(
      `SELECT user_id FROM user_tokens
       WHERE token = ? AND type='api_access' AND expires_at > NOW()
       LIMIT 1`,
      [token]
    );
    if (!rows?.length || rows[0].user_id !== req.user?.id) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    next();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}


export function requireEmailVerified(req, res, next) {
  if (!req.user?.email_verified) {
    return res.status(403).json({ error: "Email not verified" });
  }
  next();
}


export function requireStatusActive(req, res, next) {
  if (req.user?.status !== 'active') {
    return res.status(403).json({ error: "Account not active" });
  }
  next();
}