import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import UserModel from "../models/userModel.js";
import sendEmail from "../utils/sendEmail.js";
import { TokenModel } from "../models/tokenModel.js";
import { generateQrDataUrl } from "../utils/qrCode.js";
import QRCode from 'qrcode';
import { generateTotpSecret, buildOtpAuthUrl, verifyTotp, generateBackupCodes } from "../utils/totp.js";

export const AuthController = {
  async login(req, res) {
    try {
      const { email_address, password } = req.body || {};
      const rememberMe = req.validated?.query?.["remember-me"] ?? false;
      if (!email_address || !password) { return res.status(400).json({ error: 'Missing credentials' }); }

      // Load user by email (generic error if not found)
      const user = await UserModel.findByEmail(email_address);
      if (!user) { return res.status(401).json({ error: 'Invalid credentials' }); }

      // Validate password (avoid leaking existence of user)
      const passwordOk = await bcrypt.compare(password, user.password_hash);
      if (!passwordOk) { return res.status(401).json({ error: 'Invalid credentials' }); }

      // JWT configuration guard
      const secret = process.env.JWT_SECRET;
      if (!secret) { return res.status(500).json({ error: 'Server config error' }); }

      // Check for existing active api_access token
      const existing = await TokenModel.findUserToken(user.id, 'api_access');

      // Issue a fresh JWT for both new logins and renewals
      const jwtPayload = { id: user.id, role: user.role };
      const accessToken = jwt.sign(jwtPayload, secret, {
        algorithm: 'HS256',
        expiresIn: rememberMe ? '30d' : '1h',
      });

      const now = new Date();
      const expiresAt = rememberMe ? new Date(now.getTime() + process.env.API_TOKEN_EXPIRATION_LONG * 1000) : new Date(now.getTime() + process.env.API_TOKEN_EXPIRATION * 1000);

      await TokenModel.deleteUserToken(user.id, 'api_access');
      await TokenModel.insertUserToken(user.id, accessToken, 'api_access', now, expiresAt);

      return res.status(200).json({
        ok: true,
        token: accessToken,
        renewed: Boolean(existing),
      });
    } catch (err) {
      console.error('[loginWithPassword] error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async loginTotp(req, res) {
  try {
    const { email_address, totp_token } = req.body || {};

    // Match login() behavior: parse remember-me from query string
    const rememberMe = req.validated?.query?.["remember-me"] ?? false;

    // Basic input guard (consistent with login())
    if (!email_address || !totp_token) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const email = String(email_address).trim().toLowerCase();
    const code = String(totp_token).trim();

    // Load user (do not reveal if not found)
    const user = await UserModel.findByEmail(email);
    if (!user) { return res.status(401).json({ error: 'Invalid credentials' }); }

    // Ensure TOTP is enabled for this account
    if (!user.two_factor_enabled) {
      return res.status(401).json({ error: 'TOTP login is disabled' });
    }

    // Verify TOTP against stored Base32 secret
    const isValid = verifyTotp({ token: code, secret: user.two_factor_secret });
    if (!isValid) { return res.status(401).json({ error: 'Invalid credentials' }); }

    // JWT configuration guard
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) { return res.status(500).json({ error: 'Server config error' }); }

    // Check for existing active api_access token (to report renewal)
    const existing = await TokenModel.findUserToken(user.id, 'api_access');

    // Issue a fresh JWT (duration mirrors login())
    const jwtPayload = { id: user.id, role: user.role };
    const accessToken = jwt.sign(jwtPayload, jwtSecret, {
      algorithm: 'HS256',
      expiresIn: rememberMe ? '30d' : '1h',
    });

    // Persist new api_access token; enforce one-live-token-per-type
    const now = new Date();
    const expiresAt = rememberMe
      ? new Date(now.getTime() + process.env.API_TOKEN_EXPIRATION_LONG * 1000)
      : new Date(now.getTime() + process.env.API_TOKEN_EXPIRATION * 1000);

    await TokenModel.deleteUserToken(user.id, 'api_access');
    await TokenModel.insertUserToken(user.id, accessToken, 'api_access', now, expiresAt);

    // Success (include whether this was a renewal)
    return res.status(200).json({
      ok: true,
      token: accessToken,
      renewed: Boolean(existing),
    });
  } catch (err) {
    console.error('[loginWithTotp] error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
},

  async logout(req, res) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const payload = req.user;

      // Check if user has an active session
      const result = await TokenModel.findTokenString(token, 'api_access');
      if (result == null) {
        return res.status(404).json({
          error: "Session not found or already logged out",
          code: "SESSION_NOT_FOUND",
        });
      }

      // Delete access token on logout
      await TokenModel.deleteUserToken(payload.id, 'api_access');
      return res.status(200).json({ message: "Logout successful" });
    } catch {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async register(req, res) {
    try {
      const { user_name, first_name, last_name, email_address, password, preferences } = req.body;

      const passwordHash = await bcrypt.hash(password, 10);
      const now = new Date();

      //Insert new record after validating the credentials given by the user
      const result = await UserModel.create({ user_name: user_name, first_name: first_name, last_name: last_name, email_address: email_address, password_hash: passwordHash, password_changed_at: now, account_created_at: now, last_login_at: now, preferences: preferences });
      const userId = result.id;

      // Generate and insert email verification token
      const emailTokenExpiration = parseInt(process.env.EMAIL_TOKEN_EXPIRATION || "86400", 10);
      const emailToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + emailTokenExpiration * 1000);
     await TokenModel.insertUserToken(userId, emailToken, 'email_verification', now, expiresAt);

     //Send verification email
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/auth/verify?token=${emailToken}`;
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
    const { token } = req.validated?.query ?? {};
    try {
      //Check for existing and valid verification token
      const rows = await TokenModel.findTokenString(token, 'email_verification');
      if (rows == null) { return res.status(400).json({ message: "Invalid or expired token" }); }
      const { user_id, expires_at } = rows; //object DESTRUCTURING
      if (new Date() > expires_at) { return res.status(400).json({ message: "Token expired" }); }

      //Update user data and remove verification token
      await pool.query(`UPDATE users SET email_verified = 1, status = 'active' WHERE id = ?`,
        [user_id]);
      await TokenModel.consumeTokenString(token, 'email_verification');

      // Issue API token after successful registration
      const apiTokenExpiration = parseInt(process.env.API_TOKEN_EXPIRATION || "3600", 10);
      const apiToken = jwt.sign({ id: user_id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: `${apiTokenExpiration}s` });
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

// Enroll the currently authenticated user into TOTP authentication method
async totpEnroll(req, res) {
  try {
    const authUser = req.user;

    // Always operate on the authenticated user
    const targetId = String(authUser.id);

    // Fetch current user
    const user = await UserModel.findById(targetId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate TOTP secret + otpauth URL + QR
    const secret = generateTotpSecret();
    const issuer = process.env.APP_NAME || 'MyApp';
    const label = user.email_address || user.user_name || String(user.id); // prefer email if present
    const otpauthUrl = buildOtpAuthUrl({ secret, label, issuer });
    const qrDataUrl = await generateQrDataUrl(otpauthUrl);

    // Store the secret now; keep 2FA disabled until confirmation code is verified
    const updated = await UserModel.updateTwoFactorSecret(targetId, secret);
    if (!updated) {
      return res.status(500).json({ error: 'Failed to set 2FA secret' });
    }

    return res.status(200).json({
      ok: true,
      qr: qrDataUrl,
      otpauth_url: otpauthUrl,
      message: 'Scan the QR code in your authenticator app and submit a code to confirm.'
    });
  } catch (err) {
    console.error('[twoFaEnroll] error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
},

async getQrPng(req, res) {
    try {
      const authUserId = req.user?.id;

      // Load the caller's own record
      const user = await UserModel.findById(authUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // The QR encodes the TOTP secret; only generate if a secret exists
      const secret = user.two_factor_secret;
      if (!secret) {
        // You can return 404, or 409 (Conflict) if you want to signal "enrollment not started"
        return res.status(404).json({ error: '2FA not enrolled for this user' });
      }

      const issuer = process.env.APP_NAME || 'MyApp';
      const label = user.email_address || user.user_name || `user-${user.id}`;

      // Build the otpauth URL that Google Authenticator & friends understand
      const otpauthUrl = buildOtpAuthUrl({ secret, label, issuer });

      // Render a PNG buffer
      const pngBuffer = await QRCode.toBuffer(otpauthUrl, {
        type: 'png',
        margin: 2,
        width: 320, // adjust to taste
        color: { dark: '#000000', light: '#ffffff' }
      });

      // Security headers — this image embeds a secret
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', pngBuffer.length);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');

      return res.status(200).send(pngBuffer);
    } catch (err) {
      console.error('[TwoFAController.getQrPng] error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

// Confirm TOTP authentication method for the currently authenticated user
async totpConfirm(req, res) {
  try {
    const authUser = req.user;

    // Always operate on the authenticated user
    const targetId = String(authUser.id);

    // Load current user
    const user = await UserModel.findById(targetId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Ensure secret exists (enrollment was started)
    const secret = user.two_factor_secret;
    if (!secret) {
      return res.status(400).json({ error: 'No 2FA secret to confirm' });
    }

    // Verify the 6-digit TOTP (accept body.token or body.code for flexibility)
    const code = req.body?.token ?? req.body?.code;
    if (!code) {
      return res.status(400).json({ error: 'Missing 2FA code' });
    }

    const ok = verifyTotp({ token: String(code), secret });
    if (!ok) {
      return res.status(422).json({ error: 'Invalid TOTP token' });
    }

    // Enable 2FA
    const enabled = await UserModel.enableTwoFactor(targetId);
    if (!enabled) {
      return res.status(500).json({ error: 'Failed to enable 2FA' });
    }

    // Generate and persist backup codes (JSON)
    const backups = generateBackupCodes();
    // Hash generated backup codes before inserting into database
    const backupsHash = await Promise.all(backups.map(backup => bcrypt.hash(backup, 10)));
    const saved = await UserModel.setBackupCodes(targetId, JSON.stringify(backupsHash));
    if (!saved) {
      return res.status(500).json({ error: 'Failed to store backup codes' });
    }

    // Self-only flow: safe to return backup codes directly
    return res.status(200).json({
      ok: true,
      message: 'Two-factor authentication enabled.',
      backup_codes: backups
    });
  } catch (err) {
    console.error('[twoFaConfirm] error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
},

async totpDisable(req, res) {
  try {
    const authUser = req.user;
    const targetId = String(authUser.id);
    const user = await UserModel.findById(targetId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Idempotent behavior: If already disabled, return success
    if (!user.two_factor_enabled && !user.two_factor_secret) {
      return res.status(200).json({ ok: true, message: 'Two-factor authentication already disabled.' });
    }

    const { password, totp_token, backup_code } = req.body || {};
    let verified = false;

    // 1) Verify via password (preferred if available)
    if (!verified && typeof password === 'string' && password.trim().length > 0) {
      if (!user.password_hash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const ok = await bcrypt.compare(password.trim(), user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      verified = true;
    }

    // 2) Verify via current TOTP (6-digit)
    if (!verified && typeof totp_token === 'string' && totp_token.trim().length > 0) {
      const code = totp_token.trim();
      // Use your existing helper or otplib/speakeasy under the hood
      const ok = verifyTotp({ token: code, secret: user.two_factor_secret });
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      verified = true;
    }

    // 3) Verify via backup code (consume on success)
    if (!verified && typeof backup_code === 'string' && backup_code.trim().length > 0) {
      const provided = backup_code.trim();
      const backups = JSON.parse(user.two_factor_backup || '[]');
      const ok = await Promise.all(backups.map(backup => bcrypt.compare(provided, backup)));
      if (ok.findIndex(Boolean) === -1) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      // Remove each backup code from database
      await UserModel.setBackupCodes(user.id, JSON.stringify(null));
      verified = true;
    }

    if (!verified) {
      return res.status(400).json({
        error: 'Provide password, a valid TOTP code, or a backup code to disable TOTP authentication method'
      });
    }

    // Disable 2FA and clear secrets/backups
    const disabled = await UserModel.disableTwoFactor(user.id); // should set two_factor_enabled=false
    // If you don't have disableTwoFactor, you can flip the flag via a generic update

    return res.status(200).json({
      ok: true,
      message: 'TOTP authentication disabled.'
    });
  } catch (err) {
    console.error('[disableTotp] error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
},
};