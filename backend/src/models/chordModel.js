import pool from '../config/db.js';

export const ChordModel = {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM chords');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM chords WHERE id = ?', [id]);
    return rows[0];
  },

  async create(data) {
    const { name, tuning_id, grip_id } = data;

    const [existing] = await pool.query(
        'SELECT * FROM chords WHERE name = ? AND tuning_id = ? AND grip_id = ?',
        [name, tuning_id, grip_id]
    );

    if (existing.length > 0) {
      const error = new Error('Chord already exists with this name, tuning, and grip');
      error.status = 409; // HTTP 409 Conflict
      throw error;
    }

    const [result] = await pool.query(
      'INSERT INTO chords (name, tuning_id, grip_id) VALUES (?, ?, ?)',
      [name, tuning_id, grip_id]
    );
    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const { name, tuning_id, grip_id } = data;

    const [existing] = await pool.query(
        'SELECT * FROM chords WHERE name = ? AND tuning_id = ? AND grip_id = ? AND id != ?',
        [name, tuning_id, grip_id, id]
        );

        if (existing.length > 0) {
      const error = new Error('Another chord already exists with this name, tuning, and grip');
      error.status = 409;
      throw error;
    }

    await pool.query(
      'UPDATE chords SET name = ?, tuning_id = ?, grip_id = ? WHERE id = ?',
      [name, tuning_id, grip_id, id]
    );
    return this.findById(id);
  },

  async remove(id) {
    await pool.query('DELETE FROM chords WHERE id = ?', [id]);
    return { message: 'Chord deleted' };
  },

   async patch(id, data) {
    // Get current chord
    const chord = await this.findById(id);
    if (!chord) throw new Error('Chord not found');

    // Merge existing fields with new ones
    const updated = {
      name: data.name ?? chord.name,
      tuning_id: data.tuning_id ?? chord.tuning_id,
      grip_id: data.grip_id ?? chord.grip_id
    };

    const [existing] = await pool.query(
      'SELECT * FROM chords WHERE name = ? AND tuning_id = ? AND grip_id = ? AND id != ?',
      [updated.name, updated.tuning_id, updated.grip_id, id]
    );

    if (existing.length > 0) {
      const error = new Error('Another chord already exists with this name, tuning, and grip');
      error.status = 409;
      throw error;
    }

    await pool.query(
      'UPDATE chords SET name = ?, tuning_id = ?, grip_id = ? WHERE id = ?',
      [updated.name, updated.tuning_id, updated.grip_id, id]
    );

        return this.findById(id);
  }
};
