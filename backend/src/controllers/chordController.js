import pool from "../config/db.js";
import { ChordModel } from "../models/chordModel.js";
import { chordSchema } from "../schemas/chordSchema.js";

export const ChordController = {
  async getAll(req, res) {
    try {
      let fields = {};
      try {
        fields = req.query.fields ? JSON.parse(req.query.fields) : {};
      } catch {
        fields = {};
      }

      const notationField =
        fields.notation === "value"
          ? "notations.value AS notation"
          : "chords.notation_id AS notation_id";

      const tuningField =
        fields.tuning === "value"
          ? "tunings.value AS tuning"
          : "tunings.id AS tuning_id";

      const gripField =
        fields.grip === "value"
          ? "grips.strings AS grip"
          : "grips.id AS grip_id";

      const query = `
        SELECT chords.id, ${notationField}, ${tuningField}, ${gripField}
        FROM chords
        JOIN notations ON chords.notation_id = notations.id
        JOIN tunings ON chords.tuning_id = tunings.id
        JOIN grips ON chords.grip_id = grips.id
      `;

      const [rows] = await pool.query(query);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      let fields = {};
      try {
        fields = req.query.fields ? JSON.parse(req.query.fields) : {};
      } catch {
        fields = {};
      }

      const notationField =
        fields.notation === "value"
          ? "notations.value AS notation"
          : "chords.notation_id AS notation_id";

      const tuningField =
        fields.tuning === "value"
          ? "tunings.value AS tuning"
          : "tunings.id AS tuning_id";

      const gripField =
        fields.grip === "value"
          ? "grips.strings AS grip"
          : "grips.id AS grip_id";

      const query = `
        SELECT chords.id, ${notationField}, ${tuningField}, ${gripField}
        FROM chords
        JOIN notations ON chords.notation_id = notations.id
        JOIN tunings ON chords.tuning_id = tunings.id
        JOIN grips ON chords.grip_id = grips.id
        WHERE chords.id = ?
      `;

      const [rows] = await pool.query(query, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ message: "Chord not found" });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error("Error fetching chord by ID:", err);
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    const { notation, tuning, grip } = req.body;

    try {
      // Find or create notation
      let [[notationRow]] = await pool.query(
        "SELECT id FROM notations WHERE value = ?",
        [notation]
      );
      if (!notationRow) {
        const [notationResult] = await pool.query(
          "INSERT INTO notations (value) VALUES (?)",
          [notation]
        );
        notationRow = { id: notationResult.insertId };
      }

      // Find or create tuning
      let [[tuningRow]] = await pool.query(
        "SELECT id FROM tunings WHERE value = ?",
        [tuning]
      );
      if (!tuningRow) {
        const [tuningResult] = await pool.query(
          "INSERT INTO tunings (value) VALUES (?)",
          [tuning]
        );
        tuningRow = { id: tuningResult.insertId };
      }

      // Find or create grip
      let [[gripRow]] = await pool.query(
        "SELECT id FROM grips WHERE strings = ?",
        [grip]
      );
      if (!gripRow) {
        const [gripResult] = await pool.query(
          "INSERT INTO grips (strings) VALUES (?)",
          [grip]
        );
        gripRow = { id: gripResult.insertId };
      }

      // Insert chord
      const [chordResult] = await pool.query(
        "INSERT INTO chords (notation_id, tuning_id, grip_id) VALUES (?, ?, ?)",
        [notationRow.id, tuningRow.id, gripRow.id]
      );

      res.status(201).json({
        id: chordResult.insertId,
        notation_id: notationRow.id,
        tuning_id: tuningRow.id,
        grip_id: gripRow.id,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    const { error, value } = chordSchema.validate(req.body);
    if (error)
      return res.status(400).json({ error: error.details[0].message });

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
      const updated = await ChordModel.patch(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },
};