/**
 * Poller module — background polling & Server-Sent Events (SSE)
 *
 * Periodically fetches the latest state for every tracked ticket from
 * Azure DevOps, detects state changes, persists them, and broadcasts
 * real-time updates to all connected SSE clients.
 */

const db = require('./db');
const ado = require('./ado-client');

// ---------------------------------------------------------------------------
// SSE client registry
// ---------------------------------------------------------------------------

/** @type {import('http').ServerResponse[]} */
const clients = [];

/**
 * Register an SSE client (Express response object).
 * The caller is responsible for setting the correct SSE headers before
 * calling this function.
 * @param {import('http').ServerResponse} res
 */
function addClient(res) {
  clients.push(res);
  console.log(`[poller] SSE client connected  (total: ${clients.length})`);
}

/**
 * Remove a disconnected SSE client.
 * @param {import('http').ServerResponse} res
 */
function removeClient(res) {
  const idx = clients.indexOf(res);
  if (idx !== -1) {
    clients.splice(idx, 1);
    console.log(`[poller] SSE client disconnected (total: ${clients.length})`);
  }
}

/**
 * Broadcast an SSE message to every connected client.
 * @param {string} event — SSE event name
 * @param {object} data  — JSON-serialisable payload
 */
function broadcast(event, data) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.write(message);
    } catch (err) {
      // Client probably disconnected; ignore — the 'close' handler will
      // remove it from the array.
      console.warn('[poller] Failed to write to SSE client:', err.message);
    }
  }
}

// ---------------------------------------------------------------------------
// Polling logic
// ---------------------------------------------------------------------------

/** Handle for the setInterval so callers can stop it if needed. */
let pollInterval = null;

/**
 * Execute one polling cycle:
 *  1. Load all tracked tickets from the DB.
 *  2. Batch-fetch their current state from ADO.
 *  3. Compare — update DB and broadcast on state changes.
 */
async function poll() {
  try {
    const tickets = db.getAllTickets();
    if (tickets.length === 0) return; // nothing to poll

    // Collect ADO ids for a single batch request
    const adoIds = tickets.map((t) => t.ado_id);
    const freshItems = await ado.fetchMultipleWorkItems(adoIds);

    // Index fetched items by ADO id for fast lookup
    const itemMap = new Map();
    for (const item of freshItems) {
      itemMap.set(item.id, item);
    }

    // Compare each tracked ticket with its fresh ADO data
    for (const ticket of tickets) {
      const item = itemMap.get(ticket.ado_id);
      if (!item) {
        // Could not fetch this item — skip (don't remove from tracking)
        console.warn(
          `[poller] Could not fetch ADO work item ${ticket.ado_id}, skipping`
        );
        continue;
      }

      const oldState = ticket.state;
      const newState = item.state;

      // Always update fields to keep data fresh
      db.updateTicketFromAdo(ticket.id, item);

      // Broadcast only when the workflow *state* actually changed
      if (oldState !== newState) {
        const changedAt = new Date().toISOString();

        // Record in status_history table
        db.addStatusChange(ticket.id, oldState, newState);

        // Notify SSE clients
        broadcast('status_change', {
          type: 'status_change',
          ticketId: ticket.id,
          adoId: ticket.ado_id,
          title: item.title,
          oldState,
          newState,
          changedAt,
        });

        console.log(
          `[poller] State change detected — ADO #${ticket.ado_id}: "${oldState}" → "${newState}"`
        );
      }
    }
  } catch (err) {
    // Log but never crash the polling loop
    console.error('[poller] Error during poll cycle:', err.message);
  }
}

/**
 * Start the background polling loop.
 * @param {number} intervalMs — milliseconds between each poll cycle
 */
function startPolling(intervalMs) {
  if (pollInterval) {
    console.warn('[poller] Polling already running — skipping duplicate start');
    return;
  }

  console.log(`[poller] Starting background polling every ${intervalMs}ms`);

  // Run immediately on startup, then repeat on the interval
  poll();
  pollInterval = setInterval(poll, intervalMs);
}

/**
 * Stop the background polling loop (useful for graceful shutdown / tests).
 */
function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    console.log('[poller] Polling stopped');
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  addClient,
  removeClient,
  broadcast,
  startPolling,
  stopPolling,
};
