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

export function authorizeSelfOrAdminFlexible(selParam = 'selector', valParam = 'value') {
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