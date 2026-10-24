const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') }); // must run before the requires below

const sharp = require('sharp');
const { pool, query } = require('../config/db.js');
const { uploadFile, uploadLarge, fileExists } = require('../services/storage.js');

const apply = process.argv.includes('--apply');
const DIR = path.join(__dirname, '../../../books-data');
const COVERS = path.join(DIR, 'cover');
const MAX_BYTES = 250 * 1024 * 1024;
const mb = (b) => `${(b / 1024 / 1024).toFixed(1)} MB`;

// "11_Urdu_Asaan" -> { cls: 11, slug: 'urdu-asaan' };  "11_Biology&zoology_cover" -> biology-zoology
function parse(base) {
  const m = base.toLowerCase().replace(/_cover$/, '').match(/^(11|12)_(.+)$/);
  if (!m) return null;
  return { cls: Number(m[1]), slug: m[2].replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') };
}

async function main() {
  console.log(`\n${apply ? 'UPLOAD' : 'DRY RUN'}: ${DIR}\n`);
  const problems = [];

  const titles = JSON.parse(fs.readFileSync(path.join(DIR, 'books.json'), 'utf8'));

  // covers, matched by the same class + slug
  const covers = new Map();
  if (fs.existsSync(COVERS)) {
    for (const f of fs.readdirSync(COVERS)) {
      if (!/\.(png|jpe?g|webp)$/i.test(f)) continue;
      const p = parse(path.parse(f).name);
      if (!p) { problems.push(`cover/${f}: name must start with 11_ or 12_`); continue; }
      const k = `${p.cls}_${p.slug}`;
      if (covers.has(k)) problems.push(`cover/${f}: second cover for ${k}`);
      covers.set(k, path.join(COVERS, f));
    }
  }

  const { rows: existing } = await query('SELECT class_level, slug, size_bytes FROM books');
  const have = new Map(existing.map((r) => [`${r.class_level}_${r.slug}`, Number(r.size_bytes)]));

  const items = [];
  const seen = new Set();
  for (const file of fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith('.pdf')).sort()) {
    const p = parse(path.parse(file).name);
    if (!p) { problems.push(`${file}: name must start with 11_ or 12_ (e.g. 11_physics.pdf)`); continue; }
    const k = `${p.cls}_${p.slug}`;
    if (seen.has(k)) { problems.push(`${file}: duplicate of ${k}`); continue; }
    seen.add(k);

    const meta = titles[k];
    if (!meta) { problems.push(`${file}: no entry "${k}" in books.json`); continue; }

    const full = path.join(DIR, file);
    const size = fs.statSync(full).size;
    const head = Buffer.alloc(5);
    const fd = fs.openSync(full, 'r');
    fs.readSync(fd, head, 0, 5, 0);
    fs.closeSync(fd);
    if (size === 0 || head.toString() !== '%PDF-') { problems.push(`${file}: not a valid PDF`); continue; }
    if (size > MAX_BYTES) { problems.push(`${file}: ${mb(size)} is over the ${mb(MAX_BYTES)} limit`); continue; }

    const previous = have.get(k);
    items.push({
      file, full, ...p, k, size, title: meta.title, order: meta.order || 0,
      key: `books/${p.cls}/${p.slug}.pdf`,
      coverPath: covers.get(k) || null,
      status: previous === undefined ? 'new' : previous === size ? 'unchanged' : 'changed',
    });
  }

  items.forEach((b) => {
    const mark = { new: '+', changed: '~', unchanged: '=' }[b.status];
    console.log(`${mark} ${b.key.padEnd(36)} ${mb(b.size).padStart(9)}  ${b.status.padEnd(9)} cover: ${b.coverPath ? 'yes' : 'MISSING'}  "${b.title}"`);
  });
  covers.forEach((_, k) => { if (!items.some((b) => b.k === k)) console.log(`  note: cover for ${k} has no matching PDF`); });

  if (problems.length) { console.log('\nPROBLEMS:'); problems.forEach((x) => console.log(`  ! ${x}`)); }
  console.log(`\n${items.length} books, ${problems.length} problems.`);
  if (!apply) { console.log('Nothing uploaded. Add --apply to upload.'); return problems.length ? 1 : 0; }
  if (problems.length) { console.log('Fix the problems first. Nothing uploaded.'); return 1; }

  const UPSERT = `
    INSERT INTO books (class_level, slug, title, sort_order, storage_key, cover_key, size_bytes)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (class_level, slug)
    DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order,
                  storage_key = EXCLUDED.storage_key,
                  cover_key = COALESCE(EXCLUDED.cover_key, books.cover_key),
                  size_bytes = EXCLUDED.size_bytes, updated_at = now()
    RETURNING (xmax = 0) AS inserted`;

  const done = { added: 0, replaced: 0, failed: 0 };
  for (const b of items) {
    try {
      // PDF first (skipped if it is already there and unchanged), then the cover, then the row
      if (b.status !== 'unchanged' || !(await fileExists(b.key))) {
        console.log(`  uploading ${b.key} (${mb(b.size)}) ...`);
        await uploadLarge(b.key, b.full);
      }
      let coverKey = null;
      if (b.coverPath) {
        const buf = await sharp(b.coverPath).rotate().resize({ width: 600, withoutEnlargement: true })
          .webp({ quality: 80 }).toBuffer();
        coverKey = `books/${b.cls}/${b.slug}.webp`;
        await uploadFile(coverKey, buf, 'image/webp');
      }
      const { rows } = await query(UPSERT, [b.cls, b.slug, b.title, b.order, b.key, coverKey, b.size]);
      if (rows[0].inserted) done.added += 1; else done.replaced += 1;
      console.log(`  done  ${b.key}`);
    } catch (err) {
      done.failed += 1;
      console.error(`  FAILED ${b.key}: ${err.message}`);
    }
  }
  console.log(`\nAdded ${done.added}, updated ${done.replaced}, failed ${done.failed}.`);
  return done.failed ? 1 : 0;
}

main()
  .then((code) => { process.exitCode = code; })
  .catch((err) => { console.error('Script error:', err.message); process.exitCode = 1; })
  .finally(() => pool.end());