import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js";
import { TokenModel } from "../models/tokenModels.js";

export async function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      clockTolerance: 5,
    });
    return next();
  } catch (err) {
    console.error('[authenticate] verify failed:', err);
    return res.status(401).json({
      error: 'Invalid token',
      code: err.name,
      message: err.message,
    });
  }
}

export async function requireActiveToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  try {
   const rows = await TokenModel.findTokenString(token, 'api_access');
    if (rows == null || rows.user_id !== req.user?.id) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    next();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

//Check if the user with the given credentials has a verified email address
export async function requireEmailVerified(req, res, next) {
  const { email_address } = req.body;
  const { email_verified } = await UserModel.findByEmail(email_address);
  if (email_verified == '0') {
    return res.status(403).json({ error: "Email not verified" });
  }
  next();
}

//Check if the account of the user with the given credentials hasn't been restricted
export async function requireStatusActive(req, res, next) {
  const { email_address } = req.body;
  const { status } = await UserModel.findByEmail(email_address);
  if (status != 'active') {
    return res.status(403).json({ error: "Unable to log in, account status was restricted to " + status });
  }
  next();
}