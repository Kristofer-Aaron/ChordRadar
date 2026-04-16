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

	async findByAccessToken(token) {
		const [rows] = await pool.query(
			"SELECT * FROM users JOIN user_tokens ON user_tokens.user_id = users.id HAVING user_tokens.token = ?",
			[token]
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


async patch(id, data = {}) {
    const userId = Number(id);
    if (!Number.isFinite(userId) || userId <= 0) {
      const e = new Error("Invalid user id");
      e.status = 400;
      throw e;
    }

    // Allowing only a safe subset of columns to be changed
    const allowed = new Map([
      ["user_name", "user_name"],
      ["first_name", "first_name"],
      ["last_name", "last_name"],
      ["email_address", "email_address"],
      ["role", "role"],
      ["status", "status"],
      ["email_verified", "email_verified"],          
      ["two_factor_enabled", "two_factor_enabled"],  
      ["preferences", "preferences"],
    ]);

    const sets = [];
    const params = [];

    for (const [key, column] of allowed) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        let val = data[key];
        if (key === "preferences" && val != null) {
          // storing as JSON text
          val = JSON.stringify(val);
        }
        if (key === "email_verified" || key === "two_factor_enabled") {
          // normalizing booleans for TINYINT(1)
          val = val ? 1 : 0;
        }
        sets.push(`${column} = ?`);
        params.push(val);
      }
    }

    if (sets.length === 0) {
      const e = new Error("No updatable fields provided");
      e.status = 400;
      throw e;
    }

    try {
      await pool.query(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, [...params, userId]);
      // return the fresh row
      const [rows] = await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [userId]);
      return rows[0] || null;
    } catch (err) {
      // Unique email guard -> 409 Conflict
      if (err && err.code === "ER_DUP_ENTRY") {
        const e = new Error("A user with this email already exists");
        e.status = 409;
        throw e;
      }
      throw err;
    }
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