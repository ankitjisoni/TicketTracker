/**
 * server.js — Application entry point
 *
 * Loads environment variables, initialises the database, mounts the
 * Express routes, starts the background ADO poller, and begins listening
 * for HTTP connections.
 */

// 1. Load .env as early as possible
require('dotenv').config();

const express = require('express');
const path = require('path');
const db = require('./src/db');
const poller = require('./src/poller');
const routes = require('./src/routes');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT, 10) || 3000;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS, 10) || 30000;

// ---------------------------------------------------------------------------
// Express setup
// ---------------------------------------------------------------------------

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Serve static front-end assets from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use(routes);

// ---------------------------------------------------------------------------
// Startup sequence
// ---------------------------------------------------------------------------

// Initialise the database (creates tables if needed)
db.initDb();

// Start the background Azure DevOps polling loop
poller.startPolling(POLL_INTERVAL_MS);

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`\n🚀  Ticket Tracker server running on http://localhost:${PORT}`);
  console.log(`    Polling Azure DevOps every ${POLL_INTERVAL_MS / 1000}s\n`);
});
