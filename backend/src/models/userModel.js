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
	}
};

export default UserModel;