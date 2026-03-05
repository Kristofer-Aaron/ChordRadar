import pool from "../config/db.js";
import { ChordModel } from "../models/chordModel.js";
import UserModel from "../models/userModel.js";
import { chordSchema } from "../schemas/chordSchema.js";

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
			if (!id || isNaN(id)) { return res.status(400).json({ message: "Invalid ID format" }); }

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
		if (!["notation", "grip"].includes(selector)) {
			return res.status(400).json({ message: "Selector must be either 'notation' or 'grip'." });
		}
		if (!selectorValue || !tuningValue) {
			return res.status(400).json({ message: "Both selectorValue and tuningValue are required." });
		}

		const rows = await ChordModel.findBySelector({ selector, selectorValue, tuningValue });

		// 200 with an array (can be empty)
		return res.json(rows);
		} catch (err) {
			const status = err.status || 500;
			console.error("Error fetching chords:", err);
			return res.status(status).json({ error: err.message });
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

	/*
	async update(req, res) {
		const { error, value } = chordSchema.validate(req.body);
		if (error)
			return res.status(400).json({ error: error.details[0].message });
		const user = await UserModel.findByAccessToken(req.headers.authorization.split(' ')[1]);
		try {
			const updated = await ChordModel.update(req.params.id, value);
			res.json(updated);
		} catch (err) {
			res.status(err.status || 500).json({ error: err.message });
		}
	},
	*/

	async remove(req, res) {
		try {
			await ChordModel.remove(req.params.id);
			res.status(204).send();
		} catch (err) {
			res.status(err.status || 500).json({ error: err.message });
		}
	},

	async patch(req, res) {
		try {
			const updated = await ChordModel.patch(req.params.id, req.body);
			res.json(updated);
		} catch (err) {
			res.status(err.status || 500).json({ error: err.message });
		}
	},
};