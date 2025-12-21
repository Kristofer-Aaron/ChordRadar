import UserModel from '../models/userModel.js';

export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    req.validated = value; // or overwrite req.body = value
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    if (error) return res.status(400).json({ error: error.details[0].message });
    req.validatedQuery = value;
    next();
  };
}


// middlewares/validateEmailParam.js
export function validateEmailParam(param = 'email') {
  return (req, res, next) => {
    const raw = (req.params[param] || '').trim().toLowerCase();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
    if (!ok) return res.status(400).json({ error: 'Invalid email format' });
    req.params[param] = raw;
    next();
  };
}


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
}


export function ensureEmailUnique(field = 'email_address', idParam = 'id') {
  return async (req, res, next) => {
    const email = req.validated?.[field] ?? req.body?.[field];
    if (!email) {
        return next();
    }
    const targetId = Number(req.params[idParam]);
    const taken = await UserModel.findByEmail(email);
    if (taken && taken.id !== targetId) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    next();
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
