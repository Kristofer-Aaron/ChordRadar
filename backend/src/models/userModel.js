import pool from '../config/db.js';

export const UserModel = {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM users');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email_address = ?', [email]);
    return rows[0];
  },

  async create(data) {
    const {
      user_name,
      first_name,
      last_name,
      email_address,
      email_verified,
      password_hash,
      password_changed_at,
      two_factor_enabled,
      two_factor_method,
      two_factor_secret,
      two_factor_backup,
      role,
      status,
      account_created_at,
      last_login_at,
      preferences
    } = data;

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
        two_factor_secret, JSON.stringify(two_factor_backup), role, status,
        account_created_at, last_login_at, JSON.stringify(preferences)
      ]
    );

    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    await pool.query(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, id]);

    return this.findById(id);
  },

  async remove(id) {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return { message: 'User deleted' };
  }
};