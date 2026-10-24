const { pipeline } = require('node:stream/promises');
const HttpError = require('../utils/HttpError.js');
const { parseId } = require('../validators/papers.validator.js');
const repo = require('../repositories/books.repository.js');
const { getFileStream } = require('../services/storage.js');

const clean = (s) => s.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
const bookFileName = (b) => `${clean(b.title)}-Class${b.class_level}-Book.pdf`; // Physics-Class11-Book.pdf

// "bytes=0-99", "bytes=500-" or "bytes=-100". Returns null (no range), 'invalid', or { start, end }.
function parseRange(header, total) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let start;
  let end;
  if (m[1] === '') {
    start = Math.max(total - Number(m[2]), 0);
    end = total - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? total - 1 : Math.min(Number(m[2]), total - 1);
  }
  if (start > end || start >= total) return 'invalid';
  return { start, end };
}

function fail(err, res, next) {
  if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') return; // the visitor closed the tab midway
  if (res.headersSent) return res.destroy();
  next(err);
}

async function list(req, res, next) {
  try {
    const classLevel = Number(req.query.class);
    if (![11, 12].includes(classLevel)) throw new HttpError(400, 'class must be 11 or 12');
    const rows = await repo.findByClass(classLevel);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({
      items: rows.map((r) => ({
        id: r.id,
        title: r.title,
        classLevel: r.class_level,
        size: Number(r.size_bytes),
        cover: r.cover_key ? `/api/books/${r.id}/cover` : null,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// disposition: 'inline' shows the PDF in the browser, 'attachment' saves it
async function sendBook(req, res, next, disposition) {
  try {
    const book = await repo.findById(parseId(req.params.id));
    if (!book) throw new HttpError(404, 'Book not found');

    const total = Number(book.size_bytes);
    const range = parseRange(req.headers.range, total);
    if (range === 'invalid') {
      res.setHeader('Content-Range', `bytes */${total}`);
      throw new HttpError(416, 'Range not satisfiable');
    }

    let file;
    try {
      file = await getFileStream(book.storage_key, range ? `bytes=${range.start}-${range.end}` : undefined);
    } catch (err) {
      if (err.name === 'NoSuchKey') throw new HttpError(404, 'File is missing from storage');
      throw err;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Disposition', `${disposition}; filename="${bookFileName(book)}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (range) {
      res.status(206);
      res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${total}`);
      res.setHeader('Content-Length', range.end - range.start + 1);
    } else {
      res.setHeader('Content-Length', file.size || total);
    }

    await pipeline(file.stream, res); // streams the file, never loads it all into memory
  } catch (err) {
    fail(err, res, next);
  }
}

async function cover(req, res, next) {
  try {
    const book = await repo.findById(parseId(req.params.id));
    if (!book || !book.cover_key) throw new HttpError(404, 'Cover not found');

    let file;
    try {
      file = await getFileStream(book.cover_key);
    } catch (err) {
      if (err.name === 'NoSuchKey') throw new HttpError(404, 'Cover is missing from storage');
      throw err;
    }

    res.setHeader('Content-Type', file.contentType || 'image/webp');
    if (file.size) res.setHeader('Content-Length', file.size);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    await pipeline(file.stream, res);
  } catch (err) {
    fail(err, res, next);
  }
}

const open = (req, res, next) => sendBook(req, res, next, 'inline');
const download = (req, res, next) => sendBook(req, res, next, 'attachment');

module.exports = { list, open, download, cover };