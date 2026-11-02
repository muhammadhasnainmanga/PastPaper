const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool, query } = require('../config/db.js');
const { fileSize } = require('../services/storage.js');

async function main() {
  const { rows: papers } = await query('SELECT storage_key AS key, size_bytes AS size FROM papers');
  const { rows: books } = await query('SELECT storage_key AS key, cover_key, size_bytes AS size FROM books');
  const checks = [
    ...papers.map((r) => ({ key: r.key, size: Number(r.size) })),
    ...books.map((r) => ({ key: r.key, size: Number(r.size) })),
    ...books.filter((r) => r.cover_key).map((r) => ({ key: r.cover_key, size: null })),
  ];

  const missing = [];
  const wrong = [];
  for (let i = 0; i < checks.length; i += 10) {
    await Promise.all(checks.slice(i, i + 10).map(async (c) => {
      const size = await fileSize(c.key);
      if (size === null) missing.push(c.key);
      else if (c.size !== null && size !== c.size) wrong.push(`${c.key} (database ${c.size}, bucket ${size})`);
    }));
  }

  console.log(`Checked ${checks.length} files.`);
  console.log(`Missing: ${missing.length}`); missing.forEach((k) => console.log(`  ! ${k}`));
  console.log(`Wrong size: ${wrong.length}`); wrong.forEach((k) => console.log(`  ! ${k}`));
  return missing.length || wrong.length ? 1 : 0;
}

main().then((c) => { process.exitCode = c; })
  .catch((e) => { console.error(e.message); process.exitCode = 1; })
  .finally(() => pool.end());