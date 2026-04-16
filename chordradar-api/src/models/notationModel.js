import pool from "../config/db.js";

export const NotationModel = {
  async findAll() {
    const [rows] = await pool.query("SELECT * FROM notations");
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM notations WHERE id = ?", [
      id,
    ]);
    return rows[0];
  },

  async create(data) {
    const { value } = data;
    const [result] = await pool.query("INSERT INTO notations (value) VALUES (?)",
    [value]);
    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const { value } = data;
    await pool.query("UPDATE notations SET value = ? WHERE id = ?", [
      value,
      id,
    ]);
    return this.findById(id);
  },

  async remove(id) {
    await pool.query("DELETE FROM notations WHERE id = ?", [id]);
    return { message: "Notation deleted" };
  },
};