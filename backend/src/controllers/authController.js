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

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Calculate expiration date
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

    // Insert token into user_tokens table
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

async register (req, res) {

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

    // Generate JWT token
    const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
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

}

} 