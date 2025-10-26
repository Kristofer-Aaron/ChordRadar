import pool from '../config/db.js';

export const GripModel = {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM grip');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM grip WHERE id = ?', [id]);
    return rows[0];
  },

  async create(data) {
    const { strings } = data;
    const [result] = await pool.query('INSERT INTO grip (strings) VALUES (?)', [strings]);
    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const { strings } = data;
    await pool.query('UPDATE grip SET strings = ? WHERE id = ?', [strings, id]);
    return this.findById(id);
  },

  async remove(id) {
    await pool.query('DELETE FROM grip WHERE id = ?', [id]);
    return { message: 'Grip deleted' };
  }
};