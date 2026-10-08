const { Pool } = require('pg');

// One pool for the whole app. Neon asks for SSL, which comes from ?sslmode=require in the URL.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                       // maximum open connections
  idleTimeoutMillis: 30000,      // close connections that sit idle for 30 seconds
  connectionTimeoutMillis: 10000 // Neon may need a moment to wake up after a quiet spell
});

// Neon drops idle connections when it sleeps. Without this handler such a drop
// would crash the whole server.
pool.on('error', (err) => {
  console.error('Idle database connection error:', err.message);
});

const query = (text, params) => pool.query(text, params);

const connectDb = async () => {
  const { rows } = await pool.query('SELECT current_database() AS db');
  console.log(`Database connected: ${rows[0].db}`);
};

module.exports = { pool, query, connectDb };