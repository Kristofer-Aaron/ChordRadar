import { NotationModel } from "../models/notationModel.js";
import { notationSchema } from "../schemas/notationSchema.js";

export const NotationController = {
  async getAll(req, res) {
    try {
      const data = await NotationModel.findAll();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const data = await NotationModel.findById(req.params.id);
      if (!data)
        return res.status(404).json({ message: "Notation not found" });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    const { error, value } = notationSchema.validate(req.body);
    if (error)
      return res.status(400).json({ error: error.details[0].message });

    try {
      const newNotation = await NotationModel.create(value);
      res.status(201).json(newNotation);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    const { error, value } = notationSchema.validate(req.body);
    if (error)
      return res.status(400).json({ error: error.details[0].message });

    try {
      const updated = await NotationModel.update(req.params.id, value);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const deleted = await NotationModel.remove(req.params.id);
      res.json(deleted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};