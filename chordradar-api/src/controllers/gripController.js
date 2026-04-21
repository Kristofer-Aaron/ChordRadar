import { GripModel } from "../models/gripModel.js";

export const GripController = {
	async getAll(req, res) {
		try {
			const data = await GripModel.findAll();
			res.json(data);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	},

	async getById(req, res) {
		try {
			const data = await GripModel.findById(req.params.id);
			if (!data)
				return res.status(404).json({ message: "Grip not found" });
			res.json(data);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	},

	async create(req, res) {
		try {
			const payload = req.validated?.body ?? req.validated ?? req.body;
			const newGrip = await GripModel.create(payload);
			res.status(201).json(newGrip);
		} catch (err) {
			if(err && err.code === 'ER_DUP_ENTRY') {
				return res.status(409).json({ error: 'Grip with this value already exists'});
			}
			res.status(500).json({ error: err.message });
		}
	},

	async update(req, res) {
		const grip = await GripModel.findById(req.params.id);
		if(!grip) {
			return res.status(404).json({ error: 'No grip with the given id was found' });
		}
		try {
			const payload = req.validated?.body ?? req.validated ?? req.body;
			const updated = await GripModel.update(req.params.id, payload);
			res.json(updated);
		} catch (err) {
			if(err && err.code === 'ER_DUP_ENTRY') {
				return res.status(409).json({ error: 'Grip with this value already exists'})
			}
			res.status(500).json({ error: err.message });
		}
	},

	async remove(req, res) {
		const grip = await GripModel.findById(req.params.id);
		if(!grip) {
			return res.status(404).json({ error: 'No grip with the given id was found' });
		}
		try {
			const deleted = await GripModel.remove(req.params.id);
			res.json(deleted);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	},
};