const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') }); // must run before the requires below

const { pool, query } = require('../config/db.js');
const { uploadFile, fileExists } = require('../services/storage.js');

const apply = process.argv.includes('--apply');
const DIR = path.join(__dirname, '../../../papers-data');   // repo root
const NAME = /^(11|12)_([a-z-]+)_(\d{4})_(subjective|objective|full)\.pdf$/;
const MAX_BYTES = 15 * 1024 * 1024;
const mb = (b) => `${(b / 1024 / 1024).toFixed(2)} MB`;

async function main() {
  console.log(`\n${apply ? 'UPLOAD' : 'DRY RUN'}: ${DIR}\n`);

  // what the database allows
  const { rows: combos } = await query(
    `SELECT s.id, s.slug, sc.class_level
       FROM subjects s JOIN subject_classes sc ON sc.subject_id = s.id`
  );
  const subjectId = new Map();
  const valid = new Set();
  combos.forEach((r) => { subjectId.set(r.slug, r.id); valid.add(`${r.class_level}:${r.slug}`); });

  // what is already uploaded
  const { rows: existing } = await query(
    'SELECT subject_id, class_level, year, type, size_bytes FROM papers'
  );
  const have = new Map(existing.map((r) => [`${r.class_level}:${r.subject_id}:${r.year}:${r.type}`, r.size_bytes]));

  const files = fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith('.pdf')).sort();
  const items = [];
  const problems = [];

  for (const file of files) {
    const m = file.match(NAME);
    if (!m) { problems.push(`${file}: name must look like 11_physics_2025_objective.pdf`); continue; }
    const [, cls, subject, year, type] = m;

    if (!valid.has(`${cls}:${subject}`)) {
      problems.push(`${file}: "${subject}" is not a valid subject for class ${cls}`); continue;
    }

    const full = path.join(DIR, file);
    const size = fs.statSync(full).size;
    const head = Buffer.alloc(5);
    const fd = fs.openSync(full, 'r');
    fs.readSync(fd, head, 0, 5, 0);
    fs.closeSync(fd);
    if (size === 0 || head.toString() !== '%PDF-') { problems.push(`${file}: not a valid PDF`); continue; }
    if (size > MAX_BYTES) { problems.push(`${file}: ${mb(size)} is over the ${mb(MAX_BYTES)} limit, compress it`); continue; }

    const id = subjectId.get(subject);
    const key = `${cls}/${subject}/${year}/${type}.pdf`;
    const previous = have.get(`${cls}:${id}:${year}:${type}`);
    const status = previous === undefined ? 'new' : previous === size ? 'unchanged' : 'changed';
    items.push({ file, full, cls: Number(cls), subject, id, year: Number(year), type, size, key, status });
  }

  items.forEach((i) => {
    const mark = { new: '+', changed: '~', unchanged: '=' }[i.status];
    console.log(`${mark} ${i.key.padEnd(46)} ${mb(i.size).padStart(9)}  ${i.status}`);
  });

  const perSet = {};
  items.forEach((i) => { const k = `${i.cls} ${i.subject} ${i.year}`; perSet[k] = (perSet[k] || 0) + 1; });
  const incomplete = Object.entries(perSet).filter(([, n]) => n !== 3);
  if (incomplete.length) {
    console.log('\nNot all three types present (fine if the paper really lacks one):');
    incomplete.forEach(([k, n]) => console.log(`  ${k}: ${n} of 3`));
  }

  if (problems.length) { console.log('\nPROBLEMS:'); problems.forEach((p) => console.log(`  ! ${p}`)); }
  const count = (s) => items.filter((i) => i.status === s).length;
  console.log(`\n${items.length} files: ${count('new')} new, ${count('changed')} changed, ${count('unchanged')} unchanged. ${problems.length} problems.`);

  if (!apply) { console.log('Nothing uploaded. Add --apply to upload.'); return problems.length ? 1 : 0; }
  if (problems.length) { console.log('Fix the problems first. Nothing uploaded.'); return 1; }

  // upload to Backblaze first, then write the row, so the site never lists a file that is not there
  const UPSERT = `
    INSERT INTO papers (subject_id, class_level, year, type, storage_key, size_bytes)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (class_level, subject_id, year, type)
    DO UPDATE SET storage_key = EXCLUDED.storage_key,
                  size_bytes  = EXCLUDED.size_bytes,
                  updated_at  = now()
    RETURNING (xmax = 0) AS inserted`;

  const done = { added: 0, replaced: 0, skipped: 0, failed: 0 };
  for (const i of items) {
    try {
      if (i.status === 'unchanged' && (await fileExists(i.key))) { done.skipped += 1; continue; }
      await uploadFile(i.key, fs.readFileSync(i.full));
      const { rows } = await query(UPSERT, [i.id, i.cls, i.year, i.type, i.key, i.size]);
      if (rows[0].inserted) done.added += 1; else done.replaced += 1;
      console.log(`  done  ${i.key}`);
    } catch (err) {
      done.failed += 1;
      console.error(`  FAILED ${i.key}: ${err.message}`);
    }
  }
  console.log(`\nAdded ${done.added}, replaced ${done.replaced}, skipped ${done.skipped}, failed ${done.failed}.`);
  return done.failed ? 1 : 0;
}

main()
  .then((code) => { process.exitCode = code; })
  .catch((err) => { console.error('Script error:', err.message); process.exitCode = 1; })
  .finally(() => pool.end());