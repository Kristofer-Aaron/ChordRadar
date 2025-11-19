import pool from '../config/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/userModel.js';

export const AuthController = {
  
async login(req, res) {
  const { email_address, password } = req.body;

  try {
    const user = await UserModel.findByEmail(email_address);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const now = new Date();
    const tokenExpiration = parseInt(process.env.API_TOKEN_EXPIRATION, 10);
    // Invalidate all old tokens for this user
    await pool.query(
      `DELETE FROM user_tokens WHERE user_id = ? AND type = 'api_access'`,
      [user.id]
    );

    // Generate new token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: `${tokenExpiration}s` }
    );

    const expiresAt = new Date(now.getTime() + tokenExpiration * 1000);

    // Insert new token
    await pool.query(
      `INSERT INTO user_tokens (user_id, token, type, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [user.id, token, 'api_access', now, expiresAt]
    );

    // Update last login timestamp
    await pool.query('UPDATE users SET last_login_at = ? WHERE id = ?', [now, user.id]);

    res.json({
      message: 'Login successful',
      token,
      expires_at: expiresAt,
      user: {
        id: user.id,
        user_name: user.user_name,
        email_address: user.email_address,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      preferences // Expecting JSON from client
    } = req.body;

    if (!user_name || !first_name || !last_name || !email_address || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if email already exists
    const [existing] = await pool.query('SELECT * FROM users WHERE email_address = ?', [email_address]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Prepare defaults
    const now = new Date();
    const email_verified = 0;
    const password_changed_at = now;
    const two_factor_enabled = 0;
    const two_factor_method = null;
    const two_factor_secret = null;
    const two_factor_backup = JSON.stringify([]); // empty array
    const role = 'user';
    const status = 'pending';
    const account_created_at = now;
    const last_login_at = now;
    const prefs = preferences ? JSON.stringify(preferences) : JSON.stringify({});

    // Insert user
    const [result] = await pool.query(
      `INSERT INTO users (
        user_name, first_name, last_name, email_address, email_verified,
        password_hash, password_changed_at, two_factor_enabled, two_factor_method,
        two_factor_secret, two_factor_backup, role, status, account_created_at,
        last_login_at, preferences
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_name, first_name, last_name, email_address, email_verified,
        password_hash, password_changed_at, two_factor_enabled, two_factor_method,
        two_factor_secret, two_factor_backup, role, status, account_created_at,
        last_login_at, prefs
      ]
    );

    const userId = result.insertId;

    // Generate email verification token
    const emailTokenExpiration = parseInt(process.env.EMAIL_TOKEN_EXPIRATION, 10); // seconds
    const emailToken = crypto.randomBytes(32).toString('hex'); // Secure random token
    const expiresAt = new Date(Date.now() + emailTokenExpiration * 1000);

    // Store token in user_tokens table
    await pool.query(
      `INSERT INTO user_tokens (user_id, token, type, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, emailToken, 'email_verification', now, expiresAt]
    );

    // Send email with verification link
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${emailToken}`;
    await sendEmail(email_address, 'Verify your email', `Click here to verify your account: ${verificationLink}`);

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: userId,
        user_name,
        first_name,
        last_name,
        email_address,
        role,
        status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
},

async verifyEmail(req, res) {
  const { token } = req.query;

  try {
    // Find token in user_tokens
    const [rows] = await pool.query(
      `SELECT user_id, expires_at FROM user_tokens WHERE token = ? AND type = 'email_verification'`,
      [token]
    );

    if (rows.length === 0) return res.status(400).json({ message: 'Invalid or expired token' });

    const { user_id, expires_at } = rows[0];
    if (new Date() > expires_at) {
      return res.status(400).json({ message: 'Token expired' });
    }

    // Update user email_verified and status
    await pool.query(`UPDATE users SET email_verified = 1, status = 'active' WHERE id = ?`, [user_id]);

    // Delete email verification token
    await pool.query(`DELETE FROM user_tokens WHERE token = ?`, [token]);

    // Generate API token after verification
    const apiTokenExpiration = parseInt(process.env.API_TOKEN_EXPIRATION, 10); // seconds
    const apiToken = jwt.sign({ id: user_id }, process.env.JWT_SECRET, { expiresIn: `${apiTokenExpiration}s` });
    const now = new Date();
    const expiresAt = new Date(now.getTime() + apiTokenExpiration * 1000);

    await pool.query(
      `INSERT INTO user_tokens (user_id, token, type, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, apiToken, 'api_access', now, expiresAt]
    );

    res.json({ message: 'Email verified successfully', token: apiToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
} 