import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import UserModel from "../models/userModel.js";
import sendEmail from "../utils/sendEmail.js";
import { TokenModel } from "../models/tokenModels.js";

export const AuthController = {
	
async login(req, res) {
    try {
      const now = new Date();
      const { email_address, password } = req.body;
      const tokenExpiration = parseInt(process.env.API_TOKEN_EXPIRATION || "3600", 10);

      const user = await UserModel.findByEmail(email_address);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (user.status !== "active") {
        return res.status(403).json({
          error: "Account is not active. Please verify your email or contact support.",
        });
      }

      //Check if given credentials are identical to the ones stored in the database
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });
     
      const activeRows = await TokenModel.findUserToken(user.id, 'api_access');
      if (activeRows != null) {
        return res.status(409).json({
          error: "User already logged in",
          code: "ALREADY_LOGGED_IN",
          session: { expires_at: activeRows.expires_at },
        });
      }

      //Delete expired access token(s)
     await TokenModel.deleteUserToken(user.id, 'api_access');

     //Create new access tokens for user
     const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: `${tokenExpiration}s`,
      });
      const expiresAt = new Date(now.getTime() + tokenExpiration * 1000);
     await TokenModel.insertUserToken(user.id, token, 'api_access', now, expiresAt);
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

      //Check if user has an active session
     const result = await TokenModel.findTokenString(token, 'api_access');
      if (result == null) {
        return res.status(404).json({
          error: "Session not found or already logged out",
          code: "SESSION_NOT_FOUND",
        });
      }

      //Delete access token on logout
      await TokenModel.deleteUserToken(payload.id, 'api_access');
      return res.status(200).json({ message: "Logout successful" });
    } catch {
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
        preferences
      } = req.body;

      const passwordHash = await bcrypt.hash(password, 10);
      const now = new Date();

      //Insert new record after validating the credentials given by the user
     const result = await UserModel.create({user_name: user_name, first_name: first_name, last_name: last_name, email_address: email_address, password_hash: passwordHash, password_changed_at: now, account_created_at: now, last_login_at: now, preferences: preferences});
      const userId = result.id;

      // Generate and insert email verification token
      const emailTokenExpiration = parseInt(process.env.EMAIL_TOKEN_EXPIRATION || "86400", 10);
      const emailToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + emailTokenExpiration * 1000);
     await TokenModel.insertUserToken(userId, emailToken, 'email_verification', now, expiresAt);

     //Send verification email
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
      //Check for existing and valid verification token
     const rows = await TokenModel.findTokenString(token, 'email_verification');
      if (rows == null) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      const { user_id, expires_at } = rows; //object DESTRUCTURING
      if (new Date() > expires_at) {
        return res.status(400).json({ message: "Token expired" });
      }

      //Update user data and remove verification token
      await pool.query(
        `UPDATE users SET email_verified = 1, status = 'active' WHERE id = ?`,
        [user_id]
      );
     await TokenModel.consumeTokenString(token, 'email_verification');

      // Issue API token after successful registration
      const apiTokenExpiration = parseInt(process.env.API_TOKEN_EXPIRATION || "3600", 10);
      const apiToken = jwt.sign({ id: user_id, role: 'user' }, process.env.JWT_SECRET, {
        expiresIn: `${apiTokenExpiration}s`,
      });
      const now = new Date();
      const apiExpiresAt = new Date(now.getTime() + apiTokenExpiration * 1000);
     await TokenModel.insertUserToken(user_id, apiToken, 'api_access', now, apiExpiresAt)

      return res.json({
        message: "Email verified successfully",
        token: apiToken,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};