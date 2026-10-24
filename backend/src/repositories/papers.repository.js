const { query } = require('../config/db.js');

// years that actually have papers for a class (used when the student picks "All years")
async function findYears(classLevel) {
  const { rows } = await query(
    'SELECT DISTINCT year FROM papers WHERE class_level = $1 AND is_active ORDER BY year DESC',
    [classLevel]
  );
  return rows.map((r) => r.year);
}

// every subject in the stream x every year, with the papers that exist (nulls where they do not).
// A subject-year can hold several papers (one per group), and all of them are returned.
async function findGrid({ streamSlug, classLevel, subjects, years }) {
  const { rows } = await query(
    `SELECT su.slug AS subject, y.year, p.type, p.id, p.size_bytes,
            g.slug AS group_slug, g.name AS group_name, g.short_name AS group_short
       FROM streams st
       JOIN stream_subjects ss ON ss.stream_id = st.id AND ss.class_level = $2
       JOIN subjects su ON su.id = ss.subject_id
       CROSS JOIN unnest($4::int[]) AS y(year)
       LEFT JOIN papers p ON p.subject_id = su.id AND p.class_level = ss.class_level
                         AND p.year = y.year AND p.is_active
       LEFT JOIN paper_groups g ON g.id = p.group_id
      WHERE st.slug = $1
        AND ($3::text[] IS NULL OR su.slug = ANY($3::text[]))
      ORDER BY ss.sort_order, y.year DESC, g.id NULLS FIRST`,
    [streamSlug, classLevel, subjects.length ? subjects : null, years]
  );
  return rows;
}

async function findFileById(id) {
  const { rows } = await query(
    `SELECT p.id, p.storage_key, p.type, p.year, p.class_level, s.name AS subject_name
       FROM papers p JOIN subjects s ON s.id = p.subject_id
      WHERE p.id = $1 AND p.is_active`,
    [id]
  );
  return rows[0] || null;
}

async function findFilesByIds(ids) {
  const { rows } = await query(
    `SELECT p.id, p.storage_key, p.type, p.year, p.class_level, s.name AS subject_name
       FROM papers p JOIN subjects s ON s.id = p.subject_id
      WHERE p.id = ANY($1::uuid[]) AND p.is_active
      ORDER BY s.name, p.year DESC, p.type`,
    [ids]
  );
  return rows;
}

module.exports = { findYears, findGrid, findFileById, findFilesByIds };