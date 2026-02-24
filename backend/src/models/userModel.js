import pool from "../config/db.js";

const UserModel = {
	async findAll() {
		const [rows] = await pool.query("SELECT * FROM users");
		return rows;
	},

	async findById(id) {
		const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [
			id,
		]);
		return rows[0];
	},

	async findByEmail(email) {
		const [rows] = await pool.query(
			"SELECT * FROM users WHERE email_address = ?",
			[email]
		);
		return rows[0];
	},
	
	async create(data) {
		const now = new Date();
		const { user_name, first_name, last_name, email_address, password_hash, password_changed_at, preferences, account_created_at=now, last_login_at=now, role='user', status='pending', email_verified='0' } = data;

		const [result] = await pool.query(
			`INSERT INTO users (user_name, first_name, last_name, email_address, password_hash, password_changed_at, account_created_at, last_login_at, preferences, role, status, email_verified)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[ user_name, first_name, last_name, email_address, password_hash, password_changed_at, account_created_at, last_login_at, JSON.stringify(preferences), role, status, email_verified ]
		);

		return { id: result.insertId, ...data };
	},

	async remove(id) {
		await pool.query("DELETE FROM users WHERE id = ?", [id]);
		await pool.query("DELETE FROM user_tokens WHERE user_id = ?", [id]);
		return { message: "User deleted" };
	},
	
async updateTwoFactorSecret(id, secret) {
    const [res] = await pool.query(
      `UPDATE users SET two_factor_secret = ?, two_factor_method = 'totp'
       WHERE id = ?`,
      [secret, id]
    );
    return res.affectedRows === 1;
  },

  async enableTwoFactor(id) {
    const [res] = await pool.query(
      `UPDATE users SET two_factor_enabled = 1 WHERE id = ?`,
      [id]
    );
    return res.affectedRows === 1;
  },

  async disableTwoFactor(id) {
    const [res] = await pool.query(
      `UPDATE users
       SET two_factor_enabled = 0, two_factor_method = NULL, two_factor_secret = NULL, two_factor_backup = NULL
       WHERE id = ?`,
      [id]
    );
    return res.affectedRows === 1;
  },

  async setBackupCodes(id, codesJsonString) {
    const [res] = await pool.query(
      `UPDATE users SET two_factor_backup = ?
       WHERE id = ?`,
      [codesJsonString, id]
    );
    return res.affectedRows === 1;
  }

};

export default UserModel;