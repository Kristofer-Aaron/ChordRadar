import { TuningModel } from "../models/tuningModel.js";
import { tuningSchema } from "../schemas/tuningSchema.js";

export const TuningController = {
	async getAll(req, res) {
		try {
			const data = await TuningModel.findAll();
			res.json(data);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	},

	async getById(req, res) {
		try {
			const data = await TuningModel.findById(req.params.id);
			if (!data)
				return res.status(404).json({ message: "Tuning not found" });
			res.json(data);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	},

	async create(req, res) {
		const { error, value } = tuningSchema.validate(req.body);
		if (error)
			return res.status(400).json({ error: error.details[0].message });

		try {
			const newTuning = await TuningModel.create(value);
			res.status(201).json(newTuning);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	},

	async update(req, res) {
		const { error, value } = tuningSchema.validate(req.body);
		if (error)
			return res.status(400).json({ error: error.details[0].message });

		try {
			const updated = await TuningModel.update(req.params.id, value);
			res.json(updated);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	},

	async remove(req, res) {
		try {
			const deleted = await TuningModel.remove(req.params.id);
			res.json(deleted);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	},
};
