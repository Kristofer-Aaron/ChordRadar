// models/tokenModels.js
import pool from '../config/db.js';

/**
 * Token types are constrained by your ENUM:
 * 'email_verification' | 'password_reset' | 'api_access'
 *
 * The helpers below implement the three methods you outlined,
 * plus a couple of ergonomics used by the email-change flow.
 */
export const TokenModel = {
  /**
   * Find any active token rows for a user+type.
   * Returns the newest non-expired token (or null).
   */

    async findUserToken(userId, tokenType) {
    const [rows] = await pool.query(
        `SELECT id, user_id, token, type, created_at, expires_at
        FROM user_tokens
        WHERE user_id = ? AND type = ? AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1`,
        [userId, tokenType]
    );
    return rows?.[0] || null;
    },


  /**
   * Insert a new token for a user+type with an explicit expiry.
   * If you want to ensure a single active token per type, call deleteUserToken()
   * beforehand (see controller usage).
   */
  async insertUserToken(userId, token, tokenType, createdAt, expiresAt /* MySQL DATETIME string */) {
    const [res] = await pool.query(
      `INSERT INTO user_tokens (user_id, token, type, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, token, tokenType, createdAt, expiresAt]
    );
    return res.insertId; // returns new row id
  },

  /**
   * Remove all tokens by user+type (active and expired).
   * Use before inserting to enforce one-live-token policy.
   */
  async deleteUserToken(userId, tokenType) {
    await pool.query(
      `DELETE FROM user_tokens WHERE user_id = ? AND type = ?`,
      [userId, tokenType]
    );
  },

  /**
   * Verify that a specific token string exists, matches the type,
   * and is not expired. Returns the row or null.
   */
  async findTokenString(token, tokenType) {
    const [rows] = await pool.query(
      `SELECT user_id, token, expires_at
       FROM user_tokens
       WHERE token = ? AND type = ? AND expires_at > NOW()
       LIMIT 1`,
      [token, tokenType]
    );
    return rows?.[0] || null;
  },

  /**
   * Consume (delete) a specific token string of given type.
   */
  async consumeTokenString(token, tokenType) {
    await pool.query(
      `DELETE FROM user_tokens WHERE token = ? AND type = ?`,
      [token, tokenType]
    );
  }
};