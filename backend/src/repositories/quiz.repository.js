const { query } = require('../config/db.js');

// only subjects that have a live set with at least one active question
async function findSubjects(classLevel) {
  const { rows } = await query(
    `SELECT s.slug, s.name FROM subjects s
      WHERE EXISTS (SELECT 1 FROM quiz_sets qs
                      JOIN questions q ON q.quiz_set_id = qs.id AND q.is_active
                     WHERE qs.subject_id = s.id AND qs.class_level = $1 AND qs.is_active)
      ORDER BY s.id`,
    [classLevel]
  );
  return rows;
}

async function findSets(classLevel, subject) {
  const { rows } = await query(
    `SELECT qs.year, count(q.id)::int AS count
       FROM quiz_sets qs
       JOIN subjects s ON s.id = qs.subject_id AND s.slug = $2
       JOIN questions q ON q.quiz_set_id = qs.id AND q.is_active
      WHERE qs.class_level = $1 AND qs.is_active
      GROUP BY qs.year ORDER BY qs.year DESC`,
    [classLevel, subject]
  );
  return rows;
}

async function findQuestions({ classLevel, subject, years }) {
  const { rows } = await query(
    `SELECT q.id, qs.year, q.source_number, q.body, q.options, q.correct_index, q.explanation,
            s.name AS subject_name, g.slug AS group_slug, g.name AS group_name, g.short_name AS group_short
       FROM quiz_sets qs
       JOIN subjects s ON s.id = qs.subject_id AND s.slug = $2
       JOIN questions q ON q.quiz_set_id = qs.id AND q.is_active
       LEFT JOIN paper_groups g ON g.id = q.group_id
      WHERE qs.class_level = $1 AND qs.is_active
        AND ($3::int[] IS NULL OR qs.year = ANY($3::int[]))
      ORDER BY qs.year DESC, q.position`,
    [classLevel, subject, years.length ? years : null]
  );
  return rows;
}

module.exports = { findSubjects, findSets, findQuestions };