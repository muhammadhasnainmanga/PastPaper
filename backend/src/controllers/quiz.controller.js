const { parseClass, parseSubject, parseYears } = require('../validators/quiz.validator.js');
const repo = require('../repositories/quiz.repository.js');

const cache = (res) => res.setHeader('Cache-Control', 'public, max-age=60'); // a fixed answer shows up within a minute

async function subjects(req, res, next) {
  try {
    const items = await repo.findSubjects(parseClass(req.query.class));
    cache(res);
    res.json({ items });
  } catch (err) { next(err); }
}

async function sets(req, res, next) {
  try {
    const items = await repo.findSets(parseClass(req.query.class), parseSubject(req.query.subject));
    cache(res);
    res.json({ items });
  } catch (err) { next(err); }
}

async function questions(req, res, next) {
  try {
    const subject = parseSubject(req.query.subject);
    const rows = await repo.findQuestions({
      classLevel: parseClass(req.query.class), subject, years: parseYears(req.query.years),
    });
    cache(res);
    res.json({
      subject: rows.length ? { slug: subject, name: rows[0].subject_name } : null,
      items: rows.map((r) => ({
        id: r.id,
        year: r.year,
        number: r.source_number,
        group: r.group_slug ? { short: r.group_short, name: r.group_name } : null,
        body: r.body,
        image: null,              // figure images come later
        options: r.options,
        correct: r.correct_index,
        explanation: r.explanation,
      })),
    });
  } catch (err) { next(err); }
}

module.exports = { subjects, sets, questions };