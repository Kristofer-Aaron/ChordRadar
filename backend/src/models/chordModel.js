import pool from "../config/db.js";

export const ChordModel = {
  async findAll({ fields = {} } = {}) {
    const notationField = fields.notation === "value" ? "notations.value AS notation" : "chords.notation_id AS notation_id";
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
    const notationField = fields.notation === "value" ? "notations.value AS notation" : "chords.notation_id AS notation_id";
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
    const select = `SELECT chords.id, notations.value AS notation, tunings.value AS tuning, grips.strings AS grip FROM chords
                    JOIN notations ON chords.notation_id = notations.id
                    JOIN tunings   ON chords.tuning_id   = tunings.id
                    JOIN grips     ON chords.grip_id     = grips.id
                    WHERE LOWER(tunings.value) = LOWER(?)`;

    const params = [tuningValue];

    // Add selector-specific predicate
    let where = "";
    if (selector === "notation") {
      where = `AND notations.value = ?`;
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

  async findUserChords(user_id) {
    const [rows] = await pool.query(
      `SELECT c.id,
              n.value   AS notation,
              t.value   AS tuning,
              g.strings AS grip
        FROM user_chord_relations ucr
        JOIN chords    c ON c.id = ucr.chord_id
        JOIN notations n ON n.id = c.notation_id
        JOIN tunings   t ON t.id = c.tuning_id
        JOIN grips     g ON g.id = c.grip_id
        WHERE ucr.user_id = ?
        ORDER BY n.value, t.value, g.strings`,
      [user_id]
    );
    
    return rows;
  },

  async create({ notation, tuning, grip }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const normNotation = String(notation).replace(/\r/g, "").trim();
      const normTuning   = String(tuning).toLowerCase().trim();
      const normGrip     = String(grip).trim();
      
      // Upsert foreigns (safe & idempotent)
      const [nRes] = await conn.query("INSERT INTO notations (value) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
        [normNotation]);
      const notation_id = nRes.insertId;

      const [tRes] = await conn.query("INSERT INTO tunings (value) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
        [normTuning]);
      const tuning_id = tRes.insertId;

      const [gRes] = await conn.query("INSERT INTO grips (strings) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
        [normGrip]);
      const grip_id = gRes.insertId;

      // Plain INSERT so duplicates throw ER_DUP_ENTRY
      const [cRes] = await conn.query("INSERT INTO chords (notation_id, tuning_id, grip_id) VALUES (?, ?, ?)",
        [notation_id, tuning_id, grip_id]);

      await conn.commit();
      return { id: cRes.insertId, notation_id, tuning_id, grip_id };
    } catch (err) {
      await conn.rollback();
      /*
      if (err && err.code === "ER_DUP_ENTRY") {
        // Translate into a proper HTTP 409
        err.status = 409;
        err.message = "Chord already exists with this notation, tuning, and grip";
      }
      */
      throw err;
    } finally {
      conn.release();
    }
  },

  async insertUserChordRelation(user_id, chord_id) {
    const [result] = await pool.query(`INSERT IGNORE INTO user_chord_relations (user_id, chord_id) VALUES (?, ?)`,
      [user_id, chord_id]);

    const created = result.affectedRows === 1;

    return { user_id, chord_id, created };
  },

  async update(id, data) {
    const { notation_id, tuning_id, grip_id } = data;

    const [existing] = await pool.query("SELECT * FROM chords WHERE notation_id = ? AND tuning_id = ? AND grip_id = ? AND id != ?",
      [notation_id, tuning_id, grip_id, id]);

    if (existing.length > 0) {
      const error = new Error("Another chord already exists with this notation, tuning, and grip");
      error.status = 409;
      throw error;
    }

    await pool.query("UPDATE chords SET notation_id = ?, tuning_id = ?, grip_id = ? WHERE id = ?",
      [notation_id, tuning_id, grip_id, id]);
    return this.findById(id);
  },

  async remove(id) {
    await pool.query("DELETE FROM chords WHERE id = ?", [id]);
    return { message: "Chord deleted" };
  },

  async removeUserChordRelation(user_id, chord_id) {
    const [result] = await pool.query(
      `DELETE FROM user_chord_relations WHERE user_id = ? AND chord_id = ?`,
      [user_id, chord_id]
    );
    return { user_id, chord_id, removed: result.affectedRows > 0 };
  },

  async patch(id, data) {
    const chordId = Number(id);

    const wantsNotation = Object.prototype.hasOwnProperty.call(data, "notation");
    const wantsTuning   = Object.prototype.hasOwnProperty.call(data, "tuning");
    const wantsGrip     = Object.prototype.hasOwnProperty.call(data, "grip");

    if (!wantsNotation && !wantsTuning && !wantsGrip) {
      const e = new Error("Provide at least one of: notation, tuning, grip");
      e.status = 400;
      throw e;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1) Load current FK ids for the chord
      const [rows] = await conn.query(
        "SELECT notation_id, tuning_id, grip_id FROM chords WHERE id = ? LIMIT 1",
        [chordId]
      );
      const current = rows?.[0];
      if (!current) {
        const e = new Error("Chord not found");
        e.status = 404;
        throw e;
      }

      // 2) Resolve target FK ids from *human-readable* values (or keep current)
      let targetNotationId = current.notation_id;
      let targetTuningId   = current.tuning_id;
      let targetGripId     = current.grip_id;

      // Helper: upsert-by-value and return id (same approach used in create())
      const ensureIdByValue = async (table, column, value) => {
        const v = String(value).trim();
        // Idempotent upsert: duplicates set LAST_INSERT_ID to existing id
        const [res] = await conn.query(
          `INSERT INTO ${table} (${column})
          VALUES (?)
          ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
          [v]
        );
        return res.insertId; // existing id if dup, new id if inserted
      };

      if (wantsNotation) {
        const norm = String(data.notation ?? "").replace(/\r/g, "").trim();
        if (!norm) {
          const e = new Error("notation cannot be empty");
          e.status = 400;
          throw e;
        }
        targetNotationId = await ensureIdByValue("notations", "value", norm);
      }

      if (wantsTuning) {
        const norm = String(data.tuning ?? "").toLowerCase().trim();
        if (!norm) {
          const e = new Error("tuning cannot be empty");
          e.status = 400;
          throw e;
        }
        targetTuningId = await ensureIdByValue("tunings", "value", norm);
      }

      if (wantsGrip) {
        const norm = String(data.grip ?? "").trim();
        if (!norm) {
          const e = new Error("grip cannot be empty");
          e.status = 400;
          throw e;
        }
        targetGripId = await ensureIdByValue("grips", "strings", norm);
      }

      // 3) Attempt update only if something changed
      const changed =
        targetNotationId !== current.notation_id ||
        targetTuningId   !== current.tuning_id ||
        targetGripId     !== current.grip_id;

      if (changed) {
        await conn.query(
          "UPDATE chords SET notation_id = ?, tuning_id = ?, grip_id = ? WHERE id = ?",
          [targetNotationId, targetTuningId, targetGripId, chordId]
        );
      }

      // 4) Return the updated chord with readable values
      const [[updated]] = await conn.query(
        `SELECT c.id,
                n.value   AS notation,
                t.value   AS tuning,
                g.strings AS grip,
                c.notation_id, c.tuning_id, c.grip_id
          FROM chords c
          JOIN notations n ON c.notation_id = n.id
          JOIN tunings   t ON c.tuning_id   = t.id
          JOIN grips     g ON c.grip_id     = g.id
          WHERE c.id = ?
          LIMIT 1`,
        [chordId]
      );

      await conn.commit();
      return updated;
    } catch (err) {
      await conn.rollback();

      // Gracefully map DB uniqueness violation to HTTP 409
      if (err && err.code === "ER_DUP_ENTRY") {
        const e = new Error("Another chord already exists with this notation, tuning, and grip");
        e.status = 409;
        throw e;
      }

      throw err;
    } finally {
      conn.release();
    }
  },
};