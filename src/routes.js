/**
 * Express Router — API endpoints for the Ticket Tracker
 *
 * Mounts under the root path (server.js does `app.use(routes)`).
 * All JSON API routes are prefixed with /api.
 */

const { Router } = require('express');
const db = require('./db');
const ado = require('./ado-client');
const poller = require('./poller');

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════
// TICKETS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/tickets
 * Return all tracked tickets.
 */
router.get('/api/tickets', (_req, res) => {
  try {
    const tickets = db.getAllTickets();
    res.json(tickets);
  } catch (err) {
    console.error('[routes] GET /api/tickets error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve tickets' });
  }
});

/**
 * POST /api/tickets
 * Start tracking a new ADO work item.
 * Body: { adoId: number }
 */
router.post('/api/tickets', async (req, res) => {
  try {
    const { adoId } = req.body;

    if (!adoId || typeof adoId !== 'number') {
      return res
        .status(400)
        .json({ error: 'Request body must include "adoId" as a number' });
    }

    // Check if already tracked
    const existing = db.getTicketByAdoId(adoId);
    if (existing) {
      return res
        .status(409)
        .json({ error: `Work item ${adoId} is already being tracked`, ticket: existing });
    }

    // Fetch from Azure DevOps
    const item = await ado.fetchWorkItem(adoId);
    if (!item) {
      return res
        .status(404)
        .json({ error: `Work item ${adoId} not found in Azure DevOps` });
    }

    // Persist
    const ticket = db.addTicket(item);
    res.status(201).json(ticket);
  } catch (err) {
    console.error('[routes] POST /api/tickets error:', err.message);
    res.status(500).json({ error: 'Failed to add ticket' });
  }
});

/**
 * DELETE /api/tickets/:id
 * Stop tracking a ticket (cascade-deletes notes & history).
 */
router.delete('/api/tickets/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ticket id' });
    }

    const deleted = db.deleteTicket(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    console.error('[routes] DELETE /api/tickets/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

/**
 * GET /api/tickets/:id/refresh
 * Force-refresh a ticket from ADO and return the updated row.
 */
router.get('/api/tickets/:id/refresh', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ticket id' });
    }

    const ticket = db.getTicketById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const item = await ado.fetchWorkItem(ticket.ado_id);
    if (!item) {
      return res
        .status(502)
        .json({ error: 'Failed to fetch work item from Azure DevOps' });
    }

    // Detect state change while refreshing
    if (ticket.state !== item.state) {
      db.addStatusChange(id, ticket.state, item.state);

      // Broadcast to SSE clients
      poller.broadcast('status_change', {
        type: 'status_change',
        ticketId: id,
        adoId: ticket.ado_id,
        title: item.title,
        oldState: ticket.state,
        newState: item.state,
        changedAt: new Date().toISOString(),
      });
    }

    const updated = db.updateTicketFromAdo(id, item);
    res.json(updated);
  } catch (err) {
    console.error('[routes] GET /api/tickets/:id/refresh error:', err.message);
    res.status(500).json({ error: 'Failed to refresh ticket' });
  }
});

/**
 * PATCH /api/tickets/:id/code-committed
 * Mark or unmark a ticket as "Code Committed".
 * Body: { committed: boolean }
 */
router.patch('/api/tickets/:id/code-committed', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ticket id' });
    }

    const { committed } = req.body;
    if (typeof committed !== 'boolean') {
      return res
        .status(400)
        .json({ error: '"committed" is required and must be a boolean' });
    }

    const updated = db.setCodeCommitted(id, committed);
    if (!updated) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error('[routes] PATCH /api/tickets/:id/code-committed error:', err.message);
    res.status(500).json({ error: 'Failed to update code-committed status' });
  }
});

/**
 * PATCH /api/tickets/:id/state
 * Transition ticket state (supports Kanban board moves & manual state updates).
 * Body: { state: string }
 */
