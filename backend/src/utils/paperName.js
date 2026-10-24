const TYPE_LABEL = { subjective: 'Subjective', objective: 'Objective', full: 'Full-Paper' };

// "Computer-Science-Objective-2025-Class11.pdf", built from the database, never from the storage path
function downloadName(p) {
  const subject = p.subject_name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${subject}-${TYPE_LABEL[p.type]}-${p.year}-Class${p.class_level}.pdf`;
}

module.exports = { downloadName };