import UserModel from '../models/userModel.js';

export const validate = (schemas = {}, options = {}) => {
  const {
    // Default statuses: 400 for input, 401 for auth header (customizable).
    status = { headers: 401, params: 400, query: 400, body: 400 },
    joi = { abortEarly: false, convert: true, stripUnknown: true },
  } = options;

  return (req, res, next) => {
    try {
      // Validate in this order to allow header errors to show first when present
      for (const part of ["headers", "params", "query", "body"]) {
        const schema = schemas[part];
        if (!schema) continue;

        const { error, value } = schema.validate(req[part], joi);
        if (error) {
          const httpStatus = status?.[part] ?? 400;
          return res.status(httpStatus).json({
            error: "Validation failed",
            details: error.details.map((d) => d.message),
          });
        }
        // assign validated (and normalized) value back
        req[part] = value;
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};

export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    req.validated = value; // or overwrite req.body = value
    next();
  };
};

export function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    if (error) return res.status(400).json({ error: error.details[0].message });
    req.validatedQuery = value;
    next();
  };
};


// middlewares/validateEmailParam.js
export function validateEmailParam(param = 'email') {
  return (req, res, next) => {
    const raw = (req.params[param] || '').trim().toLowerCase();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
    if (!ok) return res.status(400).json({ error: 'Invalid email format' });
    req.params[param] = raw;
    next();
  };
};


// middlewares/ensureTargetUserExists.js
export function ensureTargetUserExists(param = 'id') {
  return async (req, res, next) => {
    const id = Number(req.params[param]);
    const user = await UserModel.findById(id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    req.targetUser = user;
    next();
  };
};

export function ensureEmailUniqueFlexible(selParam = 'selector', valParam = 'value', field = 'email_address') {
  return async (req, res, next) => {
    try {
      let email = req.updates?.[field] ?? req.validated?.[field] ?? req.body?.[field];
      if (!email) return next();
      email = String(email).trim().toLowerCase();

      const existing = await UserModel.findByEmail(email);
      if (!existing) return next();

      // Determine target user id from selector (to allow keeping one's own email)
      const selector = req.params?.[selParam];
      const valueRaw = req.params?.[valParam];
      if (!selector || typeof valueRaw === 'undefined') {
        return res.status(400).json({ error: `Missing route params: ${selParam}/${valParam}` });
      }

      let targetUserId = null;
      if (selector === 'id') {
        targetUserId = String(valueRaw).trim();
      } else if (selector === 'email') {
        const targetEmail = String(valueRaw).trim().toLowerCase();
        const targetUser = await UserModel.findByEmail(targetEmail);
        targetUserId = targetUser ? String(targetUser.id) : null;
      } else {
        return res.status(400).json({ error: `Unsupported selector: ${selector}` });
      }

      if (!targetUserId || String(existing.id) !== targetUserId) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}


export function ensureEmailUnique(field = 'email_address', idParam = 'id') {
  return async (req, res, next) => {
    try {
      // Prefer validated body; fallback to raw body
      let email = req.validated?.[field] ?? req.body?.[field];
      if (!email) return next();

      // Normalize email to lowercase for consistent matching
      email = String(email).trim().toLowerCase();

      const taken = await UserModel.findByEmail(email);
      if (!taken) return next(); // nobody has this email → OK

      // If the route has an id (e.g., PUT /users/:id), allow if it's the same user
      const targetIdRaw = req.params?.[idParam];

      // No id param (e.g., POST /register) → any existing email is a conflict
      if (typeof targetIdRaw === 'undefined') {
        return res.status(409).json({ error: 'Email already in use' });
      }

      // Compare as strings to handle numeric/UUID/ObjectId uniformly
      const targetId = String(targetIdRaw);
      const takenId  = String(taken.id);

      if (takenId !== targetId) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      // Same user keeps same email → allowed
      return next();
    } catch (err) {
      // Critical: pass async errors to Express’ error handler
      return next(err);
    }
  };
}


// src/middlewares/requireNonEmptyUpdates.js
export function requireNonEmptyUpdates(req, res, next) {
  if (!req.updates || Object.keys(req.updates).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }
  next();
}



// middlewares/forbidNonAdminFields.js
export function forbidNonAdminFields(fields = []) {
  return (req, res, next) => {
    if (req.user?.role === 'admin') return next();
    const bodyKeys = Object.keys(req.body || {});
    const forbidden = fields.filter(f => bodyKeys.includes(f));
    if (forbidden.length) {
      return res.status(403).json({ error: `Only admin can modify: ${forbidden.join(', ')}` });
    }
    next();
  };
}


// middlewares/hashPasswordIfPresent.js
import bcrypt from 'bcrypt';

export async function hashPasswordIfPresent(req, res, next) {
  const pwd = req.validated?.password ?? req.body?.password;
  if (!pwd) return next();
  if (typeof pwd !== 'string' || pwd.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  const now = new Date();
  const hash = await bcrypt.hash(pwd, 10);
  // place normalized fields where your update reads them
  req.body.password_hash = hash;
  req.body.password_changed_at = now;
  delete req.body.password;
  next();
}
