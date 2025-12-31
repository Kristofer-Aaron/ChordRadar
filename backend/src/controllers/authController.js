import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import UserModel from "../models/userModel.js";
import sendEmail from "../utils/sendEmail.js";
import { TokenModel } from "../models/tokenModels.js";
import { generateQrDataUrl } from "../utils/qrcode.js";
import QRCode from 'qrcode';
import { generateTotpSecret, buildOtpAuthUrl, verifyTotp, generateBackupCodes } from "../utils/totp.js";

export const AuthController = {
	
async login(req, res) {
try {
    const { email_address, password, twoFactorToken, backupCode } = req.body || {};

    // 1) Load user by email
    const user = await UserModel.findByEmail(email_address);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    console.log(user.id);

    const result = await TokenModel.findUserToken(user.id, 'api_access');
    console.log(result);
    if (result != null) {
      return res.status(400).json({ error: 'Already logged in' });
    }

    // 2) If a password was provided, validate it; otherwise skip
    if (typeof password === 'string') {
      // Defensive checks before bcrypt.compare
      if (!user.password_hash || password.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const passwordOk = await bcrypt.compare(password, user.password_hash);
      if (!passwordOk) return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3) If user has 2FA enabled, require a TOTP or a backup code
    if (user.two_factor_enabled && password == null) {
      const hasTotp = typeof twoFactorToken === 'string' && twoFactorToken.length > 0;
      const hasBackup = typeof backupCode === 'string' && backupCode.length > 0;

      if (!hasTotp && !hasBackup) {
        return res.status(401).json({ error: 'Two-factor code required' });
      }

      // Prefer TOTP if provided
      if (hasTotp) {
        const ok = verifyTotp({ token: twoFactorToken, secret: user.two_factor_secret });
        if (!ok) return res.status(401).json({ error: 'Invalid 2FA code' });
      } else {
        // Fallback: backup code
        const backups = JSON.parse(user.two_factor_backup || '[]');
        const idx = backups.findIndex(c => c === backupCode);
        if (idx === -1) return res.status(401).json({ error: 'Invalid backup code' });
        backups.splice(idx, 1); // consume
        await UserModel.setBackupCodes(user.id, JSON.stringify(backups));
      }
    }

    // 4) Issue JWT + api_access token (your existing flow)
    const jwtPayload = { id: user.id, role: user.role };
    const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await TokenModel.insertUserToken(user.id, accessToken, 'api_access', new Date(Date.now()), expiresAt);

    return res.status(200).json({ ok: true, token: accessToken });
  } catch (err) {
    console.error('[login] error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
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

async twoFaEnroll(req, res) {
  try {
    const authUser = req.user;
    console.log(req.user);

    // Determine target user id:
    // - Admins must specify an id (via route param, body, or query)
    // - Non-admins always operate on themselves (req.user.id)
    let targetId = null;

    if (authUser?.role === 'admin') {
      // Accept id from param, body, or query (choose any one source you prefer)
      targetId = req.params?.id ?? req.body?.user_id ?? req.query?.user_id ?? null;
      if (!targetId) {
        return res.status(400).json({ error: 'Missing target user id for admin request' });
      }
    } else {
      // Non-admin: always self
      targetId = authUser?.id;
      // Optional guard: if a non-admin tries to pass an id that differs from their own
      const requestedId = req.params?.id ?? req.body?.user_id ?? req.query?.user_id;
      if (requestedId && String(requestedId) !== String(targetId)) {
        return res.status(403).json({ error: 'Forbidden: cannot enroll 2FA for another user' });
      }
    }

    // Fetch target user
    const user = await UserModel.findById(targetId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate TOTP secret + otpauth URL + QR
    const secret = generateTotpSecret();
    const issuer = process.env.APP_NAME || 'MyApp';
    const label = user.email_address || user.user_name; // prefer email if present
    const otpauthUrl = buildOtpAuthUrl({ secret, label, issuer });
    const qrDataUrl = await generateQrDataUrl(otpauthUrl);

    // Store the secret now, but keep 2FA disabled until the user confirms a valid code
    const updated = await UserModel.updateTwoFactorSecret(targetId, secret);
    if (!updated) {
      return res.status(500).json({ error: 'Failed to set 2FA secret' });
    }

    return res.status(200).json({
      ok: true,
      method: 'google_authenticator',
      qr: qrDataUrl,          // data:image/png;base64,...
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
      if (!authUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

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
  

async enrollConfirm(req, res) {
  try {
    const authUser = req.user;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(400).json({ error: 'Missing token' });

    // Resolve target user id:
    // - Admin: must provide target id via param/body/query
    // - Non-admin: always operate on self (ignore any provided id if different)
    let targetId;

    if (authUser?.role === 'admin') {
      targetId = req.params?.id ?? req.body?.user_id ?? req.query?.user_id ?? null;
      if (!targetId) {
        return res.status(400).json({ error: 'Missing target user id for admin request' });
      }
    } else {
      // Non-admins: enforce self
      targetId = authUser?.id;
      const requestedId = req.params?.id ?? req.body?.user_id ?? req.query?.user_id;
      if (requestedId && String(requestedId) !== String(targetId)) {
        return res.status(403).json({ error: 'Forbidden: cannot confirm 2FA for another user' });
      }
    }

    // Load target user
    const user = await UserModel.findById(targetId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Ensure secret exists (enrollment started)
    const secret = user.two_factor_secret;
    //console.log(user, user.two_factor_secret, req.body.token);
    if (!secret) return res.status(400).json({ error: 'No 2FA secret to confirm' });

    // Verify the 6-digit TOTP
    const ok = verifyTotp({ token: req.body.token, secret });
    if (!ok) return res.status(422).json({ error: 'Invalid 2FA code' });

    // Enable 2FA and set method to google_authenticator if not already set
    // (You may have set method during enrollStart; this is defensive)
    const enabled = await UserModel.enableTwoFactor(targetId);
    if (!enabled) return res.status(500).json({ error: 'Failed to enable 2FA' });

    // Generate and persist backup codes (JSON)
    const backups = generateBackupCodes();
    const saved = await UserModel.setBackupCodes(targetId, JSON.stringify(backups));
    if (!saved) return res.status(500).json({ error: 'Failed to store backup codes' });

    // For security, only return backup codes to the owner (not to admins confirming for others)
    const isSelf = String(authUser?.id) === String(targetId);
    const response = {
      ok: true,
      message: 'Two-factor authentication enabled.'
    };
    if (isSelf) {
      response.backup_codes = backups; // show once to the user themselves
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error('[enrollConfirm] error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
},

  
async twoFaDisable(req, res) {
  const { id } = req.params;
  const authUser = req.user;

  if (String(authUser.id) !== String(id) && authUser.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await UserModel.disableTwoFactor(id);
  return res.status(200).json({ ok: true, message: 'Two-factor disabled.' });
}


};