router.patch('/api/tickets/:id/state', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ticket id' });
    }

    const { state } = req.body;
    if (!state || typeof state !== 'string' || !state.trim()) {
      return res.status(400).json({ error: '"state" is required and must be a non-empty string' });
    }

    const targetState = state.trim();
    const currentTicket = db.getTicketById(id);
    if (!currentTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const oldState = currentTicket.state;
    if (oldState === targetState) {
      return res.json(currentTicket);
    }

    // Attempt to sync state to Azure DevOps (soft fail if read-only PAT or restricted)
    let syncedWithAdo = false;
    try {
      await ado.updateWorkItemState(currentTicket.ado_id, targetState);
      syncedWithAdo = true;
    } catch (adoErr) {
      console.warn(`[routes] State sync to ADO skipped/failed (#${currentTicket.ado_id}): ${adoErr.message}`);
    }

    // Record transition history
    db.addStatusChange(id, oldState, targetState);

    // Update state in local database
    const updated = db.updateTicketState(id, targetState);

    // Broadcast change via SSE to all clients
    poller.broadcast('status_change', {
      type: 'status_change',
      ticketId: id,
      adoId: currentTicket.ado_id,
      title: currentTicket.title,
      oldState,
      newState: targetState,
      changedAt: new Date().toISOString(),
    });

    res.json({
      ...updated,
      syncedWithAdo,
    });
  } catch (err) {
    console.error('[routes] PATCH /api/tickets/:id/state error:', err.message);
    res.status(500).json({ error: 'Failed to update ticket state' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// STATUS HISTORY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/tickets/:id/history
 * Return the full status-change history for a ticket.
 */
router.get('/api/tickets/:id/history', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ticket id' });
    }

    const ticket = db.getTicketById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const history = db.getStatusHistory(id);
    res.json(history);
  } catch (err) {
    console.error('[routes] GET /api/tickets/:id/history error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve status history' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// COMMIT NOTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/tickets/:id/notes
 * Return all commit notes for a ticket.
 */
router.get('/api/tickets/:id/notes', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ticket id' });
    }

    const ticket = db.getTicketById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const notes = db.getCommitNotes(id);
    res.json(notes);
  } catch (err) {
    console.error('[routes] GET /api/tickets/:id/notes error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve commit notes' });
  }
});

/**
 * POST /api/tickets/:id/notes
 * Add a commit note to a ticket.
 * Body: { noteText: string, targetStatus?: string }
 */
router.post('/api/tickets/:id/notes', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ticket id' });
    }

    const ticket = db.getTicketById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const { noteText, targetStatus } = req.body;
    if (!noteText || typeof noteText !== 'string') {
      return res
        .status(400)
        .json({ error: '"noteText" is required and must be a string' });
    }

    const note = db.addCommitNote(id, noteText, targetStatus || null);
    res.status(201).json(note);
  } catch (err) {
    console.error('[routes] POST /api/tickets/:id/notes error:', err.message);
    res.status(500).json({ error: 'Failed to add commit note' });
  }
});

/**
 * PUT /api/notes/:noteId
 * Update an existing commit note.
 * Body: { noteText: string, targetStatus?: string }
 */
