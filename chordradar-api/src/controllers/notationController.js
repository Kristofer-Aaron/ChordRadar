import { NotationModel } from "../models/notationModel.js";

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
    try {
      const payload = req.validated?.body ?? req.validated ?? req.body;
      const newNotation = await NotationModel.create(payload);
      res.status(201).json(newNotation);
    } catch (err) {
      if(err && err.code === 'ER_DUP_ENTRY') {
				return res.status(409).json({ error: 'Notation with this value already exists'})
			}
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    const notation = await NotationModel.findById(req.params.id);
    if(!notation) {
      return res.status(404).json({ error: 'No notation with the given id was found' });
    }
    try {
      const payload = req.validated?.body ?? req.validated ?? req.body;
      const updated = await NotationModel.update(req.params.id, payload);
      res.json(updated);
    } catch (err) {
      if(err && err.code === 'ER_DUP_ENTRY') {
				return res.status(409).json({ error: 'Notation with this value already exists'})
			}
      res.status(500).json({ error: err.message });
    }
  },

  async remove(req, res) {
    const notation = await NotationModel.findById(req.params.id);
    if(!notation) {
      return res.status(404).json({ error: 'No notation with the given id was found' });
    }
    try {
      const deleted = await NotationModel.remove(req.params.id);
      res.json(deleted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};