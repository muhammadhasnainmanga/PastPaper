const { query } = require('../config/db.js');

async function findByClass(classLevel) {
  const { rows } = await query(
    `SELECT id, title, class_level, size_bytes, cover_key
       FROM books WHERE class_level = $1 AND is_active
      ORDER BY sort_order, title`,
    [classLevel]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await query(
    `SELECT id, title, class_level, size_bytes, storage_key, cover_key
       FROM books WHERE id = $1 AND is_active`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { findByClass, findById };