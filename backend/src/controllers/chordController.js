import pool from '../config/db.js';
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
  const { name, tuning, grip } = req.body;

  try {
    let [[tuningRow]] = await pool.query('SELECT id FROM tunings WHERE value = ?', [tuning]);
    if (!tuningRow) {
      const [tuningResult] = await pool.query('INSERT INTO tunings (value) VALUES (?)', [tuning]);
      tuningRow = { id: tuningResult.insertId };
    }

    let [[gripRow]] = await pool.query('SELECT id FROM grips WHERE strings = ?', [grip]);
    if (!gripRow) {
      const [gripResult] = await pool.query('INSERT INTO grips (strings) VALUES (?)', [grip]);
      gripRow = { id: gripResult.insertId };
    }

    const [chordResult] = await pool.query(
      'INSERT INTO chords (name, tuning_id, grip_id) VALUES (?, ?, ?)',
      [name, tuningRow.id, gripRow.id]
    );

    res.status(201).json({
      id: chordResult.insertId,
      name,
      tuning_id: tuningRow.id,
      grip_id: gripRow.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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