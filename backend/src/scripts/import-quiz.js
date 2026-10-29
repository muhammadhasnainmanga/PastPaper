const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') }); // must run before the requires below

const { pool, query } = require('../config/db.js');

const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : null; };
const has = (n) => process.argv.includes(`--${n}`);
const apply = has('apply');
const allowDraft = has('allow-draft');   // pilot only: import files that are not marked "reviewed"
const activate = has('activate');        // make the sets live on the site
const DIR = arg('dir') || path.join(__dirname, '../../../quiz-data');

// 12_botany_2025_objective.json  or  11_english_2025_science-general_objective.json  (the _objective part is optional)
const NAME = /^(11|12)_([a-z-]+)_(\d{4})(?:_([a-z-]+))?\.json$/;
const LETTERS = 'ABCDEF';
const normGroup = (v) => (v == null || ['', 'none', 'null'].includes(String(v).trim().toLowerCase()) ? null : String(v).trim());
const WARN_FLAGS = ['answer_conflict', 'answer_unsure', 'uncertain_text'];

async function main() {
  console.log(`\n${apply ? 'IMPORT' : 'DRY RUN'}: ${DIR}\n`);
  const problems = [];

  const { rows: combos } = await query(
    'SELECT s.id, s.slug, sc.class_level FROM subjects s JOIN subject_classes sc ON sc.subject_id = s.id'
  );
  const subjectId = new Map();
  const valid = new Set();
  combos.forEach((r) => { subjectId.set(r.slug, r.id); valid.add(`${r.class_level}:${r.slug}`); });

  const { rows: groupRows } = await query('SELECT id, slug FROM paper_groups');
  const groupId = new Map(groupRows.map((g) => [g.slug, g.id]));

  const { rows: have } = await query(
    'SELECT qs.class_level, s.slug, qs.year FROM quiz_sets qs JOIN subjects s ON s.id = qs.subject_id'
  );
  const haveSet = new Set(have.map((r) => `${r.class_level}:${r.slug}:${r.year}`));

  const files = [];
  for (const file of fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith('.json')).sort()) {
    const m = file.replace(/_objective\.json$/, '.json').match(NAME);
    if (!m) { problems.push(`${file}: name must look like 12_botany_2025_objective.json`); continue; }
    const [, cls, subject, year, nameGroup] = m;
    const bad = (msg) => problems.push(`${file}: ${msg}`);

    if (!valid.has(`${cls}:${subject}`)) { bad(`"${subject}" is not a valid subject for class ${cls}`); continue; }
    if (nameGroup && !groupId.has(nameGroup)) { bad(`unknown group "${nameGroup}" (not in paper_groups)`); continue; }

    let data;
    try { data = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8')); } catch (e) { bad(`not valid JSON (${e.message})`); continue; }

    // the JSON must agree with the file name
    const jsonGroup = normGroup(data.group);
    if (Number(data.class) !== Number(cls) || data.subject !== subject || Number(data.year) !== Number(year) || jsonGroup !== (nameGroup || null)) {
      bad(`class/subject/year/group inside the JSON do not match the file name`); continue;
    }
    if (!['en', 'ur'].includes(data.language)) { bad(`language must be "en" or "ur"`); continue; }
    if (data.status !== 'reviewed' && !allowDraft) { bad(`status is "${data.status}", not "reviewed" (use --allow-draft for a pilot)`); continue; }
    if (!Array.isArray(data.questions) || !data.questions.length) { bad('no questions'); continue; }

    const seen = new Set();
    const questions = [];
    let skippedFigures = 0;
    let warnings = 0;
    let ok = true;

    for (const [idx, q] of data.questions.entries()) {
      const tag = `Q${q && q.number != null ? q.number : idx + 1}`;
      const err = (msg) => { bad(`${tag}: ${msg}`); ok = false; };
      if (!q || typeof q !== 'object') { err('not an object'); continue; }

      if (!Number.isInteger(q.number) || q.number < 1) err('number must be a positive whole number');
      else if (seen.has(q.number)) err('duplicate question number');
      else seen.add(q.number);

      const body = typeof q.body === 'string' ? q.body.replace(/\r\n/g, '\n').trim() : '';
      if (!body) err('empty question text');

      const options = Array.isArray(q.options) ? q.options.map((o) => (typeof o === 'string' ? o.trim() : '')) : [];
      if (options.length < 2 || options.length > 6) err(`needs 2 to 6 options (has ${options.length})`);
      else if (options.some((o) => !o)) err('an option is empty');
      else if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) { warnings += 1; }

      const letter = typeof q.correct === 'string' ? q.correct.trim().toUpperCase() : '';
      const correct = LETTERS.indexOf(letter);
      if (letter.length !== 1 || correct < 0 || correct >= options.length) err(`"correct" must be a letter that matches an option (got "${q.correct}")`);

      if (Array.isArray(q.flags) && q.flags.some((f) => WARN_FLAGS.includes(f))) warnings += 1;
      if (q.figure) { skippedFigures += 1; continue; }   // figure questions wait until diagrams are supported

      const explanation = typeof q.explanation === 'string' && q.explanation.trim() ? q.explanation.trim() : null;
      questions.push({ number: q.number, body, options, correct, explanation, lock: q.lockOptionOrder === true });
    }
    if (!ok) continue;
    if (!questions.length) { bad('no importable questions'); continue; }

    files.push({
      file, cls: Number(cls), subject, sid: subjectId.get(subject), year: Number(year),
      group: nameGroup || null, gid: nameGroup ? groupId.get(nameGroup) : null,
      language: data.language, status: data.status, questions, skippedFigures, warnings,
      isNew: !haveSet.has(`${cls}:${subject}:${year}`),
    });
  }

  files.forEach((f) => {
    console.log(`${f.isNew ? '+' : '~'} class ${f.cls} ${f.subject} ${f.year}${f.group ? ` [${f.group}]` : ''}: ${f.questions.length} questions`
      + `${f.skippedFigures ? `, ${f.skippedFigures} figure questions skipped` : ''}`
      + `${f.warnings ? `, ${f.warnings} warnings` : ''}  (${f.status})`);
  });
  if (problems.length) { console.log('\nPROBLEMS:'); problems.forEach((p) => console.log(`  ! ${p}`)); }
  console.log(`\n${files.length} papers, ${files.reduce((n, f) => n + f.questions.length, 0)} questions, ${problems.length} problems.`);

  if (!apply) { console.log('Nothing imported. Add --apply to import.'); return problems.length ? 1 : 0; }
  if (problems.length) { console.log('Fix the problems first. Nothing imported.'); return 1; }

  let failed = 0;
  for (const f of files) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: [set] } = await client.query(
        `INSERT INTO quiz_sets (class_level, subject_id, year, language, is_active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (class_level, subject_id, year)
         DO UPDATE SET language = EXCLUDED.language,
                       is_active = quiz_sets.is_active OR EXCLUDED.is_active,
                       updated_at = now()
         RETURNING id`,
        [f.cls, f.sid, f.year, f.language, activate]
      );
      // re-importing a paper replaces only that paper's questions (the other group's stay)
      await client.query('DELETE FROM questions WHERE quiz_set_id = $1 AND group_id IS NOT DISTINCT FROM $2::smallint', [set.id, f.gid]);
      const { rows: [{ base }] } = await client.query('SELECT COALESCE(MAX(position), 0)::int AS base FROM questions WHERE quiz_set_id = $1', [set.id]);

      let n = 0;
      for (const q of f.questions) {
        n += 1;
        await client.query(
          `INSERT INTO questions (quiz_set_id, group_id, source_number, position, body, options, correct_index, explanation, lock_option_order)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)`,
          [set.id, f.gid, q.number, 10000 + base + n, q.body, JSON.stringify(q.options), q.correct, q.explanation, q.lock]
        );
      }
      // renumber the whole set 1..n (move out of the way first, so the unique rule never trips)
      await client.query('UPDATE questions SET position = position + 10000 WHERE quiz_set_id = $1 AND position < 10000', [set.id]);
      await client.query(
        `UPDATE questions q SET position = r.rn
           FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY group_id NULLS FIRST, source_number)::int AS rn
                   FROM questions WHERE quiz_set_id = $1) r
          WHERE q.id = r.id`,
        [set.id]
      );
      await client.query('COMMIT');
      console.log(`  done  class ${f.cls} ${f.subject} ${f.year}${f.group ? ` [${f.group}]` : ''} (${f.questions.length})`);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      failed += 1;
      console.error(`  FAILED ${f.file}: ${err.message}`);
    } finally {
      client.release();
    }
  }
  console.log(`\nImported ${files.length - failed}, failed ${failed}.${activate ? '' : ' Sets are NOT live yet (re-run with --activate, or see the SQL below).'}`);
  return failed ? 1 : 0;
}

main()
  .then((code) => { process.exitCode = code; })
  .catch((err) => { console.error('Script error:', err.message); process.exitCode = 1; })
  .finally(() => pool.end());