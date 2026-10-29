const HttpError = require('../utils/HttpError.js');

const SLUG = /^[a-z]+(?:-[a-z]+)*$/;

function parseClass(v) {
  const c = Number(v);
  if (![11, 12].includes(c)) throw new HttpError(400, 'class must be 11 or 12');
  return c;
}
function parseSubject(v) {
  if (typeof v !== 'string' || !SLUG.test(v)) throw new HttpError(400, 'invalid subject');
  return v;
}
function parseYears(v) {
  const ys = typeof v === 'string' && v ? v.split(',').map(Number) : [];
  if (ys.length > 30 || ys.some((y) => !Number.isInteger(y) || y < 2000 || y > 2100)) throw new HttpError(400, 'invalid years');
  return ys;
}

module.exports = { parseClass, parseSubject, parseYears };