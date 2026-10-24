const express = require('express');
const cors = require('cors');
const { query } = require('./config/db.js');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// at most 200 requests a minute per visitor
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 200, standardHeaders: true, legacyHeaders: false }));

app.use('/api/papers', require('./routes/papers.routes.js'));
// last resort for errors thrown inside routes

//for books
app.use('/api/books', require('./routes/books.routes.js'));

app.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

module.exports = app;