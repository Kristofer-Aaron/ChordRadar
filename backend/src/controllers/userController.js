import pool from "../config/db.js";
import UserModel from "../models/userModel.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const UserController = {
  async create(req, res) {
    try {
      const newUser = await UserModel.create(req.validated);

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

    async getById(req, res) {
      try {
        const user = await UserModel.findById(req.params.id);
        if (!user)
          return res.status(404).json({ message: "User not found" });
        res.json(user);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },


  async getByEmail(req, res) {
    try {
      const user = await UserModel.findByEmail(req.params.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ id: user.id });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      const updatedUser = await UserModel.update(Number(req.params.id), req.validated);
      return res.json(updatedUser);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },


    async patch(req, res) {
      try {
        const targetId = Number(req.params.id);
        const prev = req.targetUser;                 // from ensureTargetUserExists
        const updates = req.updates;                 // from normalizePatchFields

        // 1) Apply partial update with model
        const updatedUser = await UserModel.updatePartial(targetId, updates);

        // 2) Email re-verification if email changed
        let verification_info = null;
        if (
          typeof updates.email_address !== "undefined" &&
          updates.email_address !== prev.email_address
        ) {
          // mark unverified & generate token
          const now = new Date();
          const emailTokenExpiration = parseInt(process.env.EMAIL_TOKEN_EXPIRATION || "86400", 10);
          const emailToken = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date(now.getTime() + emailTokenExpiration * 1000);

          // persist token
          await pool.query(
            `DELETE FROM user_tokens WHERE user_id = ? AND type = 'email_verification'`,
            [targetId]
          );
          await pool.query(
            `INSERT INTO user_tokens (user_id, token, type, created_at, expires_at)
            VALUES (?, ?, 'email_verification', ?, ?)`,
            [targetId, emailToken, now, expiresAt]
          );

          // optionally flip email_verified & status here if not done in updatePartial:
          await pool.query(`UPDATE users SET email_verified = 0, status = 'pending' WHERE id = ?`, [targetId]);

          const verificationLink = `http://chordradar.akos.local/auth/verify?token=${emailToken}`;
          await sendEmail(
            updatedUser.email_address,
            "Verify your email",
            `
              <h1>Email Verification</h1>
              <p>Click the link below to verify your email:</p>
              <a href="${verificationLink}">${verificationLink}</a>
            `
          );

          verification_info = {
            email_verification_sent: true,
            email_verification_expires_at: expiresAt,
          };
        }

        // 3) Response
        return res.status(200).json({
          message: "User updated",
          user: {
            id: updatedUser.id,
            user_name: updatedUser.user_name,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            email_address: updatedUser.email_address,
            role: updatedUser.role,
            status: updatedUser.status,
            email_verified: !!updatedUser.email_verified,
            two_factor_enabled: !!updatedUser.two_factor_enabled,
          },
          ...(verification_info || {}),
        });
      } catch (err) {
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