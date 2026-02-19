import pool from "../config/db.js";

export const ChordModel = {
  async findAll({ fields = {} } = {}) {
    const notationField = fields.notation === "value" ? "TRIM(REPLACE(notations.value, '\r', '')) AS notation" : "chords.notation_id AS notation_id";
    const tuningField = fields.tuning === "value" ? "tunings.value AS tuning" : "tunings.id AS tuning_id";
    const gripField = fields.grip === "value" ? "grips.strings AS grip" : "grips.id AS grip_id";

    const query = `SELECT chords.id, ${notationField}, ${tuningField}, ${gripField} FROM chords
                   JOIN notations ON chords.notation_id = notations.id
                   JOIN tunings   ON chords.tuning_id   = tunings.id
                   JOIN grips     ON chords.grip_id     = grips.id`;

    const [rows] = await pool.query(query);
    return rows;
  },

  async findById({id, fields = {} }) {
    const notationField = fields.notation === "value" ? "TRIM(REPLACE(notations.value, '\r', '')) AS notation" : "chords.notation_id AS notation_id";
    const tuningField = fields.tuning === "value" ? "tunings.value AS tuning" : "tunings.id AS tuning_id";
    const gripField = fields.grip === "value" ? "grips.strings AS grip" : "grips.id AS grip_id";

    const query = `SELECT chords.id, ${notationField}, ${tuningField}, ${gripField} FROM chords
                  JOIN notations ON chords.notation_id = notations.id
                  JOIN tunings   ON chords.tuning_id   = tunings.id
                  JOIN grips     ON chords.grip_id     = grips.id
                  WHERE chords.id = ?`;

    const [rows] = await pool.query(query, [id]);
    return rows[0] ?? null;
  },
  
  async findBySelector({ selector, selectorValue, tuningValue }) {
    const select = `SELECT chords.id, TRIM(REPLACE(notations.value, '\r', '')) AS notation, tunings.value AS tuning, grips.strings AS grip FROM chords
                    JOIN notations ON chords.notation_id = notations.id
                    JOIN tunings   ON chords.tuning_id   = tunings.id
                    JOIN grips     ON chords.grip_id     = grips.id
                    WHERE LOWER(tunings.value) = LOWER(?)`;

    const params = [tuningValue];

    // Add selector-specific predicate
    let where = "";
    if (selector === "notation") {
      where = `AND LOWER(TRIM(REPLACE(notations.value, '\r', ''))) = LOWER(TRIM(REPLACE(?, '\r', '')))`;
      params.push(selectorValue);
    } else if (selector === "grip") {
      where = ` AND grips.strings = ? `;
      params.push(selectorValue);
    } else {
      throw Object.assign(new Error("Invalid selector"), { status: 400 });
    }

    const query = `${select} ${where}`;
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async create(notation, tuning, grip) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // insert or reuse existing notation, and capture its id using LAST_INSERT_ID
      const [nRes] = await conn.query(
        "INSERT INTO notations (value) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
        [notation]
      );
      const notation_id = nRes.insertId;

      // tuning
      const [tRes] = await conn.query(
        "INSERT INTO tunings (value) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
        [tuning]
      );
      const tuning_id = tRes.insertId;

      // grip
      const [gRes] = await conn.query(
        "INSERT INTO grips (strings) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
        [grip]
      );
      const grip_id = gRes.insertId;

      // chord (deduplicated by the composite unique key)
      const [cRes] = await conn.query(
        "INSERT INTO chords (notation_id, tuning_id, grip_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
        [notation_id, tuning_id, grip_id]
      );
      const chordId = cRes.insertId;

      await conn.commit();
      return { id: chordId, notation_id, tuning_id, grip_id };
    } catch (err) {
      await conn.rollback();
      // If you use plain INSERT (without ON DUPLICATE) for the chord step,
      // handle duplicates like this:
      if (err.code === "ER_DUP_ENTRY") {
        err.status = 409;
        err.message =
          "Chord already exists with this notation, tuning, and grip";
      }
      throw err;
    } finally {
      conn.release();
    }
  },

  async update(id, data) {
    const { notation_id, tuning_id, grip_id } = data;

    const [existing] = await pool.query(
      "SELECT * FROM chords WHERE notation_id = ? AND tuning_id = ? AND grip_id = ? AND id != ?",
      [notation_id, tuning_id, grip_id, id]
    );

    if (existing.length > 0) {
      const error = new Error(
        "Another chord already exists with this notation, tuning, and grip"
      );
      error.status = 409;
      throw error;
    }

    await pool.query(
      "UPDATE chords SET notation_id = ?, tuning_id = ?, grip_id = ? WHERE id = ?",
      [notation_id, tuning_id, grip_id, id]
    );
    return this.findById(id);
  },

  async remove(id) {
    await pool.query("DELETE FROM chords WHERE id = ?", [id]);
    return { message: "Chord deleted" };
  },

  async patch(id, data) {
    // Get current chord
    const chord = await this.findById(id);
    if (!chord) throw new Error("Chord not found");

    // Merge existing fields with new ones
    const updated = {
      notation_id: data.notation_id ?? chord.notation_id,
      tuning_id: data.tuning_id ?? chord.tuning_id,
      grip_id: data.grip_id ?? chord.grip_id,
    };

    const [existing] = await pool.query(
      "SELECT * FROM chords WHERE notation_id = ? AND tuning_id = ? AND grip_id = ? AND id != ?",
      [updated.notation_id, updated.tuning_id, updated.grip_id, id]
    );

    if (existing.length > 0) {
      const error = new Error(
        "Another chord already exists with this notation, tuning, and grip"
      );
      error.status = 409;
      throw error;
    }

    await pool.query(
      "UPDATE chords SET notation_id = ?, tuning_id = ?, grip_id = ? WHERE id = ?",
      [updated.notation_id, updated.tuning_id, updated.grip_id, id]
    );

    return this.findById(id);
  },
};