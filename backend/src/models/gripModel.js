import pool from '../config/db.js';

export const GripModel = {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM grips');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM grips WHERE id = ?', [id]);
    return rows[0];
  },

  async create(data) {
    const { strings } = data;
    const [result] = await pool.query('INSERT INTO grips (strings) VALUES (?)', [strings]);
    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const { strings } = data;
    await pool.query('UPDATE grips SET strings = ? WHERE id = ?', [strings, id]);
    return this.findById(id);
  },

  async remove(id) {
    await pool.query('DELETE FROM grips WHERE id = ?', [id]);
    return { message: 'Grip deleted' };
  }
};