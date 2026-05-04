import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js";
import { TokenModel } from "../models/tokenModel.js";

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
    const row = await TokenModel.findTokenString(token, 'api_access');
    if (!row || row.user_id !== req.user?.id || new Date() > row.expires_at) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    next();
  } catch (e) {
    return res.status(500).json({ error: 'Token validation failed' });
  }
}

export async function requireEmailVerified(req, res, next) {
  try {
    const email = req?.body?.email_address;

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ error: 'email_address is required' });
    }
    const user = await UserModel.findByEmail(email.trim());
    if (!user) {
      return res.status(404).json({ error: 'User with this email was not found' });
    }
    if (!user.email_verified) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
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

export async function requireAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }
    
    next();
}

export function requireSelfOrAdmin(selParam = 'selector', valParam = 'value') {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      // Admins pass immediately
      const role = String(user.role || '').toLowerCase();
      if (role === 'admin') return next();

      const selector = req.params?.[selParam];
      const valueRaw = req.params?.[valParam];
      if (!selector || typeof valueRaw === 'undefined') {
        return res.status(400).json({ error: `Missing route params: ${selParam}/${valParam}` });
      }

      // Resolve target user id from selector
      let targetUserId = null;

      if (selector === 'id') {
        // Compare consistently as strings (works for numeric/UUID)
        targetUserId = String(valueRaw).trim();
        if (!targetUserId) {
          return res.status(400).json({ error: 'Invalid user id' });
        }
      } else if (selector === 'email') {
        const email = String(valueRaw).trim().toLowerCase();
        if (!email || !email.includes('@')) {
          return res.status(400).json({ error: 'Invalid email' });
        }

        // Fetch the target user by email to get their id
        const targetUser = await UserModel.findByEmail(email);
        if (!targetUser) {
          // You can return 404 here or let the controller handle not-found.
          // Returning 404 now often improves UX for self-lookup.
          return res.status(404).json({ error: 'User not found' });
        }
        targetUserId = String(targetUser.id);
      } else {
        return res.status(400).json({ error: `Unsupported selector: ${selector}` });
      }

      const requesterId = String(user.id);
      const isSelf = requesterId === targetUserId;

      return isSelf ? next() : res.status(403).json({ error: 'Forbidden' });
    } catch (err) {
      console.error('[authorizeSelfOrAdminFlexible] error:', err);
      return res.status(500).json({ error: 'Authorization failed' });
    }
  };
}