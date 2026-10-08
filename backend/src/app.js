const express = require('express');
const cors = require('cors');
const { query } = require('./config/db.js');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// quick check that the server and the database are both alive
app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await query('SELECT current_database() AS db, now() AS time');
    res.json({ status: 'ok', ...rows[0] });
  } catch (err) {
    console.error('Health check failed:', err.message);
    res.status(503).json({ status: 'error', message: 'Database not reachable' });
  }
});

// routes go here later, e.g. app.use('/api/papers', require('./routes/papers.routes.js'));

// anything under /api that did not match above
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// last resort for errors thrown inside routes
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

module.exports = app;