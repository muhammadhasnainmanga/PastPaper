const express = require('express');
const cors = require('cors');
const { query } = require('./config/db.js');
const rateLimit = require('express-rate-limit');

const app = express();

const configuredOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
const origins = [...new Set([
  'http://localhost:5173',
  'https://pastpaper.hasnainmanga.dev',
  ...configuredOrigins,
])];
app.use(cors({ origin: origins }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/api/debug-ip', (req, res) => res.json({ ip: req.ip, xff: req.headers['x-forwarded-for'] }));

// at most 200 requests a minute per visitor
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 200, standardHeaders: true, legacyHeaders: false }));

app.use('/api/papers', require('./routes/papers.routes.js'));
// last resort for errors thrown inside routes

//for books
app.use('/api/books', require('./routes/books.routes.js'));

//for quiz
app.use('/api/quiz', require('./routes/quiz.routes.js'));

app.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});



module.exports = app;
