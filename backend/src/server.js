require('dotenv').config(); // must run first, so the other files can read .env
const app = require('./app.js');
const { pool, connectDb } = require('./config/db.js');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDb(); // stop here if the database is not reachable

    const server = app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err.message);
      process.exit(1);
    });

    // close things cleanly on Ctrl+C or when a host stops the app
    const shutdown = (signal) => {
      console.log(`${signal} received, shutting down`);
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('Could not start server:', err.message);
    process.exit(1);
  }
};

startServer();