export function authorizeRole(...roles) {
  const allowed = new Set(roles.map(r => String(r).toLowerCase()));
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' }); // no user at all

    const role = String(user.role || '').toLowerCase();
    return allowed.has(role)
      ? next()
      : res.status(403).json({ error: 'Forbidden' }); // user exists but insufficient role
  };
}

// middleware/authorizeSelfOrAdminFlexible.js
import UserModel from "../models/userModel.js";

