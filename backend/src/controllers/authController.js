import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import UserModel from "../models/userModel.js";
import sendEmail from "../utils/sendEmail.js";

export const AuthController = {
	
async login(req, res) {
    try {
      const now = new Date();
      const { email_address, password } = req.validated; // from validateBody(loginSchema)
      const tokenExpiration = parseInt(process.env.API_TOKEN_EXPIRATION || "3600", 10);

      // Idempotent path: if optionalAuthenticate decoded a token & it is active in DB, return it.
      if (req.user && req.token) {
        const [rows] = await pool.query(
          `SELECT user_id, token, expires_at
           FROM user_tokens
           WHERE token = ? AND type = 'api_access' AND expires_at > NOW()
           LIMIT 1`,
          [req.token]
        );

        if (rows?.length === 1 && rows[0].user_id === req.user.id) {
          // Enrich user
          const user = await UserModel.findById(req.user.id) || { id: req.user.id };
          return res.status(200).json({
            message: "Already logged in",
            token: req.token,
            expires_at: rows[0].expires_at,
            user: {
              id: user.id,
              user_name: user.user_name,
              email_address: user.email_address,
              role: user.role,
            },
          });
        }
        // if not active, fall through to normal login
      }

      // Normal login flow
      const user = await UserModel.findByEmail(email_address);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (user.status !== "active") {
        return res.status(403).json({
          error: "Account is not active. Please verify your email or contact support.",
        });
      }

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });

      // Single-session policy: block if already active
      const [activeRows] = await pool.query(
        `SELECT token, expires_at
         FROM user_tokens
         WHERE user_id = ? AND type = 'api_access' AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [user.id]
      );
      if (activeRows?.length > 0) {
        return res.status(409).json({
          error: "User already logged in",
          code: "ALREADY_LOGGED_IN",
          session: { expires_at: activeRows[0].expires_at },
        });
      }

      // Issue new token
      await pool.query(
        `DELETE FROM user_tokens WHERE user_id = ? AND type = 'api_access'`,
        [user.id]
      );

      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: `${tokenExpiration}s`,
      });
      const expiresAt = new Date(now.getTime() + tokenExpiration * 1000);

      await pool.query(
        `INSERT INTO user_tokens (user_id, token, type, created_at, expires_at)
         VALUES (?, ?, 'api_access', ?, ?)`,
        [user.id, token, now, expiresAt]
      );

      await pool.query(`UPDATE users SET last_login_at = ? WHERE id = ?`, [now, user.id]);

      return res.json({
        message: "Login successful",
        token,
        expires_at: expiresAt,
        user: {
          id: user.id,
          user_name: user.user_name,
          email_address: user.email_address,
          role: user.role,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  async logout(req, res) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const payload = req.user; // set by authenticate

      const [result] = await pool.query(
        `DELETE FROM user_tokens
         WHERE user_id = ? AND token = ? AND type = 'api_access'`,
        [payload.id, token]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: "Session not found or already logged out",
          code: "SESSION_NOT_FOUND",
        });
      }
      return res.status(200).json({ message: "Logout successful" });
    } catch {
      // authenticate + requireActiveToken already guard invalid/expired tokens
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async register(req, res) {
    try {
      const {
        user_name,
        first_name,
        last_name,
        email_address,
        password,
        preferences,
      } = req.validated;

      const password_hash = await bcrypt.hash(password, 10);
      const now = new Date();
      const prefsStr = typeof preferences === "string"
        ? preferences
        : JSON.stringify(preferences ?? {});
      // ensure JSON parses
      try { JSON.parse(prefsStr); } catch { return res.status(400).json({ error: "preferences must be valid JSON" }); }

      const [result] = await pool.query(
        `INSERT INTO users (
           user_name, first_name, last_name, email_address, email_verified,
           password_hash, password_changed_at, two_factor_enabled, two_factor_method,
           two_factor_secret, two_factor_backup, role, status, account_created_at,
           last_login_at, preferences
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_name, first_name, last_name, email_address, 0,
          password_hash, now, 0, null,
          null, JSON.stringify([]), 'user', 'pending', now,
          now, prefsStr
        ]
      );

      const userId = result.insertId;

      // Generate email verification token
      const emailTokenExpiration = parseInt(process.env.EMAIL_TOKEN_EXPIRATION || "86400", 10);
      const emailToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + emailTokenExpiration * 1000);

      await pool.query(
        `INSERT INTO user_tokens (user_id, token, type, created_at, expires_at)
         VALUES (?, ?, 'email_verification', ?, ?)`,
        [userId, emailToken, now, expiresAt]
      );

      const verificationLink = `http://chordradar.akos.local/auth/verify?token=${emailToken}`;
      await sendEmail(
        email_address,
        "Verify your email",
        `
          <h1>Email Verification</h1>
          <p>Click the link below to verify your email:</p>
          <a href="${verificationLink}">${verificationLink}</a>
        `
      );

      return res.status(201).json({
        message: "User registered successfully. Please check your email to verify your account.",
        user: {
          id: userId,
          user_name,
          first_name,
          last_name,
          email_address,
          role: "user",
          status: "pending",
        },
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  async verify(req, res) {
    const { token } = req.validatedQuery;
    try {
      const [rows] = await pool.query(
        `SELECT user_id, expires_at
         FROM user_tokens
         WHERE token = ? AND type = 'email_verification'`,
        [token]
      );
      if (rows.length === 0) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      const { user_id, expires_at } = rows[0];
      if (new Date() > expires_at) {
        return res.status(400).json({ message: "Token expired" });
      }

      await pool.query(
        `UPDATE users SET email_verified = 1, status = 'active' WHERE id = ?`,
        [user_id]
      );
      await pool.query(`DELETE FROM user_tokens WHERE token = ?`, [token]);

      // Issue API token after verification
      const apiTokenExpiration = parseInt(process.env.API_TOKEN_EXPIRATION || "3600", 10);
      const apiToken = jwt.sign({ id: user_id, role: 'user' }, process.env.JWT_SECRET, {
        expiresIn: `${apiTokenExpiration}s`,
      });
      const now = new Date();
      const apiExpiresAt = new Date(now.getTime() + apiTokenExpiration * 1000);

      await pool.query(
        `INSERT INTO user_tokens (user_id, token, type, created_at, expires_at)
         VALUES (?, ?, 'api_access', ?, ?)`,
        [user_id, apiToken, now, apiExpiresAt]
      );

      return res.json({
        message: "Email verified successfully",
        token: apiToken,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};