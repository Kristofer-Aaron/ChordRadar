import { TuningModel } from "../models/tuningModel.js";
import { TuningSchema } from "../schemas/tuningSchema.js";

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
		try {
			const newTuning = await TuningModel.create(req.validated);
			res.status(201).json(newTuning);
		} catch (err) {
			if(err && err.code === 'ER_DUP_ENTRY') {
				return res.status(409).json({ error: 'Tuning with this value already exists'});
			}
			res.status(500).json({ error: err.message });
		}
	},

	async update(req, res) {
		const tuning = await TuningModel.findById(req.params.id);
		if(!tuning) {
			return res.status(404).json({ error: 'No tuning with the given id was found' });
		}
		try {
			const updated = await TuningModel.update(req.params.id, req.validated);
			res.json(updated);
		} catch (err) {
			if(err && err.code === 'ER_DUP_ENTRY') {
				return res.status(409).json({ error: 'Tuning with this value already exists'});
			}
			res.status(500).json({ error: err.message });
		}
	},

	async remove(req, res) {
		const tuning = await TuningModel.findById(req.params.id);
		if(!tuning) {
			return res.status(404).json({ error: 'No tuning with the given id was found' });
		}
		try {
			const deleted = await TuningModel.remove(req.params.id);
			res.json(deleted);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	},
};