router.put('/api/notes/:noteId', (req, res) => {
  try {
    const noteId = Number(req.params.noteId);
    if (Number.isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid note id' });
    }

    const { noteText, targetStatus } = req.body;
    if (!noteText || typeof noteText !== 'string') {
      return res
        .status(400)
        .json({ error: '"noteText" is required and must be a string' });
    }

    const updated = db.updateCommitNote(noteId, noteText, targetStatus || null);
    if (!updated) {
      return res.status(404).json({ error: 'Commit note not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error('[routes] PUT /api/notes/:noteId error:', err.message);
    res.status(500).json({ error: 'Failed to update commit note' });
  }
});

/**
 * DELETE /api/notes/:noteId
 * Delete a commit note.
 */
router.delete('/api/notes/:noteId', (req, res) => {
  try {
    const noteId = Number(req.params.noteId);
    if (Number.isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid note id' });
    }

    const deleted = db.deleteCommitNote(noteId);
    if (!deleted) {
      return res.status(404).json({ error: 'Commit note not found' });
    }

    res.json({ message: 'Commit note deleted successfully' });
  } catch (err) {
    console.error('[routes] DELETE /api/notes/:noteId error:', err.message);
    res.status(500).json({ error: 'Failed to delete commit note' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// TEAM WORKLOAD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/team-workload
 * Query Azure DevOps via WIQL for work items in a date range,
 * grouped by Assigned To.
 *
 * Body: {
 *   dateFrom: string (ISO date, e.g. "2025-01-01"),
 *   dateTo: string (ISO date),
 *   assignedTo?: string (filter to a specific person),
 *   workItemTypes?: string[] (e.g. ["Bug", "Task"])
 * }
 */
router.post('/api/team-workload', async (req, res) => {
  try {
    const { dateFrom, dateTo, assignedTo, iterationPath } = req.body;

    if (!dateFrom || !dateTo) {
      return res
        .status(400)
        .json({ error: '"dateFrom" and "dateTo" are required' });
    }

    // Build WIQL query — use ChangedDate OR CreatedDate in range (date-only, no time component)
    const conditions = [
      `(([System.ChangedDate] >= '${dateFrom}' AND [System.ChangedDate] <= '${dateTo}') OR ([System.CreatedDate] >= '${dateFrom}' AND [System.CreatedDate] <= '${dateTo}'))`,
    ];

    // Optional Iteration Path / Sprint filter
    if (iterationPath && String(iterationPath).trim()) {
      const cleanPath = String(iterationPath).trim().replace(/'/g, "''");
      conditions.push(`[System.IterationPath] UNDER '${cleanPath}'`);
    }

    // Support both single string and array of assignees
    const assignees = Array.isArray(assignedTo) ? assignedTo : (assignedTo && assignedTo.trim() ? [assignedTo.trim()] : []);

    if (assignees.length > 0) {
      const assigneeClauses = assignees.map(p => `([System.AssignedTo] EVER '${p}' OR [System.ChangedBy] EVER '${p}' OR [System.CreatedBy] EVER '${p}')`).join(' OR ');
      conditions.push(`(${assigneeClauses})`);
    }

    const wiql = `SELECT [System.Id] FROM WorkItems WHERE ${conditions.join(' AND ')} ORDER BY [System.ChangedDate] DESC`;
    console.log('[routes] WIQL query:', wiql);

    // Execute WIQL query to get candidate IDs
    let ids = await ado.queryWorkItemsByWiql(wiql);
    console.log(`[routes] WIQL returned ${ids.length} candidate work item IDs`);

    // Filter by exact user activity within the date range
    // Track which searched person matched each ticket ID so we can group by searched person
    const personToIdsMap = {};
    if (ids.length > 0 && assignees.length > 0) {
      for (const person of assignees) {
        const filtered = await ado.filterIdsByExactUserActivity(ids, person, dateFrom, dateTo);
        personToIdsMap[person] = filtered;
      }
      // Deduplicate all matched IDs
      const allFilteredIds = Object.values(personToIdsMap).flat();
      ids = [...new Set(allFilteredIds)];
      console.log(`[routes] After exact activity filter: ${ids.length} work item IDs`);
    }

    if (ids.length === 0) {
      return res.json({ members: [], totalTickets: 0 });
    }

    // Fetch full details
    const items = await ado.fetchWorkItemsWithFields(ids);

    // Build an ID-to-item lookup
    const itemMap = {};
    for (const item of items) {
      itemMap[item.id] = item;
    }

    // Group tickets
    const groups = {};
    if (assignees.length > 0) {
      // Group by the searched person (from dropdown), not the current assignee
      for (const person of assignees) {
        const matchedIds = personToIdsMap[person] || [];
        if (matchedIds.length === 0) continue;
        if (!groups[person]) groups[person] = [];
        for (const id of matchedIds) {
          const item = itemMap[id];
          if (!item) continue;
          groups[person].push({
            id: item.id,
            title: item.title,
            state: item.state,
            workItemType: item.workItemType,
            assignedTo: item.assignedTo,
            teamProject: item.teamProject,
            areaPath: item.areaPath,
            iterationPath: item.iterationPath,
            storyPoints: item.storyPoints,
            priority: item.priority,
            url: item.url,
          });
        }
      }
    } else {
      // No assignee filter — group by current assignedTo (original behavior)
      for (const item of items) {
        const person = item.assignedTo || 'Unassigned';
        if (!groups[person]) groups[person] = [];
        groups[person].push({
          id: item.id,
          title: item.title,
          state: item.state,
          workItemType: item.workItemType,
          assignedTo: item.assignedTo,
          teamProject: item.teamProject,
          areaPath: item.areaPath,
          iterationPath: item.iterationPath,
          storyPoints: item.storyPoints,
          priority: item.priority,
          url: item.url,
        });
      }
    }

    // Build response
    let totalTickets = 0;
    let totalStoryPoints = 0;
    const members = Object.entries(groups)
      .map(([name, tickets]) => {
        totalTickets += tickets.length;
        const memberPoints = tickets.reduce((sum, t) => sum + (typeof t.storyPoints === 'number' ? t.storyPoints : 0), 0);
        totalStoryPoints += memberPoints;
        return {
          name,
          ticketCount: tickets.length,
          storyPoints: Math.round(memberPoints * 10) / 10,
          tickets,
        };
      })
      .sort((a, b) => b.ticketCount - a.ticketCount);

    res.json({
      members,
      totalTickets,
      totalStoryPoints: Math.round(totalStoryPoints * 10) / 10,
      totalMembers: members.length,
      dateFrom,
      dateTo,
      iterationPath: iterationPath || null,
    });
  } catch (err) {
    console.error('[routes] POST /api/team-workload error:', err.message);
    res.status(500).json({ error: 'Failed to query team workload' });
  }
});

/**
 * GET /api/team-members
 * Return all team members from Azure DevOps project teams
 * (used for the dropdown in the workload filter).
 */
router.get('/api/team-members', async (_req, res) => {
  try {
    const members = await ado.fetchTeamMembers();
    res.json(members);
  } catch (err) {
    console.error('[routes] GET /api/team-members error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve team members' });
  }
});

/**
 * GET /api/pinned-team-members
 * Return pinned team member display names. Reading this never calls
 * Azure DevOps — it's a locally persisted shortlist so the workload
 * dropdown doesn't have to hit ADO on every server start.
 */
router.get('/api/pinned-team-members', (_req, res) => {
  try {
    res.json(db.getPinnedTeamMembers());
  } catch (err) {
    console.error('[routes] GET /api/pinned-team-members error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve pinned team members' });
  }
});

/**
 * PUT /api/pinned-team-members/:name
 * Pin a team member (by display name) for quick access.
 */
router.put('/api/pinned-team-members/:name', (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Invalid member name' });
    }

    const pinned = db.pinTeamMember(name);
    res.json(pinned);
  } catch (err) {
    console.error('[routes] PUT /api/pinned-team-members/:name error:', err.message);
    res.status(500).json({ error: 'Failed to pin team member' });
  }
});

/**
 * DELETE /api/pinned-team-members/:name
 * Unpin a team member (by display name).
 */
router.delete('/api/pinned-team-members/:name', (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Invalid member name' });
    }

    const pinned = db.unpinTeamMember(name);
    res.json(pinned);
  } catch (err) {
    console.error('[routes] DELETE /api/pinned-team-members/:name error:', err.message);
    res.status(500).json({ error: 'Failed to unpin team member' });
  }
});


/**
 * GET /api/iterations
 * Return project iterations/sprints for workload filter.
 */
router.get('/api/iterations', async (_req, res) => {
  try {
    let iterations = await ado.fetchIterations();
    if (!iterations || iterations.length === 0) {
      iterations = db.getDistinctIterations();
    }
    res.json(iterations);
  } catch (err) {
    console.error('[routes] GET /api/iterations error:', err.message);
    res.json(db.getDistinctIterations());
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SSE — Server-Sent Events
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/events
 * Opens a persistent SSE connection.  The server will push status_change
 * events as they are detected by the poller.
 */
// ---------------------------------------------------------------------------
// PERSONAL NOTES
// ---------------------------------------------------------------------------

/**
 * GET /api/personal-notes
 * Return all personal notes.
 */
router.get('/api/personal-notes', (_req, res) => {
  try {
    res.json(db.getPersonalNotes());
  } catch (err) {
    console.error('[routes] GET /api/personal-notes error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve notes' });
  }
});

/**
 * POST /api/personal-notes
 * Add a personal note.
 * Body: { title: string, description: string }
 */
router.post('/api/personal-notes', (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();

    if (!title) {
      return res.status(400).json({ error: '"title" is required' });
    }

    if (!description) {
      return res.status(400).json({ error: '"description" is required' });
    }

    const note = db.addPersonalNote(title, description);
    res.status(201).json(note);
  } catch (err) {
    console.error('[routes] POST /api/personal-notes error:', err.message);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

/**
 * PUT /api/personal-notes/:noteId
 * Update an existing personal note.
 * Body: { title: string, description: string }
 */
router.put('/api/personal-notes/:noteId', (req, res) => {
  try {
    const noteId = Number(req.params.noteId);
    if (Number.isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid note id' });
    }

    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();

    if (!title) {
      return res.status(400).json({ error: '"title" is required' });
    }

    if (!description) {
      return res.status(400).json({ error: '"description" is required' });
    }

    const updated = db.updatePersonalNote(noteId, title, description);
    if (!updated) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error('[routes] PUT /api/personal-notes/:noteId error:', err.message);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

/**
 * DELETE /api/personal-notes/:noteId
 * Delete a personal note.
 */
router.delete('/api/personal-notes/:noteId', (req, res) => {
  try {
    const noteId = Number(req.params.noteId);
    if (Number.isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid note id' });
    }

    const deleted = db.deletePersonalNote(noteId);
    if (!deleted) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('[routes] DELETE /api/personal-notes/:noteId error:', err.message);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DAILY STANDUP
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/standup
 * Query recently completed/committed work, in-progress tickets, recent state transitions,
 * and notes for a quick daily standup summary.
 * Query param: ?hours=24 (default 24)
 */
router.get('/api/standup', (req, res) => {
  try {
    const hours = Math.max(1, Math.min(720, parseInt(req.query.hours, 10) || 24));
    const data = db.getStandupData(hours);

    const completedOrResolvedStates = new Set(['resolved', 'closed', 'done', 'completed', 'qa passed']);
    const inProgressStates = new Set(['active', 'in progress', 'in development', 'qa', 'in qa', 'ready for qa', 'new']);

    // Completed: code_committed tickets OR transitioned to resolved/closed in the window
    const completedMap = new Map();

    for (const t of data.tickets) {
      if (t.code_committed) {
        completedMap.set(t.id, {
          ...t,
          reason: 'Code Committed',
        });
      }
    }

    for (const h of data.history) {
      const stateLower = (h.new_state || '').toLowerCase();
      if (completedOrResolvedStates.has(stateLower)) {
        if (!completedMap.has(h.ticket_id)) {
          completedMap.set(h.ticket_id, {
            id: h.ticket_id,
            ado_id: h.ado_id,
            title: h.title,
            state: h.new_state,
            work_item_type: h.work_item_type,
            assigned_to: h.assigned_to,
            url: h.url,
            code_committed: h.code_committed,
            reason: `State moved to ${h.new_state}`,
          });
        }
      }
    }

    // In Progress: tracked tickets not yet committed, in active states
    const inProgressList = data.tickets.filter((t) => {
      const stateLower = (t.state || '').toLowerCase();
      return !t.code_committed && (inProgressStates.has(stateLower) || !completedMap.has(t.id));
    });

    res.json({
      hours,
      generatedAt: new Date().toISOString(),
      completed: Array.from(completedMap.values()),
      inProgress: inProgressList,
      recentTransitions: data.history,
      commitNotes: data.commitNotes,
      personalNotes: data.personalNotes,
    });
  } catch (err) {
    console.error('[routes] GET /api/standup error:', err.message);
    res.status(500).json({ error: 'Failed to generate standup data' });
  }
});

router.get('/api/events', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // Send an initial comment so the client knows the connection is alive
  res.write(':connected\n\n');

  // Register with the poller
  poller.addClient(res);

  // Clean up when the client disconnects
  req.on('close', () => {
    poller.removeClient(res);
  });
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = router;
