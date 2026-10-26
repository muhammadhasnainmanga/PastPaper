const HttpError = require('../utils/HttpError.js');

const SLUG = /^[a-z]+(?:-[a-z]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const csv = (v) => (typeof v === 'string' && v ? v.split(',') : []);

function parseListQuery(q) {
  const classLevel = Number(q.class);
  if (![11, 12].includes(classLevel)) throw new HttpError(400, 'class must be 11 or 12');

  if (typeof q.stream !== 'string' || !SLUG.test(q.stream)) throw new HttpError(400, 'invalid stream');

  const subjects = csv(q.subjects);
  if (subjects.length > 20 || subjects.some((s) => !SLUG.test(s))) throw new HttpError(400, 'invalid subjects');

  const years = csv(q.years).map(Number);
  if (years.length > 30 || years.some((y) => !Number.isInteger(y) || y < 2000 || y > 2100)) {
    throw new HttpError(400, 'invalid years');
  }
  const variant = q.original === '1' ? 'original' : 'scanned';
  return { classLevel, streamSlug: q.stream, subjects, years, variant };
}

function parseId(id) {
  if (!UUID.test(id)) throw new HttpError(400, 'invalid paper id');
  return id;
}

function parseIds(value) {
  const ids = csv(value);
  if (!ids.length || ids.length > 100 || ids.some((id) => !UUID.test(id))) {
    throw new HttpError(400, 'invalid ids');
  }
  return ids;
}

module.exports = { parseListQuery, parseId, parseIds };