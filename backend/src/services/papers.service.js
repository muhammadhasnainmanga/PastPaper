const repo = require('../repositories/papers.repository.js');

async function listPapers({ classLevel, streamSlug, subjects, years }) {
  const yearList = years.length ? years : await repo.findYears(classLevel);
  if (!yearList.length) return { items: [] };

  const rows = await repo.findGrid({ streamSlug, classLevel, subjects, years: yearList });

  // one item per subject + year + group, holding up to three files.
  // An empty slot (no paper at all) comes back once, with no group and all files null.
  const items = new Map();
  for (const r of rows) {
    const key = `${r.subject}:${r.year}:${r.group_slug || ''}`;
    if (!items.has(key)) {
      items.set(key, {
        subject: r.subject,
        year: r.year,
        group: r.group_slug
          ? { slug: r.group_slug, name: r.group_name, short: r.group_short }
          : null,
        files: { subjective: null, objective: null, full: null },
      });
    }
    if (r.id) items.get(key).files[r.type] = { id: r.id, size: r.size_bytes };
  }
  return { items: [...items.values()] };
}

module.exports = { listPapers };