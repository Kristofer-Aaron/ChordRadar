import { GripModel } from '../models/gripModel.js';
import { gripSchema } from '../schemas/gripSchema.js';

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
      if (!data) return res.status(404).json({ message: 'Grip not found' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    const { error, value } = gripSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    try {
      const newGrip = await GripModel.create(value);
      res.status(201).json(newGrip);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    const { error, value } = gripSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    try {
      const updated = await GripModel.update(req.params.id, value);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const deleted = await GripModel.remove(req.params.id);
      res.json(deleted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};