import pool from '../config/db.js';

export const TuningModel = {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM tuning');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tuning WHERE id = ?', [id]);
    return rows[0];
  },

  async create(data) {
    const { value } = data;
    const [result] = await pool.query('INSERT INTO tuning (value) VALUES (?)', [value]);
    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const { value } = data;
    await pool.query('UPDATE tuning SET value = ? WHERE id = ?', [value, id]);
    return this.findById(id);
  },

  async remove(id) {
    await pool.query('DELETE FROM tuning WHERE id = ?', [id]);
    return { message: 'Tuning deleted' };
  }
};