import UserModel from "../models/userModel.js";

const UserController = {
  async create(req, res) {
    try {
      const payload = req.validated?.body ?? req.validated ?? req.body ?? {};
      const newUser = await UserModel.create(payload);

      return res.status(201).json(newUser);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  async getAll(req, res) {
    try {
      const users = await UserModel.findAll();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
    
  async getBySelector(req, res) {
    const { selector, value } = req.params;
    try {
      let user = null;

      switch (selector) {
        case 'id': {
          const idStr = String(value).trim();
          if (!idStr || !/^\d+$/.test(idStr)) {
            return res.status(400).json({ error: 'Invalid user id' });
          }
          const idNum = Number(idStr);
          if (!Number.isFinite(idNum) || idNum <= 0) {
            return res.status(400).json({ error: 'Invalid user id' });
          }
          user = await UserModel.findById(idNum);
          break;
        }
        case 'email': {
          // Normalize email
          const email = String(value).trim().toLowerCase();
          if (!email || !email.includes('@')) { 
            return res.status(400).json({ error: 'Invalid email' });
          }
          user = await UserModel.findByEmail(email);
          break;
        }
        default:
          return res.status(400).json({ error: `Unsupported selector: ${selector}` });
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Shape output to avoid leaking sensitive fields
      return res.json({
        id: user.id,
        user_name: user.user_name,
        first_name: user.first_name,
        last_name: user.last_name,
        email_address: user.email_address,
        role: user.role,
        status: user.status,
        email_verified: !!user.email_verified,
        two_factor_enabled: !!user.two_factor_enabled,
        // omit password_hash, secrets and backup codes
      });
    } catch (err) {
      console.error('[getUserBySelector] error:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const existing = await UserModel.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "User not found" });
      }

      await UserModel.remove(req.params.id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

async patch(req, res) {
  try {
    const idStr = String(req.validated?.params?.id ?? req.params.id ?? "").trim();
    const idNum = Number(idStr);

    // Ensure the user exists
    const existing = await UserModel.findById(idNum);
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    const partial = req.validated?.body ?? req.validated ?? req.body ?? {};

    // Persist
    const updated = await UserModel.patch(idNum, partial);

    // Shape/sanitize output
    return res.json({
      id: updated.id,
      user_name: updated.user_name,
      first_name: updated.first_name,
      last_name: updated.last_name,
      email_address: updated.email_address,
      role: updated.role,
      status: updated.status,
      email_verified: !!updated.email_verified,
      two_factor_enabled: !!updated.two_factor_enabled,
      // preferences is JSON text in DB; parse if available/valid
      preferences:
        typeof updated.preferences === "string"
          ? (() => {
              try { return JSON.parse(updated.preferences); } catch { return updated.preferences; }
            })()
          : updated.preferences,
    });
  } catch (err) {
    const status = err.status ?? 500;
    return res.status(status).json({ error: err.message });
  }
}
};

export default UserController;