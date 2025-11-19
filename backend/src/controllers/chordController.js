import { ChordModel } from '../models/chordModel.js';
import { chordSchema } from '../schemas/chordSchema.js';

export const ChordController = {
  async getAll(req, res) {
    try {
      const data = await ChordModel.findAll();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const data = await ChordModel.findById(req.params.id);
      if (!data) return res.status(404).json({ message: 'Chord not found' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    const { error, value } = chordSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    try {
      const newChord = await ChordModel.create(value);
      res.status(201).json(newChord);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  async update(req, res) {
    const { error, value } = chordSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    try {
      const updated = await ChordModel.update(req.params.id, value);
      res.json(updated);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

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
      const updated = await ChordModel.partialUpdate(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
};