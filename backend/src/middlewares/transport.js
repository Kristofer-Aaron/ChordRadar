import dotenv from "dotenv";
dotenv.config();
import cors from 'cors';

const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

export const corsStrict = cors({
  origin: (origin, cb) => {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});


// middleware/normalizeUserPatchFields.js
import bcrypt from 'bcrypt';

export function normalizeUserPatchFields() {
  return async (req, res, next) => {
    try {
      const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
      const input = req.validated ?? req.body ?? {};
      const updates = {};

      // Whitelist (generally patchable by *any* user)
      const commonFields = [
        'user_name',
        'first_name',
        'last_name',
        'email_address',
        'two_factor_enabled',
        'preferences',
        // 'password' – handled specially below
      ];

      // Admin-only fields
      const adminOnly = ['email_verified', 'role', 'status'];

      // 1) Check admin-only constraints
      if (!isAdmin) {
        const attemptedRestricted = adminOnly.filter((k) => k in input);
        if (attemptedRestricted.length) {
          return res.status(403).json({
            error: 'Forbidden',
            details: `Non-admin cannot modify: ${attemptedRestricted.join(', ')}`
          });
        }
      }

      // 2) Copy common fields if present
      for (const key of commonFields) {
        if (key in input) {
          updates[key] = input[key];
        }
      }

      // 3) Normalize email (if provided)
      if ('email_address' in updates && typeof updates.email_address === 'string') {
        updates.email_address = updates.email_address.trim().toLowerCase();
      }

      // 4) Preferences: allow object or string; ensure valid JSON; store as string
      if ('preferences' in updates) {
        const val = updates.preferences;
        let prefsStr;
        if (typeof val === 'string') {
          prefsStr = val.trim();
        } else {
          prefsStr = JSON.stringify(val ?? {});
        }
        try {
          JSON.parse(prefsStr);
        } catch {
          return res.status(400).json({ error: 'preferences must be valid JSON' });
        }
        updates.preferences = prefsStr;
      }

      // 5) two_factor_enabled: coerce to boolean (0/1 in DB later if needed)
      if ('two_factor_enabled' in updates) {
        updates.two_factor_enabled = updates.two_factor_enabled ? 1 : 0;
      }

      // 6) Password (optional): if provided, hash and set changed_at
      if ('password' in input && input.password != null && String(input.password).length > 0) {
        updates.password_hash = await bcrypt.hash(String(input.password), 10);
        updates.password_changed_at = new Date();
      }

      // 7) Admin-only fields: pass through only for admin
      if (isAdmin) {
        for (const key of adminOnly) {
          if (key in input) updates[key] = input[key];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      req.updates = updates;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}