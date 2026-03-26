import { ChordModel } from "../models/chordModel.js";
import UserModel from "../models/userModel.js";

export const ChordController = {
	async getAll(req, res) {
		try {
			// Parse optional fields to display value instead of id (notation, grip, tuning)
			let fields = {};
			try { fields = req.query.fields ? JSON.parse(req.query.fields) : {}; }
			catch { fields = {}; }
	  
			const rows = await ChordModel.findAll({ fields });
			return res.json(rows);
		  } catch (err) { return res.status(500).json({ error: err.message }); }
	},
	
	async getById(req, res) {
		try {
			const { id } = req.params;

			// Validate id
			//if (!id || isNaN(id)) { return res.status(400).json({ message: "Invalid ID format" }); }

			// Parse optional fields to display value instead of id (notation, grip, tuning)
			let fields = {};
			try { fields = req.query.fields ? JSON.parse(req.query.fields) : {}; }
			catch { fields = {}; }

			const row = await ChordModel.findById({ id: Number(id), fields });
			if (!row) { return res.status(404).json({ message: "Chord not found" }); }
			return res.json(row);
		} catch (err) {
			console.error("Error fetching chord by ID:", err);
			return res.status(500).json({ error: err.message });
		}
	},

	async getBySelector(req, res) {
	try {
		const { selector, selectorValue, tuningValue } = req.params;

		// Basic validation
		//if (!["notation", "grip"].includes(selector)) { return res.status(400).json({ message: "Selector must be either 'notation' or 'grip'." }); }
		//if (!selectorValue || !tuningValue) { return res.status(400).json({ message: "Both selectorValue and tuningValue are required." }); }

		const rows = await ChordModel.findBySelector({ selector, selectorValue, tuningValue });

		// 200 with an array (can be empty)
		return res.json(rows);
		} catch (err) {
			const status = err.status || 500;
			console.error("Error fetching chords:", err);
			return res.status(status).json({ error: err.message });
		}
	},

	async getUserChords(req, res) {
		try {
			// Extract Bearer token
			const token = req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null;

			// Find user by access token
			const user = await UserModel.findByAccessToken(token);
			//if (!user) { return res.status(401).json({ error: "Unauthorized: invalid token" }); }
			const userId = user.user_id ?? user.id;

			// Fetch chords for current user
			const chords = await ChordModel.findUserChords(userId);

			return res.status(200).json(chords);
		} catch (err) {
			console.error("[getUserChords] error:", err);
			return res.status(500).json({ error: "Internal Server Error" });
		}
	},

	async create(req, res) {
		const { notation, tuning, grip } = req.body ?? {};
		const user = await UserModel.findByAccessToken(req.headers.authorization.split(' ')[1]);
		console.log("User ID:", user.user_id);
		try {
			const result = await ChordModel.create({ notation: notation.trim(), tuning: tuning.trim(), grip: grip.trim() });
			if(user.role == "user") {
				await ChordModel.insertUserChordRelation(user.user_id, result.id);
			}
			return res.status(201).json(result);
		} catch (err) {
			if(err && err.code === 'ER_DUP_ENTRY') {
				if(user.role == "user") {
					const dup_entry = (await ChordModel.findBySelector({ selector: "notation", selectorValue: notation, tuningValue: tuning })).find(r => r.grip === grip);
					await ChordModel.insertUserChordRelation(user.user_id, dup_entry.id);
				}
				return res.status(409).json({ error: 'Chord with this notation, tuning and grip already exists'});
			}
			const status = err.status || 500;
			return res.status(status).json({ error: err.message });
		}
	},

	async remove(req, res) {
		try {
			const { id } = req.params;
			const chordId = Number(id);
			const current = await ChordModel.findById({ id: chordId });
			if (!current) { return res.status(404).json({ message: "Chord not found" }); }

			const token = req.headers.authorization?.split(" ")[1];
			const user = token ? await UserModel.findByAccessToken(token) : null;
			const userId = user.user_id ?? user.id;

			if (user.role === "admin") {
				await ChordModel.remove(chordId);
				return res.status(204).send();
			} else {
				await ChordModel.removeUserChordRelation(userId, chordId);
				return res.status(204).send();
			}
		} catch (err) {
			const status = err.status ?? 500;
			return res.status(status).json({ error: err.message });
		}
	},

	async patch(req, res) {
		try {
			const { id } = req.params;
			const chordId = Number(id);
			//if (!Number.isFinite(chordId)) { return res.status(400).json({ message: "Invalid ID format" }); }

			const body = req.body ?? {};
			const allowedKeys = ["notation", "tuning", "grip"];
			const payload = Object.fromEntries(Object.entries(body).filter(([k, v]) => allowedKeys.includes(k) && typeof v === "string"));

			/*
			if (Object.keys(payload).length === 0) { return res.status(400).json({ error: "Provide at least one of: notation, tuning, grip" }); }

			if (payload.notation != null) payload.notation = String(payload.notation).replace(/\r/g, "").trim();
			if (payload.tuning != null)   payload.tuning   = String(payload.tuning).toLowerCase().trim();
			if (payload.grip != null)     payload.grip     = String(payload.grip).trim();

			if (payload.notation != null && payload.notation.length === 0) {
			return res.status(400).json({ error: "notation cannot be empty" });
			}
			if (payload.tuning != null && payload.tuning.length === 0) {
			return res.status(400).json({ error: "tuning cannot be empty" });
			}
			if (payload.grip != null && payload.grip.length === 0) {
			return res.status(400).json({ error: "grip cannot be empty" });
			}
			if (payload.notation && payload.notation.length > 16) {
			return res.status(400).json({ error: "notation must be at most 16 characters" });
			}
			if (payload.tuning && payload.tuning.length > 8) {
			return res.status(400).json({ error: "tuning must be at most 8 characters" });
			}
			if (payload.grip && payload.grip.length > 8) {
			return res.status(400).json({ error: "grip must be at most 8 characters" });
			}
			*/

			// 1) Ensure chord with :id exists (values, not FKs)
			const current = await ChordModel.findById({ id: chordId });
			if (!current) { return res.status(404).json({ message: "Chord not found" }); }

			// Compute target values after patch
			const target = {
				notation: payload.notation ?? current.notation,
				tuning:   payload.tuning   ?? current.tuning,
				grip:     payload.grip     ?? current.grip,
			};

			// Optional short‑circuit if nothing changes
			// if (target.notation === current.notation && target.tuning === current.tuning && target.grip === current.grip) {
			//   return res.status(200).json(current);
			// }

			// 3) Duplicate check using findBySelector (like your create() flow)
			const rows = await ChordModel.findBySelector({ selector: "notation", selectorValue: target.notation, tuningValue: target.tuning });

			const duplicate = rows.find(r => r.grip === target.grip && r.id !== chordId);
			if (duplicate) {
				return res.status(409).json({ error: "Another chord already exists with this notation, tuning, and grip" });
			}

			// Persist (human‑readable only)
			const updated = await ChordModel.patch(chordId, payload);
			return res.status(200).json(updated);
		} catch (err) {
			const status = err.status ?? 500;
			return res.status(status).json({ error: err.message });
		}
	},
};