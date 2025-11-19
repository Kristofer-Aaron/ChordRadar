import pool from '../config/db.js';

export const TuningModel = {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM tunings');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tunings WHERE id = ?', [id]);
    return rows[0];
  },

  async create(data) {
    const { value } = data;
    const [result] = await pool.query('INSERT INTO tunings (value) VALUES (?)', [value]);
    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const { value } = data;
    await pool.query('UPDATE tunings SET value = ? WHERE id = ?', [value, id]);
    return this.findById(id);
  },

  async remove(id) {
    await pool.query('DELETE FROM tunings WHERE id = ?', [id]);
    return { message: 'Tuning deleted' };
  }
};