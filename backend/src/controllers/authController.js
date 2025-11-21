import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { UserModel } from "../models/userModel.js";
import { sendEmail } from "../utils/sendEmail.js";

export const AuthController = {
	async login(req, res) {
		const { email_address, password } = req.body || {};
		const authHeader = req.get("authorization") || "";
		const now = new Date();

		try {
			// ------------------------------------------------------------------
			// 1) If the request already carries a valid token → treat as idempotent login
			// ------------------------------------------------------------------
			if (authHeader.startsWith("Bearer ")) {
				const incomingToken = authHeader.slice(7);

				try {
					const payload = jwt.verify(
						incomingToken,
						process.env.JWT_SECRET
					);

					// Optional: confirm this token exists and is still active in DB
					const [rows] = await pool.query(
						`
            SELECT user_id, token, expires_at
            FROM user_tokens
            WHERE token = ? AND type = 'api_access' AND expires_at > NOW()
            LIMIT 1
          `,
						[incomingToken]
					);

					if (
						rows &&
						rows.length === 1 &&
						rows[0].user_id === payload.id
					) {
						// Fetch minimal user information for the response (if available)
						const user =
							(UserModel.findById &&
								(await UserModel.findById(payload.id))) ||
							(email_address
								? await UserModel.findByEmail(email_address)
								: null);

						return res.status(200).json({
							message: "Already logged in",
							token: incomingToken,
							expires_at: rows[0].expires_at,
							user: user
								? {
										id: user.id,
										user_name: user.user_name,
										email_address: user.email_address,
										role: user.role,
								  }
								: { id: payload.id },
						});
					}
					// If token verification fails or DB entry is missing, continue to normal login
				} catch (_) {
					// Invalid/expired token → fall through to normal login
				}
			}

			// ------------------------------------------------------------------
			// 2) Normal login flow (email + password)
			// ------------------------------------------------------------------
			const user = await UserModel.findByEmail(email_address);
			if (!user) return res.status(404).json({ error: "User not found" });

			// ✅ Ensure user is active
			if (user.status !== "active") {
				return res.status(403).json({
					error: "Account is not active. Please verify your email or contact support.",
				});
			}

			const validPassword = await bcrypt.compare(
				password,
				user.password_hash
			);
			if (!validPassword)
				return res.status(401).json({ error: "Invalid credentials" });

			// ------------------------------------------------------------------
			// 3) If an active session already exists → block with 409 (no reissue)
			// ------------------------------------------------------------------
			const [activeRows] = await pool.query(
				`
        SELECT token, created_at, expires_at
        FROM user_tokens
        WHERE user_id = ? AND type = 'api_access' AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `,
				[user.id]
			);

			if (activeRows && activeRows.length > 0) {
				return res.status(409).json({
					error: "User already logged in",
					code: "ALREADY_LOGGED_IN",
					session: {
						expires_at: activeRows[0].expires_at,
					},
				});
			}

			// ------------------------------------------------------------------
			// 4) Issue new token
			//    (invalidate any previous tokens, even expired ones, to keep table tidy)
			// ------------------------------------------------------------------
			const tokenExpiration = parseInt(
				process.env.API_TOKEN_EXPIRATION,
				10
			);
			const expiresAt = new Date(now.getTime() + tokenExpiration * 1000);

			await pool.query(
				`
        DELETE FROM user_tokens
        WHERE user_id = ? AND type = 'api_access'
      `,
				[user.id]
			);

			const token = jwt.sign(
				{ id: user.id, role: user.role },
				process.env.JWT_SECRET,
				{ expiresIn: `${tokenExpiration}s` }
			);

			await pool.query(
				`
        INSERT INTO user_tokens (user_id, token, type, created_at, expires_at)
        VALUES (?, ?, 'api_access', ?, ?)
      `,
				[user.id, token, now, expiresAt]
			);

			await pool.query(
				"UPDATE users SET last_login_at = ? WHERE id = ?",
				[now, user.id]
			);

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

	// Assumes: pool (MySQL), jwt, process.env.JWT_SECRET
	async logout(req, res) {
		const authHeader = req.get("authorization") || "";
		if (!authHeader.startsWith("Bearer ")) {
			return res
				.status(401)
				.json({ error: "Authorization token missing" });
		}

		const token = authHeader.slice(7);

		try {
			// Verify token signature (ensures it was issued by us)
			const payload = jwt.verify(token, process.env.JWT_SECRET);

			// Delete only this token (logout current session)
			const [result] = await pool.query(
				`
        DELETE FROM user_tokens
        WHERE user_id = ? AND token = ? AND type = 'api_access'
      `,
				[payload.id, token]
			);

			if (result.affectedRows === 0) {
				// Token may already be deleted/expired or not exist in DB
				return res.status(404).json({
					error: "Session not found or already logged out",
					code: "SESSION_NOT_FOUND",
				});
			}

			return res.status(200).json({ message: "Logout successful" });
		} catch (err) {
			// jwt.verify throws on invalid/expired tokens
			return res.status(401).json({ error: "Invalid or expired token" });
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
				preferences,
			} = req.body;

			if (
				!user_name ||
				!first_name ||
				!last_name ||
				!email_address ||
				!password
			) {
				return res
					.status(400)
					.json({ message: "Missing required fields" });
			}

			const [existing] = await pool.query(
				"SELECT * FROM users WHERE email_address = ?",
				[email_address]
			);
			if (existing.length > 0) {
				return res
					.status(409)
					.json({ message: "Email already registered" });
			}

			const password_hash = await bcrypt.hash(password, 10);
			const now = new Date();
			const prefs = preferences
				? JSON.stringify(preferences)
				: JSON.stringify({});

			const [result] = await pool.query(
				`INSERT INTO users (
        user_name, first_name, last_name, email_address, email_verified,
        password_hash, password_changed_at, two_factor_enabled, two_factor_method,
        two_factor_secret, two_factor_backup, role, status, account_created_at,
        last_login_at, preferences
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					user_name,
					first_name,
					last_name,
					email_address,
					0,
					password_hash,
					now,
					0,
					null,
					null,
					JSON.stringify([]),
					"user",
					"pending",
					now,
					now,
					prefs,
				]
			);

			const userId = result.insertId;

			// Generate email verification token
			const emailTokenExpiration = parseInt(
				process.env.EMAIL_TOKEN_EXPIRATION || "86400",
				10
			);
			const emailToken = crypto.randomBytes(32).toString("hex");
			const expiresAt = new Date(
				Date.now() + emailTokenExpiration * 1000
			);

			await pool.query(
				`INSERT INTO user_tokens (user_id, token, type, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
				[userId, emailToken, "email_verification", now, expiresAt]
			);

			// Send email
			const verificationLink = `http://akos.local:3030/auth/verify?token=${emailToken}`;
			await sendEmail(
				email_address,
				"Verify your email",
				`
      <h1>Email Verification</h1>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationLink}">${verificationLink}</a>
    `
			);

			res.status(201).json({
				message:
					"User registered successfully. Please check your email to verify your account.",
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
			console.error(err);
			res.status(500).json({ error: "Internal Server Error" });
		}
	},

	async verify(req, res) {
		const { token } = req.query;

		try {
			const [rows] = await pool.query(
				`SELECT user_id, expires_at FROM user_tokens WHERE token = ? AND type = 'email_verification'`,
				[token]
			);

			if (rows.length === 0)
				return res
					.status(400)
					.json({ message: "Invalid or expired token" });

			const { user_id, expires_at } = rows[0];
			if (new Date() > expires_at)
				return res.status(400).json({ message: "Token expired" });

			await pool.query(
				`UPDATE users SET email_verified = 1, status = 'active' WHERE id = ?`,
				[user_id]
			);
			await pool.query(`DELETE FROM user_tokens WHERE token = ?`, [
				token,
			]);

			// Generate API token after verification
			const apiTokenExpiration = parseInt(
				process.env.API_TOKEN_EXPIRATION || "3600",
				10
			);
			const apiToken = jwt.sign({ id: user_id }, process.env.JWT_SECRET, {
				expiresIn: `${apiTokenExpiration}s`,
			});
			const now = new Date();
			const expiresAt = new Date(
				now.getTime() + apiTokenExpiration * 1000
			);

			await pool.query(
				`INSERT INTO user_tokens (user_id, token, type, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
				[user_id, apiToken, "api_access", now, expiresAt]
			);

			res.json({
				message: "Email verified successfully",
				token: apiToken,
			});
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	},
};
