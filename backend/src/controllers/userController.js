import { TokenModel } from "../models/tokenModel.js";
import UserModel from "../models/userModel.js";

const UserController = {
  async create(req, res) {
    try {
      const newUser = await UserModel.create(req.validated);
      await TokenModel.insertUserToken()

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
        // Validate id
        const idStr = String(value).trim();
        const idNum = Number(idStr);
        if (!idStr || Number.isNaN(idNum) || idNum <= 0) {
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

    // Optionally shape output to avoid leaking sensitive fields  
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
      // omit password_hash, secrets, backup codes, etc.
    });
  } catch (err) {
    console.error('[getUserBySelector] error:', err);
    return res.status(500).json({ error: err.message });
  }
},
    async remove(req, res) {
      try {
        await UserModel.remove(req.params.id);
        res.status(204).send();
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    }
};

export default UserController;