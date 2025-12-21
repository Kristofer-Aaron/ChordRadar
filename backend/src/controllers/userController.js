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

    
async getUserBySelector(req, res) {
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

  async update(req, res) {
    try {
      const updatedUser = await UserModel.update(Number(req.params.id), req.validated);
      return res.json(updatedUser);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

/*
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
    */

 async patchUserBySelector(req, res) {
  const { selector, value } = req.params;

  try {
    // 1) Resolve current user (prev)
    let prev = null;
    if (selector === 'id') {
      const idNum = Number(String(value).trim());
      if (!Number.isFinite(idNum) || idNum <= 0) {
        return res.status(400).json({ error: 'Invalid user id' });
      }
      prev = await UserModel.findById(idNum);
    } else if (selector === 'email') {
      const email = String(value).trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email' });
      }
      prev = await UserModel.findByEmail(email);
    } else {
      return res.status(400).json({ error: `Unsupported selector: ${selector}` });
    }

    if (!prev) return res.status(404).json({ error: 'User not found' });

    const targetId = prev.id;
    const updates = { ...req.updates }; // from normalizeUserPatchFields
    const now = new Date();

    // 2) Detect email change (normalize both sides)
    const newEmail = (typeof updates.email_address === 'string')
      ? updates.email_address.trim().toLowerCase()
      : undefined;
    const prevEmail = String(prev.email_address).trim().toLowerCase();
    const emailChanged = typeof newEmail !== 'undefined' && newEmail !== prevEmail;

    // 3) Apply partial update first
    //    (do NOT include system flips here; those are handled below)
    const userPartial = { ...updates };
    delete userPartial.email_verified; // system-controlled
    delete userPartial.status;         // system-controlled when email changes

    const updatedUser = await UserModel.updatePartial(targetId, userPartial);

    // 4) If email changed: flip verification + status, issue token, send email
    let verification_info = null;
    if (emailChanged) {
      const emailTokenExpiration = parseInt(process.env.EMAIL_TOKEN_EXPIRATION || '86400', 10);
      const emailToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + emailTokenExpiration * 1000);

      // Persist token and flip flags (transaction optional but recommended if you expect concurrency)
      await pool.query(
        `DELETE FROM user_tokens WHERE user_id = ? AND type = 'email_verification'`,
        [targetId]
      );
      await pool.query(
        `INSERT INTO user_tokens (user_id, token, type, created_at, expires_at)
         VALUES (?, ?, 'email_verification', ?, ?)`,
        [targetId, emailToken, now, expiresAt]
      );
      await pool.query(
        `UPDATE users SET email_verified = 0, status = 'pending' WHERE id = ?`,
        [targetId]
      );

      const verificationLink = `${process.env.PUBLIC_BASE_URL || 'http://chordradar.akos.local'}/auth/verify?token=${emailToken}`;

      // Send email (don’t fail the whole PATCH if mail fails)
      try {
        await sendEmail(
          newEmail,
          'Verify your email',
          `
            <h1>Email Verification</h1>
            <p>Click the link below to verify your email:</p>
            <p>${verificationLink}${verificationLink}</a></p>
          `
        );
        verification_info = {
          email_verification_sent: true,
          email_verification_expires_at: expiresAt
        };
      } catch (mailErr) {
        console.error('[PATCH] sendEmail failed:', mailErr);
        verification_info = {
          email_verification_sent: false,
          email_verification_expires_at: expiresAt
        };
      }
    }

    // 5) Return fresh snapshot
    const fresh = await UserModel.findById(targetId);

    return res.status(200).json({
      message: 'User updated',
      user: {
        id: fresh.id,
        user_name: fresh.user_name,
        first_name: fresh.first_name,
        last_name: fresh.last_name,
        email_address: fresh.email_address,
        role: fresh.role,
        status: fresh.status,
        email_verified: !!fresh.email_verified,
        two_factor_enabled: !!fresh.two_factor_enabled,
      },
      ...(verification_info || {})
    });
  } catch (err) {
    console.error('[patchUserBySelector] error:', err);
    // Duplicate email from DB unique constraint
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already in use' });
    }
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