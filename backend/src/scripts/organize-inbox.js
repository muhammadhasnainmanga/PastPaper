const fs = require('fs');
const path = require('path');

const SUBJECTS = ['botany', 'zoology', 'physics', 'chemistry', 'statistics', 'maths', 'urdu',
  'english', 'computer-science', 'islamiyat', 'pakistan-studies'];
const ONLY_IN_CLASS = { islamiyat: 11, 'pakistan-studies': 12 };

// text in the raw file name -> group slug (null = no group)
const GROUPS = {
  'group-not-specified-in-scan': null,
  'science-general': 'science-general',
  'pre-medical-and-pre-engineering': 'pre-medical-and-pre-engineering',
};

const getArg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : null;
};
const apply = process.argv.includes('--apply');
const classLevel = Number(getArg('class'));
const from = getArg('from');
const to = getArg('to') || path.join(__dirname, '../../../papers-data');

if (![11, 12].includes(classLevel) || !from) {
  console.log('Usage: node src/scripts/organize-inbox.js --class 11 --from "<folder with the PDFs>" [--apply]');
  process.exit(1);
}

// 2025_english_science-general_objective.pdf   or   2025_Zoology_Full.pdf
const PATTERN = /^(\d{4})_(.+?)_(?:(.+)_)?(full|objective|subjective)\.pdf$/i;
const mb = (b) => `${(b / 1024 / 1024).toFixed(2)} MB`;

const plan = [];
const problems = [];
const seen = new Map();

for (const file of fs.readdirSync(from)) {
  if (!file.toLowerCase().endsWith('.pdf')) continue;
  const source = path.join(from, file);
  const m = file.match(PATTERN);
  if (!m) { problems.push(`${file}: name is not YEAR_Subject_[group_]Type.pdf`); continue; }

  const year = Number(m[1]);
  const subject = m[2].toLowerCase();
  const rawGroup = m[3] ? m[3].toLowerCase() : null;
  const type = m[4].toLowerCase();

  let group = null;
  if (rawGroup !== null) {
    if (!(rawGroup in GROUPS)) {
      problems.push(`${file}: unknown group "${rawGroup}". Add it to GROUPS in this script, or rename the file`);
      continue;
    }
    group = GROUPS[rawGroup];
  }

  if (!SUBJECTS.includes(subject)) { problems.push(`${file}: unknown subject "${subject}"`); continue; }
  if (ONLY_IN_CLASS[subject] && ONLY_IN_CLASS[subject] !== classLevel) {
    problems.push(`${file}: ${subject} does not exist in class ${classLevel}`); continue;
  }
  if (year < 2000 || year > 2100) { problems.push(`${file}: odd year ${year}`); continue; }

  const size = fs.statSync(source).size;
  const head = Buffer.alloc(5);
  const fd = fs.openSync(source, 'r');
  fs.readSync(fd, head, 0, 5, 0);
  fs.closeSync(fd);
  if (size === 0 || head.toString() !== '%PDF-') { problems.push(`${file}: not a valid PDF`); continue; }

  const rel = `${classLevel}_${subject}_${year}_${group ? `${group}_` : ''}${type}.pdf`;
  if (seen.has(rel)) { problems.push(`${file}: same target as ${seen.get(rel)} (${rel})`); continue; }
  seen.set(rel, file);

  plan.push({ file, source, rel, target: path.join(to, rel), year, subject, group, type, size });
}

for (const p of plan) {
  if (!fs.existsSync(p.target)) continue;
  if (fs.statSync(p.target).size === p.size) p.exists = true;
  else problems.push(`${p.file}: a different file already exists at ${p.rel}`);
}

plan.sort((a, b) => a.rel.localeCompare(b.rel));
console.log(`\n${apply ? 'APPLY' : 'DRY RUN'}: class ${classLevel}, from ${from}\n`);
plan.forEach((p) => console.log(`${p.exists ? '=' : '+'} ${p.rel.padEnd(70)} ${mb(p.size).padStart(9)}   <- ${p.file}`));

const perSet = {};
plan.forEach((p) => {
  const k = `${p.subject} ${p.year}${p.group ? ` [${p.group}]` : ''}`;
  perSet[k] = (perSet[k] || 0) + 1;
});
console.log('\nFiles per subject, year and group (expect 3 each):');
Object.entries(perSet).forEach(([k, n]) => console.log(`  ${k}: ${n}${n === 3 ? '' : '   <-- check'}`));

if (problems.length) { console.log('\nPROBLEMS:'); problems.forEach((p) => console.log(`  ! ${p}`)); }
console.log(`\n${plan.length} files ready, ${problems.length} problems.`);

if (!apply) { console.log('Nothing copied. Add --apply to copy.'); process.exit(problems.length ? 1 : 0); }
if (problems.length) { console.log('Fix the problems first. Nothing copied.'); process.exit(1); }

fs.mkdirSync(to, { recursive: true });
const manifest = path.join(to, 'manifest.csv');
if (!fs.existsSync(manifest)) {
  fs.writeFileSync(manifest, 'class,subject,year,group,type,size_bytes,source_file\n');
}
const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
let copied = 0;
for (const p of plan) {
  if (p.exists) continue;
  fs.copyFileSync(p.source, p.target);
  fs.appendFileSync(manifest, [classLevel, p.subject, p.year, p.group || '', p.type, p.size, q(p.file)].join(',') + '\n');
  copied += 1;
}
console.log(`Copied ${copied} files into ${to}`);