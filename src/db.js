/**
 * Database module — better-sqlite3 (synchronous SQLite)
 *
 * Initializes the tracker.db database, creates all required tables,
 * and exports CRUD helper functions used by the rest of the app.
 */

const Database = require('better-sqlite3');
const path = require('path');

// Resolve database path relative to project root
const DB_PATH = path.join(__dirname, '..', 'tracker.db');

/** @type {import('better-sqlite3').Database} */
let db;

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * Open the database connection, enable WAL mode & foreign keys,
 * and create tables if they don't already exist.
 */
function initDb() {
  db = new Database(DB_PATH);

  // WAL mode for better concurrent-read performance
  db.pragma('journal_mode = WAL');
  // Enforce foreign-key constraints
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      ado_id          INTEGER UNIQUE NOT NULL,
      title           TEXT,
      state           TEXT,
      assigned_to     TEXT,
      work_item_type  TEXT,
      priority        INTEGER,
      area_path       TEXT,
      iteration_path  TEXT,
      url             TEXT,
      last_fetched_at TEXT,
      code_committed  INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS commit_notes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id     INTEGER NOT NULL,
      note_text     TEXT    NOT NULL,
      target_status TEXT,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS status_history (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id  INTEGER NOT NULL,
      old_state  TEXT,
      new_state  TEXT,
      changed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pinned_team_members (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT UNIQUE NOT NULL,
      pinned_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS personal_notes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_ado_id ON tickets(ado_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_state ON tickets(state);
    CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_status_history_ticket_id ON status_history(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_commit_notes_ticket_id ON commit_notes(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_personal_notes_updated_at ON personal_notes(updated_at);
  `);

  // Migrate existing databases that predate code_committed and story_points
  const ticketColumns = db.prepare('PRAGMA table_info(tickets)').all();
  if (!ticketColumns.some((col) => col.name === 'code_committed')) {
    db.exec('ALTER TABLE tickets ADD COLUMN code_committed INTEGER NOT NULL DEFAULT 0');
  }
  if (!ticketColumns.some((col) => col.name === 'story_points')) {
    db.exec('ALTER TABLE tickets ADD COLUMN story_points REAL DEFAULT NULL');
  }

  console.log('[db] Database initialised at', DB_PATH);
}

// ---------------------------------------------------------------------------
// Tickets — CRUD
// ---------------------------------------------------------------------------

/** Return every tracked ticket, ordered by most-recently created first. */
function getAllTickets() {
  return db.prepare('SELECT * FROM tickets ORDER BY created_at DESC').all();
}

/** Return a single ticket by its internal (PK) id, or undefined. */
function getTicketById(id) {
  return db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
}

/**
 * Insert a new ticket from parsed ADO work-item data.
 * @param {object} item — parsed work-item object from ado-client
 * @returns {object} the newly-inserted ticket row
 */
function addTicket(item) {
  const stmt = db.prepare(`
    INSERT INTO tickets (ado_id, title, state, assigned_to, work_item_type,
                         priority, area_path, iteration_path, story_points, url, last_fetched_at)
    VALUES (@adoId, @title, @state, @assignedTo, @workItemType,
            @priority, @areaPath, @iterationPath, @storyPoints, @url, datetime('now'))
  `);

  const info = stmt.run({
    adoId: item.id,
    title: item.title,
    state: item.state,
    assignedTo: item.assignedTo,
    workItemType: item.workItemType,
    priority: item.priority,
    areaPath: item.areaPath,
    iterationPath: item.iterationPath,
    storyPoints: item.storyPoints ?? null,
    url: item.url,
  });

  return getTicketById(info.lastInsertRowid);
}

/**
 * Remove a ticket (and its cascade-dependents) by internal id.
 * @returns {boolean} true if a row was actually deleted
 */
function deleteTicket(id) {
  const info = db.prepare('DELETE FROM tickets WHERE id = ?').run(id);
  return info.changes > 0;
}

/**
 * Update an existing ticket row with freshly-fetched ADO data.
 * @param {number} ticketId — internal PK
 * @param {object} item    — parsed work-item from ado-client
 * @returns {object} the updated ticket row
 */
function updateTicketFromAdo(ticketId, item) {
  db.prepare(`
    UPDATE tickets
       SET title           = @title,
           state           = @state,
           assigned_to     = @assignedTo,
           work_item_type  = @workItemType,
           priority        = @priority,
           area_path       = @areaPath,
           iteration_path  = @iterationPath,
           story_points    = @storyPoints,
           url             = @url,
           last_fetched_at = datetime('now')
     WHERE id = @ticketId
  `).run({
    ticketId,
    title: item.title,
    state: item.state,
    assignedTo: item.assignedTo,
    workItemType: item.workItemType,
    priority: item.priority,
    areaPath: item.areaPath,
    iterationPath: item.iterationPath,
    storyPoints: item.storyPoints ?? null,
    url: item.url,
  });

  return getTicketById(ticketId);
}

/**
 * Set (or clear) the "code committed" flag for a ticket.
 * @param {number} ticketId — internal PK
 * @param {boolean} committed
 * @returns {object|undefined} the updated ticket row, or undefined if not found
 */
function setCodeCommitted(ticketId, committed) {
  const info = db
    .prepare('UPDATE tickets SET code_committed = ? WHERE id = ?')
    .run(committed ? 1 : 0, ticketId);

  if (info.changes === 0) return undefined;
  return getTicketById(ticketId);
}

// ---------------------------------------------------------------------------
// Commit Notes
// ---------------------------------------------------------------------------

/** Get all commit notes for a ticket, newest first. */
function getCommitNotes(ticketId) {
  return db
    .prepare('SELECT * FROM commit_notes WHERE ticket_id = ? ORDER BY created_at DESC')
    .all(ticketId);
}

/** Add a commit note to a ticket. */
function addCommitNote(ticketId, noteText, targetStatus = null) {
  const info = db.prepare(`
    INSERT INTO commit_notes (ticket_id, note_text, target_status)
    VALUES (?, ?, ?)
  `).run(ticketId, noteText, targetStatus);

  return db.prepare('SELECT * FROM commit_notes WHERE id = ?').get(info.lastInsertRowid);
}

/** Update an existing commit note by its own PK. */
function updateCommitNote(noteId, noteText, targetStatus = null) {
  db.prepare(`
    UPDATE commit_notes
       SET note_text     = ?,
           target_status = ?,
           updated_at    = datetime('now')
     WHERE id = ?
  `).run(noteText, targetStatus, noteId);

  return db.prepare('SELECT * FROM commit_notes WHERE id = ?').get(noteId);
}

/** Delete a commit note by its own PK. Returns true if deleted. */
function deleteCommitNote(noteId) {
  const info = db.prepare('DELETE FROM commit_notes WHERE id = ?').run(noteId);
  return info.changes > 0;
}

// ---------------------------------------------------------------------------
// Status History
// ---------------------------------------------------------------------------

/** Get full status-change history for a ticket, oldest first. */
function getStatusHistory(ticketId) {
  return db
    .prepare('SELECT * FROM status_history WHERE ticket_id = ? ORDER BY changed_at ASC')
    .all(ticketId);
}

/** Record a status transition for a ticket. */
function addStatusChange(ticketId, oldState, newState) {
  const info = db.prepare(`
    INSERT INTO status_history (ticket_id, old_state, new_state)
    VALUES (?, ?, ?)
  `).run(ticketId, oldState, newState);

  return db.prepare('SELECT * FROM status_history WHERE id = ?').get(info.lastInsertRowid);
}

// ---------------------------------------------------------------------------
// Lookup helper (used by poller to find ticket by ADO id)
// ---------------------------------------------------------------------------

/** Return a ticket row by its Azure DevOps work-item id, or undefined. */
function getTicketByAdoId(adoId) {
  return db.prepare('SELECT * FROM tickets WHERE ado_id = ?').get(adoId);
}

// ---------------------------------------------------------------------------
// Team Workload helpers
// ---------------------------------------------------------------------------

/** Return distinct assigned_to values (non-null) from tracked tickets. */
function getDistinctAssignees() {
  return db
    .prepare(
      `SELECT DISTINCT assigned_to FROM tickets
       WHERE assigned_to IS NOT NULL AND assigned_to != ''
       ORDER BY assigned_to ASC`
    )
    .all()
    .map((row) => row.assigned_to);
}

/** Return distinct work_item_type values (non-null) from tracked tickets. */
function getDistinctWorkItemTypes() {
  return db
    .prepare(
      `SELECT DISTINCT work_item_type FROM tickets
       WHERE work_item_type IS NOT NULL AND work_item_type != ''
       ORDER BY work_item_type ASC`
    )
    .all()
    .map((row) => row.work_item_type);
}

/** Return distinct iteration_path values (non-null) from tracked tickets. */
function getDistinctIterations() {
  return db
    .prepare(
      `SELECT DISTINCT iteration_path FROM tickets
       WHERE iteration_path IS NOT NULL AND iteration_path != ''
       ORDER BY iteration_path ASC`
    )
    .all()
    .map((row) => row.iteration_path);
}

// ---------------------------------------------------------------------------
// Pinned Team Members
// ---------------------------------------------------------------------------

/** Return pinned team member display names, alphabetically. */
function getPinnedTeamMembers() {
  return db
    .prepare('SELECT name FROM pinned_team_members ORDER BY name ASC')
    .all()
    .map((row) => row.name);
}

/** Pin a team member for quick access. Idempotent. */
function pinTeamMember(name) {
  db.prepare('INSERT OR IGNORE INTO pinned_team_members (name) VALUES (?)').run(name);
  return getPinnedTeamMembers();
}

/** Unpin a team member. */
function unpinTeamMember(name) {
  db.prepare('DELETE FROM pinned_team_members WHERE name = ?').run(name);
  return getPinnedTeamMembers();
}

// ---------------------------------------------------------------------------
// Personal Notes
// ---------------------------------------------------------------------------

/** Return all personal notes, newest updated first. */
function getPersonalNotes() {
  return db
    .prepare('SELECT * FROM personal_notes ORDER BY datetime(updated_at) DESC, id DESC')
    .all();
}

/** Add a personal note. */
function addPersonalNote(title, description) {
  const info = db.prepare(`
    INSERT INTO personal_notes (title, description)
    VALUES (?, ?)
  `).run(title, description);

  return db.prepare('SELECT * FROM personal_notes WHERE id = ?').get(info.lastInsertRowid);
}

/** Update an existing personal note. */
function updatePersonalNote(noteId, title, description) {
  db.prepare(`
    UPDATE personal_notes
       SET title = ?,
           description = ?,
           updated_at = datetime('now')
     WHERE id = ?
  `).run(title, description, noteId);

  return db.prepare('SELECT * FROM personal_notes WHERE id = ?').get(noteId);
}

/** Delete a personal note. Returns true if deleted. */
function deletePersonalNote(noteId) {
  const info = db.prepare('DELETE FROM personal_notes WHERE id = ?').run(noteId);
  return info.changes > 0;
}

// ---------------------------------------------------------------------------
// Standup Summary
// ---------------------------------------------------------------------------

/**
 * Return activity and status changes within `hours` for the Daily Standup report.
 * @param {number} hours — lookback window in hours (default 24)
 */
function getStandupData(hours = 24) {
  const history = db.prepare(`
    SELECT sh.*, t.ado_id, t.title, t.work_item_type, t.assigned_to, t.url, t.code_committed
    FROM status_history sh
    JOIN tickets t ON t.id = sh.ticket_id
    WHERE datetime(sh.changed_at) >= datetime('now', '-' || ? || ' hours')
    ORDER BY datetime(sh.changed_at) DESC
  `).all(hours);

  const tickets = db.prepare(`
    SELECT * FROM tickets
    ORDER BY code_committed DESC, priority ASC, id DESC
  `).all();

  const commitNotes = db.prepare(`
    SELECT cn.*, t.ado_id, t.title
    FROM commit_notes cn
    JOIN tickets t ON t.id = cn.ticket_id
    WHERE datetime(cn.updated_at) >= datetime('now', '-' || ? || ' hours')
       OR datetime(cn.created_at) >= datetime('now', '-' || ? || ' hours')
    ORDER BY datetime(cn.updated_at) DESC
  `).all(hours, hours);

  const personalNotes = db.prepare(`
    SELECT * FROM personal_notes
    WHERE datetime(updated_at) >= datetime('now', '-' || ? || ' hours')
    ORDER BY datetime(updated_at) DESC
  `).all(hours);

  return {
    hours,
    history,
    tickets,
    commitNotes,
    personalNotes,
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  initDb,
  getAllTickets,
  getTicketById,
  getTicketByAdoId,
  addTicket,
  deleteTicket,
  updateTicketFromAdo,
  setCodeCommitted,
  getCommitNotes,
  addCommitNote,
  updateCommitNote,
  deleteCommitNote,
  getStatusHistory,
  addStatusChange,
  getDistinctAssignees,
  getDistinctWorkItemTypes,
  getDistinctIterations,
  getPinnedTeamMembers,
  pinTeamMember,
  unpinTeamMember,
  getPersonalNotes,
  addPersonalNote,
  updatePersonalNote,
  deletePersonalNote,
  getStandupData,
};

