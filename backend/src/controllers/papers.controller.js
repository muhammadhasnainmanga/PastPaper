const { pipeline } = require('node:stream/promises');
const { ZipArchive } = require('archiver');
const HttpError = require('../utils/HttpError.js');
const { downloadName } = require('../utils/paperName.js');
const { parseListQuery, parseId, parseIds } = require('../validators/papers.validator.js');
const repo = require('../repositories/papers.repository.js');
const service = require('../services/papers.service.js');
const { getFileStream } = require('../services/storage.js');

async function list(req, res, next) {
  try {
    const filters = parseListQuery(req.query);
    res.json(await service.listPapers(filters));
  } catch (err) {
    next(err);
  }
}

// disposition: 'inline' shows the PDF in the browser, 'attachment' saves it
async function sendFile(req, res, next, disposition) {
  try {
    const paper = await repo.findFileById(parseId(req.params.id));
    if (!paper) throw new HttpError(404, 'Paper not found');

    let file;
    try {
      file = await getFileStream(paper.storage_key);
    } catch (err) {
      if (err.name === 'NoSuchKey') throw new HttpError(404, 'File is missing from storage');
      throw err;
    }

    res.setHeader('Content-Type', 'application/pdf');
    if (file.size) res.setHeader('Content-Length', file.size);
    res.setHeader('Content-Disposition', `${disposition}; filename="${downloadName(paper)}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    await pipeline(file.stream, res); // streams the file, never loads it all into memory
    // later: this is where a download counter can go
  } catch (err) {
    if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') return; // the visitor closed the tab midway
    if (res.headersSent) return res.destroy();
    next(err);
  }
}

const open = (req, res, next) => sendFile(req, res, next, 'inline');
const download = (req, res, next) => sendFile(req, res, next, 'attachment');

// several papers as one ZIP
async function zip(req, res, next) {
  try {
    const papers = await repo.findFilesByIds(parseIds(req.query.ids));
    if (!papers.length) throw new HttpError(404, 'No papers found');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="PastPaper-papers.zip"');

    const archive = new ZipArchive({ store: true }); // PDFs are already compressed
    let clientClosed = false;
    let responseFinished = false;
    const activeStreams = new Set();
    let resolveClientClosed;
    const clientClosedSignal = new Promise((resolve) => {
      resolveClientClosed = resolve;
    });

    const cleanup = () => {
      res.removeListener('finish', onFinish);
      res.removeListener('close', onClose);
    };
    const onFinish = () => {
      responseFinished = true;
      cleanup();
    };
    const onClose = () => {
      // A response also emits "close" after a successful finish. Only abort
      // the archive when the connection ended before the response completed.
      if (responseFinished || res.writableFinished) return;
      clientClosed = true;
      for (const stream of activeStreams) stream.destroy();
      archive.abort();
      resolveClientClosed();
      cleanup();
    };
    res.once('finish', onFinish);
    res.once('close', onClose);

    const archiveError = new Promise((_, reject) => {
      archive.once('error', reject);
    });
    archive.pipe(res);

    // add one file at a time, so we never open dozens of storage connections at once
    for (const p of papers) {
      if (clientClosed) return;
      const { stream } = await getFileStream(p.storage_key);
      activeStreams.add(stream);
      stream.once('close', () => activeStreams.delete(stream));
      const added = new Promise((resolve) => archive.once('entry', resolve));
      archive.append(stream, { name: downloadName(p) });
      await Promise.race([added, clientClosedSignal, archiveError]);
    }
    if (!clientClosed) await Promise.race([archive.finalize(), archiveError]);
  } catch (err) {
    if (err.code === 'ERR_STREAM_PREMATURE_CLOSE' || res.destroyed) return;
    if (res.headersSent) return res.destroy(err);
    res.removeHeader('Content-Disposition');
    next(err);
  }
}

module.exports = { list, open, download, zip };