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


// src/middlewares/normalizePatchFields.js
export function normalizePatchFields(req, res, next) {
  const b = req.validated || req.body || {};
  const updates = {};
  const now = new Date();

  // basic fields
  for (const k of ["user_name", "first_name", "last_name"]) {
    if (k in b) updates[k] = String(b[k]).trim();
  }

  // email
  if ("email_address" in b) {
    updates.email_address = String(b.email_address).trim().toLowerCase();
  }

  // password (already hashed in hashPasswordIfPresent)
  if ("password_hash" in b) {
    updates.password_hash = b.password_hash;
    updates.password_changed_at = b.password_changed_at ?? now;
  }

  // preferences → JSON string
  if ("preferences" in b) {
    try {
      const jsonStr = typeof b.preferences === "string"
        ? b.preferences
        : JSON.stringify(b.preferences ?? {});
      JSON.parse(jsonStr); // validate
      updates.preferences = jsonStr;
    } catch {
      return res.status(400).json({ error: "preferences must be valid JSON" });
    }
  }

  // two_factor_enabled → 0/1
  if ("two_factor_enabled" in b) {
    const v = b.two_factor_enabled;
    const flag = typeof v === "boolean" ? v : Number(v) === 1;
    if (typeof v !== "boolean" && ![0, 1].includes(Number(v))) {
      return res.status(400).json({ error: "two_factor_enabled must be boolean or 0/1" });
    }
    updates.two_factor_enabled = flag ? 1 : 0;

    // Optional clearing secrets when disabling:
    // if (!flag) {
    //   updates.two_factor_method = null;
    //   updates.two_factor_secret = null;
    //   updates.two_factor_backup = JSON.stringify([]);
    // }
  }

  // 2FA method/secret
  if ("two_factor_method" in b) updates.two_factor_method = b.two_factor_method ?? null;
  if ("two_factor_secret" in b) updates.two_factor_secret = b.two_factor_secret ?? null;

  // 2FA backup → JSON string of array
  if ("two_factor_backup" in b) {
    try {
      const jsonStr = typeof b.two_factor_backup === "string"
        ? b.two_factor_backup
        : JSON.stringify(b.two_factor_backup ?? []);
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) throw new Error();
      updates.two_factor_backup = jsonStr;
    } catch {
      return res.status(400).json({ error: "two_factor_backup must be valid JSON array" });
    }
  }

  // admin-only fields (already guarded)
  for (const k of ["role", "status"]) {
    if (k in b) updates[k] = b[k];
  }
  if ("email_verified" in b) {
    const n = typeof b.email_verified === "boolean" ? (b.email_verified ? 1 : 0) : Number(b.email_verified);
    if (![0, 1].includes(n)) return res.status(400).json({ error: "email_verified must be 0 or 1" });
    updates.email_verified = n;
  }

  req.updates = updates;
  next();
};