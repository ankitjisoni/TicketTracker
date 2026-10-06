/* ============================================================
   UI Module — DOM rendering & interactions
   ============================================================ */

// eslint-disable-next-line no-unused-vars
const UI = (() => {
  'use strict';

  /* ----------------------------------------------------------
     SVG icon helpers (inline, no external deps)
     ---------------------------------------------------------- */
  const icons = {
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>',
    externalLink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
    history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><polyline points="12 7 12 12 15 15"/></svg>',
    notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
    commit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>',
    cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h.79a4.5 4.5 0 1 1 0 9Z"/></svg>',
  };

  /* ----------------------------------------------------------
     Helpers
     ---------------------------------------------------------- */
  function createElement(tag, className, innerHTML) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
  }

  function getStatusClass(status) {
    if (!status) return 'new';
    const s = status.toLowerCase().replace(/\s+/g, '');
    const map = {
      new: 'new', active: 'active', resolved: 'resolved',
      closed: 'closed', qa: 'qa', 'inqa': 'qa', 'readyforqa': 'qa',
      'inprogress': 'active', 'done': 'closed',
    };
    return map[s] || 'new';
  }

  function formatTimeAgo(dateString) {
    if (!dateString) return '';
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diff = Math.max(0, now - then);
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }

  /** Format a timestamp as a local date-time, e.g. "01 Oct 2026, 3:45 PM". SQLite stores UTC without a zone marker. */
  function formatDateTime(dateString) {
    if (!dateString) return '';
    const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(dateString);
    const d = new Date(hasZone ? dateString : `${dateString.replace(' ', 'T')}Z`);
    if (Number.isNaN(d.getTime())) return '';
    const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${date}, ${time}`;
  }

  function escapeHtml(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ----------------------------------------------------------
     renderTicketList
     ---------------------------------------------------------- */
  function renderTicketList(tickets, selectedId) {
    const list = document.getElementById('ticket-list');
    if (!list) return;
    list.innerHTML = '';

    const countEl = document.getElementById('ticket-count');
    if (countEl) countEl.textContent = tickets.length;

    if (!tickets.length) {
      const empty = createElement('div', 'empty-state');
      empty.innerHTML = `
        ${icons.ticket.replace('<svg', '<svg style="width:48px;height:48px;opacity:.2"')}
        <p style="margin-top:8px">No tickets tracked yet.<br>Click <strong>+</strong> to add one.</p>
      `;
      list.appendChild(empty);
      return;
    }

    tickets.forEach((t, i) => {
      const isCommitted = !!(t.code_committed);
      const card = createElement(
        'div',
        `ticket-card${t.id === selectedId ? ' active' : ''}${isCommitted ? ' committed' : ''}`
      );
      card.dataset.id = t.id;
      card.style.animationDelay = `${i * 0.04}s`;

      const statusKey = getStatusClass(t.state || t.status);
      const displayStatus = t.state || t.status || 'New';

      card.innerHTML = `
        <div class="ticket-card-header">
          <span class="ticket-ado-id">#${escapeHtml(String(t.ado_id || t.adoId || ''))}</span>
          <div class="ticket-card-header-right">
            <button class="committed-toggle-btn${isCommitted ? ' active' : ''}" data-action="toggle-committed" title="${isCommitted ? 'Completed — click to unmark' : 'Mark as Completed'}">
              ${icons.commit}${isCommitted ? 'Completed' : ''}
            </button>
            <span class="status-badge" data-status="${statusKey}">${escapeHtml(displayStatus)}</span>
          </div>
        </div>
        <div class="ticket-card-title">${escapeHtml(t.title || 'Untitled')}</div>
        <div class="ticket-card-meta">
          <span class="ticket-card-assignee">${icons.user}${escapeHtml(t.assigned_to || t.assignedTo || 'Unassigned')}</span>
          <span class="ticket-card-time">${formatTimeAgo(t.last_fetched_at || t.lastUpdated || t.updatedAt)}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        if (typeof App !== 'undefined' && App.selectTicket) {
          App.selectTicket(t.id);
        }
      });

      card.querySelector('[data-action="toggle-committed"]').addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof App !== 'undefined' && App.toggleCodeCommitted) App.toggleCodeCommitted(t.id);
      });

      list.appendChild(card);
    });
  }

  /* ----------------------------------------------------------
     renderTicketDetail
     ---------------------------------------------------------- */
  function renderTicketDetail(ticket) {
    const container = document.getElementById('ticket-detail');
    if (!container) return;

    if (!ticket) {
      showEmptyState('detail');
      return;
    }

    const statusKey = getStatusClass(ticket.state || ticket.status);
    const displayStatus = ticket.state || ticket.status || 'New';
    const adoUrl = ticket.url || '#';

    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-header-top">
          <a class="detail-ado-id" href="${escapeHtml(adoUrl)}" target="_blank" rel="noopener">
            #${escapeHtml(String(ticket.ado_id || ticket.adoId || ''))} ${icons.externalLink}
          </a>
          <span class="status-badge" data-status="${statusKey}">${escapeHtml(displayStatus)}</span>
        </div>
        <h1 class="detail-title">${escapeHtml(ticket.title || 'Untitled')}</h1>
        <div class="detail-actions">
          <button class="btn-ghost" id="btn-refresh-ticket">${icons.refresh} Refresh</button>
          <button class="${ticket.code_committed ? 'btn-committed active' : 'btn-committed'}" id="btn-toggle-committed">${icons.commit} ${ticket.code_committed ? 'Completed' : 'Mark as Completed'}</button>
          <button class="btn-danger" id="btn-delete-ticket">${icons.trash} Remove</button>
        </div>
      </div>

      <div class="metadata-grid">
        <div class="metadata-item">
          <div class="metadata-label">Type</div>
          <div class="metadata-value">${escapeHtml(ticket.work_item_type || ticket.workItemType || '—')}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Assigned To</div>
          <div class="metadata-value">${escapeHtml(ticket.assigned_to || ticket.assignedTo || 'Unassigned')}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Priority</div>
          <div class="metadata-value">${escapeHtml(String(ticket.priority || '—'))}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Area</div>
          <div class="metadata-value">${escapeHtml(ticket.area_path || ticket.areaPath || '—')}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Iteration</div>
          <div class="metadata-value">${escapeHtml(ticket.iteration_path || ticket.iterationPath || '—')}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Last Updated</div>
          <div class="metadata-value">${formatTimeAgo(ticket.last_fetched_at || ticket.lastUpdated || ticket.updatedAt)}</div>
        </div>
      </div>

      <div id="status-history-section">
        <h3 class="section-title">${icons.history} Status History</h3>
        <div id="status-history"><div class="spinner-wrapper"><div class="spinner"></div></div></div>
      </div>

      <div id="commit-notes-section" style="margin-top:32px">
        <h3 class="section-title">${icons.notes} Commit Notes</h3>
        <div id="commit-notes"><div class="spinner-wrapper"><div class="spinner"></div></div></div>
      </div>
    `;

    /* Attach detail-level event handlers */
    const refreshBtn = document.getElementById('btn-refresh-ticket');
    const deleteBtn = document.getElementById('btn-delete-ticket');
    const committedBtn = document.getElementById('btn-toggle-committed');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (typeof App !== 'undefined' && App.refreshSelectedTicket) App.refreshSelectedTicket();
      });
    }
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (typeof App !== 'undefined' && App.deleteSelectedTicket) App.deleteSelectedTicket();
      });
    }
    if (committedBtn) {
      committedBtn.addEventListener('click', () => {
        if (typeof App !== 'undefined' && App.toggleCodeCommitted) App.toggleCodeCommitted(ticket.id);
      });
    }
  }

  /* ----------------------------------------------------------
     setCommittedButtonState — update the detail toggle button
     in place, without re-rendering the whole detail panel
     ---------------------------------------------------------- */
  function setCommittedButtonState(committed) {
    const btn = document.getElementById('btn-toggle-committed');
    if (btn) {
      btn.classList.toggle('active', !!committed);
      btn.innerHTML = `${icons.commit} ${committed ? 'Completed' : 'Mark as Completed'}`;
    }
  }

  /* ----------------------------------------------------------
     renderStatusHistory
     ---------------------------------------------------------- */
  function renderStatusHistory(history) {
    const container = document.getElementById('status-history');
    if (!container) return;
    container.innerHTML = '';

    if (!history || !history.length) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:var(--font-size-sm);">No status changes recorded.</p>';
      return;
    }

    const timeline = createElement('div', 'timeline');

    history.forEach((entry, i) => {
      const item = createElement('div', 'timeline-item');
      item.style.animationDelay = `${i * 0.06}s`;

      const fromKey = getStatusClass(entry.old_state || entry.fromStatus);
      const toKey = getStatusClass(entry.new_state || entry.toStatus);
      const fromLabel = entry.old_state || entry.fromStatus || '—';
      const toLabel = entry.new_state || entry.toStatus || '—';
      const time = entry.changed_at || entry.changedAt || entry.timestamp;

      item.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-time">${time ? formatTimeAgo(time) : ''}</div>
        <div class="timeline-change">
          <span class="status-badge" data-status="${fromKey}">${escapeHtml(fromLabel)}</span>
          <span class="timeline-arrow">→</span>
          <span class="status-badge" data-status="${toKey}">${escapeHtml(toLabel)}</span>
        </div>
      `;
      timeline.appendChild(item);
    });

    container.appendChild(timeline);
  }

  /* ----------------------------------------------------------
     renderCommitNotes
     ---------------------------------------------------------- */
  function renderCommitNotes(notes) {
    const container = document.getElementById('commit-notes');
    if (!container) return;
    container.innerHTML = '';

    if (notes && notes.length) {
      notes.forEach((note, i) => {
        const card = createElement('div', 'commit-note-card');
        card.style.animationDelay = `${i * 0.04}s`;

        const targetHtml = note.targetStatus || note.target_status
          ? `<span class="commit-note-target">→ ${escapeHtml(note.targetStatus || note.target_status)}</span>`
          : '';

        card.innerHTML = `
          <div class="commit-note-text">${escapeHtml(note.note_text || note.noteText || note.text || '')}</div>
          <div class="commit-note-footer">
            <div class="commit-note-meta">
              ${targetHtml}
              <span class="commit-note-time">${formatTimeAgo(note.createdAt || note.created_at)}</span>
            </div>
            <div class="commit-note-actions">
              <button class="icon-btn" data-action="edit-note" data-note-id="${note.id}" title="Edit">${icons.edit}</button>
              <button class="icon-btn danger" data-action="delete-note" data-note-id="${note.id}" title="Delete">${icons.trash}</button>
            </div>
          </div>
        `;

        /* Note action handlers */
        card.querySelector('[data-action="edit-note"]').addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof App !== 'undefined' && App.editNote) App.editNote(note);
        });
        card.querySelector('[data-action="delete-note"]').addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof App !== 'undefined' && App.deleteNote) App.deleteNote(note);
        });

        container.appendChild(card);
      });
    } else {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:var(--font-size-sm);">No notes yet.</p>';
    }

    /* Add note form */
    const form = createElement('div', 'add-note-form');
    form.innerHTML = `
      <textarea id="new-note-text" placeholder="Write a commit note…"></textarea>
      <div class="add-note-controls">
        <select id="new-note-target-status">
          <option value="">No target status</option>
          <option value="New">New</option>
          <option value="Active">Active</option>
          <option value="QA">QA</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
        <button class="btn-primary" id="btn-add-note">${icons.plus} Add Note</button>
      </div>
    `;
    container.appendChild(form);

    const addBtn = document.getElementById('btn-add-note');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (typeof App !== 'undefined' && App.addNote) App.addNote();
      });
    }
  }

  /* ----------------------------------------------------------
     renderPersonalNotes
     ---------------------------------------------------------- */
  function renderPersonalNotesLoading() {
    const stack = document.getElementById('personal-notes-stack');
    if (stack) {
      stack.innerHTML = '<div class="spinner-wrapper"><div class="spinner"></div></div>';
    }
  }

  function renderPersonalNotes(notes) {
    const stack = document.getElementById('personal-notes-stack');
    const total = document.getElementById('notes-total');
    if (!stack) return;

    const list = Array.isArray(notes) ? notes : [];
    if (total) {
      total.textContent = `${list.length} note${list.length === 1 ? '' : 's'}`;
    }

    stack.innerHTML = '';

    if (!list.length) {
      stack.innerHTML = `
        <div class="notes-empty-state">
          ${icons.notes}
          <h3>No notes saved yet</h3>
          <p>Add a heading and description, then save it to build your notes stack.</p>
        </div>
      `;
      return;
    }

    list.forEach((note, i) => {
      const card = createElement('article', 'personal-note-card');
      card.style.animationDelay = `${Math.min(i, 8) * 0.04}s`;

      const title = note.title || 'Untitled';
      const description = note.description || '';
      const createdAt = note.created_at || note.createdAt;
      const updatedAt = note.updated_at || note.updatedAt || createdAt;
      const wasEdited = !!createdAt && !!updatedAt && createdAt !== updatedAt;
      const stampLabel = wasEdited ? 'Updated' : 'Saved';
      const stamp = formatDateTime(updatedAt);

      card.innerHTML = `
        <div class="personal-note-card-top">
          <span class="personal-note-index">${String(i + 1).padStart(2, '0')}</span>
          <div class="personal-note-actions">
            <button class="icon-btn" data-action="edit-personal-note" title="Edit">${icons.edit}</button>
            <button class="icon-btn danger" data-action="delete-personal-note" title="Delete">${icons.trash}</button>
          </div>
        </div>
        <h4 class="personal-note-title">${escapeHtml(title)}</h4>
        <p class="personal-note-description">${escapeHtml(description)}</p>
        <div class="personal-note-footer">
          <span title="${escapeHtml(stampLabel)} ${escapeHtml(stamp)}">${icons.clock}${stamp ? `${stampLabel} ${escapeHtml(stamp)}` : 'Just now'}</span>
        </div>
      `;

      card.querySelector('[data-action="edit-personal-note"]').addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof App !== 'undefined' && App.editPersonalNote) App.editPersonalNote(note);
      });
      card.querySelector('[data-action="delete-personal-note"]').addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof App !== 'undefined' && App.deletePersonalNote) App.deletePersonalNote(note);
      });

      stack.appendChild(card);
    });
  }

  /* ----------------------------------------------------------
     Toasts
     ---------------------------------------------------------- */
  function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const iconMap = { success: icons.check, error: icons.error, warning: icons.warning, info: icons.info };

    const toast = createElement('div', `toast toast-${type}`);
    toast.innerHTML = `
      <span class="toast-icon">${iconMap[type] || iconMap.info}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
      <button class="toast-close">${icons.close}</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
    container.appendChild(toast);

    const timer = setTimeout(() => removeToast(toast), duration);
    toast._timer = timer;
  }

  function removeToast(toast) {
    if (toast._removed) return;
    toast._removed = true;
    clearTimeout(toast._timer);
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }

  /* ----------------------------------------------------------
     Modal
     ---------------------------------------------------------- */
  function showModal(title, bodyHtml, onConfirm, onCancel) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    overlay.innerHTML = `
      <div class="modal-content">
        <h2 class="modal-title">${escapeHtml(title)}</h2>
        <div class="modal-body">${bodyHtml}</div>
        <div class="modal-footer">
          <button class="btn-ghost" id="modal-cancel">Cancel</button>
          <button class="btn-primary" id="modal-confirm">Confirm</button>
        </div>
      </div>
    `;

    /* Force reflow then show */
    // eslint-disable-next-line no-unused-expressions
    overlay.offsetHeight;
    overlay.classList.add('visible');

    document.getElementById('modal-cancel').addEventListener('click', () => {
      hideModal();
      if (onCancel) onCancel();
    });
    document.getElementById('modal-confirm').addEventListener('click', () => {
      if (onConfirm) onConfirm();
    });

    /* Close on backdrop click */
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        hideModal();
        if (onCancel) onCancel();
      }
    });
  }

  function hideModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('visible');
  }

  function showStandupModal(standupData, onScopeChange) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    let currentFormat = 'markdown'; // 'markdown' | 'plaintext'
    let currentHours = standupData.hours || 24;
    let data = standupData;

    // Default checked states: check all completed and in-progress tickets
    let checkedCompleted = new Set((data.completed || []).map((t) => t.id));
    let checkedInProgress = new Set((data.inProgress || []).map((t) => t.id));
    let checkedNotes = new Set();
    let blockerText = '';

    const todayStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    function generateText() {
      const isMd = currentFormat === 'markdown';
      const lines = [];

      if (isMd) {
        lines.push(`*Daily Standup — ${todayStr}*`);
        lines.push('');
        lines.push('*Yesterday / Completed:*');
      } else {
        lines.push(`Daily Standup — ${todayStr}`);
        lines.push('');
        lines.push('Yesterday / Completed:');
      }

      const completedItems = (data.completed || []).filter((t) => checkedCompleted.has(t.id));
      if (completedItems.length === 0) {
        lines.push(isMd ? '- None' : '• None');
      } else {
        completedItems.forEach((t) => {
          const adoId = t.ado_id || t.adoId || t.id;
          const status = t.state || 'Done';
          const title = t.title || 'Untitled';
          if (isMd) {
            lines.push(`- #${adoId}: ${title} [${status}]`);
          } else {
            lines.push(`• #${adoId}: ${title} [${status}]`);
          }
        });
      }

      lines.push('');
      if (isMd) {
        lines.push('*Today / In Progress:*');
      } else {
        lines.push('Today / In Progress:');
      }

      const inProgressItems = (data.inProgress || []).filter((t) => checkedInProgress.has(t.id));
      if (inProgressItems.length === 0) {
        lines.push(isMd ? '- None' : '• None');
      } else {
        inProgressItems.forEach((t) => {
          const adoId = t.ado_id || t.adoId || t.id;
          const status = t.state || 'Active';
          const title = t.title || 'Untitled';
          if (isMd) {
            lines.push(`- #${adoId}: ${title} [${status}]`);
          } else {
            lines.push(`• #${adoId}: ${title} [${status}]`);
          }
        });
      }

      // Blockers
      lines.push('');
      if (isMd) {
        lines.push('*Blockers / Impediments:*');
      } else {
        lines.push('Blockers / Impediments:');
      }
      const trimmedBlocker = blockerText.trim();
      if (trimmedBlocker) {
        trimmedBlocker.split('\n').forEach((line) => {
          if (line.trim()) lines.push(isMd ? `- ${line.trim()}` : `• ${line.trim()}`);
        });
      } else {
        lines.push(isMd ? '- None' : '• None');
      }

      // Notes (if any selected)
      const noteItems = (data.personalNotes || []).filter((n) => checkedNotes.has(n.id));
      if (noteItems.length > 0) {
        lines.push('');
        lines.push(isMd ? '*Personal Notes:*' : 'Personal Notes:');
        noteItems.forEach((n) => {
          if (isMd) {
            lines.push(`- ${n.title}: ${n.description}`);
          } else {
            lines.push(`• ${n.title}: ${n.description}`);
          }
        });
      }

      return lines.join('\n');
    }

    function renderModalHtml() {
      const completedListHtml = (data.completed || []).length > 0
        ? (data.completed || []).map((t) => `
            <label class="standup-item-row">
              <input type="checkbox" class="standup-checkbox" data-type="completed" data-id="${t.id}" ${checkedCompleted.has(t.id) ? 'checked' : ''} />
              <div class="standup-item-text">
                <strong>#${t.ado_id || t.adoId}</strong>: ${escapeHtml(t.title || 'Untitled')}
                <span class="status-badge" data-status="${getStatusClass(t.state)}" style="display:inline-block;margin-left:4px">${escapeHtml(t.state || 'Done')}</span>
              </div>
            </label>
          `).join('')
        : '<p style="color:var(--text-muted);font-size:11px;margin:4px 0">No completed tickets in this timeframe.</p>';

      const inProgressListHtml = (data.inProgress || []).length > 0
        ? (data.inProgress || []).map((t) => `
            <label class="standup-item-row">
              <input type="checkbox" class="standup-checkbox" data-type="inprogress" data-id="${t.id}" ${checkedInProgress.has(t.id) ? 'checked' : ''} />
              <div class="standup-item-text">
                <strong>#${t.ado_id || t.adoId}</strong>: ${escapeHtml(t.title || 'Untitled')}
                <span class="status-badge" data-status="${getStatusClass(t.state)}" style="display:inline-block;margin-left:4px">${escapeHtml(t.state || 'Active')}</span>
              </div>
            </label>
          `).join('')
        : '<p style="color:var(--text-muted);font-size:11px;margin:4px 0">No active tickets.</p>';

      const personalNotesHtml = (data.personalNotes || []).length > 0
        ? `
          <div class="standup-section-card">
            <div class="standup-section-heading">
              <span>Personal Notes</span>
              <span class="badge">${data.personalNotes.length}</span>
            </div>
            ${data.personalNotes.map((n) => `
              <label class="standup-item-row">
                <input type="checkbox" class="standup-checkbox" data-type="note" data-id="${n.id}" ${checkedNotes.has(n.id) ? 'checked' : ''} />
                <div class="standup-item-text">
                  <strong>${escapeHtml(n.title)}</strong>: ${escapeHtml(n.description)}
                </div>
              </label>
            `).join('')}
          </div>
        `
        : '';

      overlay.innerHTML = `
        <div class="modal-content standup-modal-content">
          <div class="standup-header">
            <div class="standup-title-wrap">
              <h2>Daily Standup Generator</h2>
              <span class="standup-date-tag">${escapeHtml(todayStr)}</span>
            </div>
            <button class="icon-btn" id="standup-close-btn" title="Close">${icons.close}</button>
          </div>

          <div class="standup-toolbar">
            <div class="standup-timeframe-group">
              <span style="font-size:11px;color:var(--text-muted);font-weight:600">Window:</span>
              <button class="standup-pill-btn ${currentHours === 24 ? 'active' : ''}" data-hours="24">24h (Yesterday)</button>
              <button class="standup-pill-btn ${currentHours === 48 ? 'active' : ''}" data-hours="48">48h (2 Days)</button>
              <button class="standup-pill-btn ${currentHours === 72 ? 'active' : ''}" data-hours="72">72h (Monday / Weekend)</button>
            </div>
            <div class="standup-format-group">
              <span style="font-size:11px;color:var(--text-muted);font-weight:600">Format:</span>
              <button class="standup-pill-btn ${currentFormat === 'markdown' ? 'active' : ''}" data-format="markdown">Markdown (Slack/Teams)</button>
              <button class="standup-pill-btn ${currentFormat === 'plaintext' ? 'active' : ''}" data-format="plaintext">Plain Text</button>
            </div>
          </div>

          <div class="standup-layout-grid">
            <div class="standup-selector-column">
              <div class="standup-section-card">
                <div class="standup-section-heading">
                  <span>Completed / Committed</span>
                  <span class="badge">${(data.completed || []).length}</span>
                </div>
                ${completedListHtml}
              </div>

              <div class="standup-section-card">
                <div class="standup-section-heading">
                  <span>In Progress / Today</span>
                  <span class="badge">${(data.inProgress || []).length}</span>
                </div>
                ${inProgressListHtml}
              </div>

              <div class="standup-section-card">
                <div class="standup-section-heading">
                  <span>Blockers & Impediments</span>
                </div>
                <textarea class="standup-blockers-input" id="standup-blockers" placeholder="Enter blockers (or leave empty for 'None')">${escapeHtml(blockerText)}</textarea>
              </div>

              ${personalNotesHtml}
            </div>

            <div class="standup-preview-column">
              <div class="standup-preview-heading">
                <span>Formatted Standup (Editable)</span>
                <span style="font-size:11px;color:var(--text-muted)">Live preview</span>
              </div>
              <textarea class="standup-textarea" id="standup-textarea">${escapeHtml(generateText())}</textarea>
            </div>
          </div>

          <div class="standup-footer">
            <button class="btn-ghost" id="standup-cancel-btn">Close</button>
            <button class="btn-copy-standup" id="btn-copy-standup">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span>Copy to Clipboard</span>
            </button>
          </div>
        </div>
      `;

      bindEvents();
    }

    function updatePreviewOnly() {
      const ta = document.getElementById('standup-textarea');
      if (ta) ta.value = generateText();
    }

    function bindEvents() {
      document.getElementById('standup-close-btn')?.addEventListener('click', hideModal);
      document.getElementById('standup-cancel-btn')?.addEventListener('click', hideModal);

      overlay.querySelectorAll('.standup-checkbox').forEach((cb) => {
        cb.addEventListener('change', () => {
          const id = Number(cb.dataset.id);
          const type = cb.dataset.type;
          if (type === 'completed') {
            if (cb.checked) checkedCompleted.add(id);
            else checkedCompleted.delete(id);
          } else if (type === 'inprogress') {
            if (cb.checked) checkedInProgress.add(id);
            else checkedInProgress.delete(id);
          } else if (type === 'note') {
            if (cb.checked) checkedNotes.add(id);
            else checkedNotes.delete(id);
          }
          updatePreviewOnly();
        });
      });

      const blockerEl = document.getElementById('standup-blockers');
      if (blockerEl) {
        blockerEl.addEventListener('input', (e) => {
          blockerText = e.target.value;
          updatePreviewOnly();
        });
      }

      overlay.querySelectorAll('.standup-timeframe-group .standup-pill-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const hours = Number(btn.dataset.hours);
          if (hours === currentHours) return;
          currentHours = hours;
          if (onScopeChange) {
            btn.textContent = 'Loading…';
            const freshData = await onScopeChange(hours);
            if (freshData) {
              data = freshData;
              checkedCompleted = new Set((data.completed || []).map((t) => t.id));
              checkedInProgress = new Set((data.inProgress || []).map((t) => t.id));
              renderModalHtml();
            }
          }
        });
      });

      overlay.querySelectorAll('.standup-format-group .standup-pill-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          currentFormat = btn.dataset.format;
          overlay.querySelectorAll('.standup-format-group .standup-pill-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          updatePreviewOnly();
        });
      });

      const copyBtn = document.getElementById('btn-copy-standup');
      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          const ta = document.getElementById('standup-textarea');
          const textToCopy = ta ? ta.value : generateText();
          try {
            await navigator.clipboard.writeText(textToCopy);
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Copied! 🎉</span>
            `;
            showToast('Standup summary copied to clipboard!', 'success');
            setTimeout(() => {
              copyBtn.classList.remove('copied');
              copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>Copy to Clipboard</span>
              `;
            }, 2500);
          } catch (err) {
            showToast('Failed to copy text. Please select and copy manually.', 'warning');
          }
        });
      }
    }

    renderModalHtml();
    overlay.offsetHeight;
    overlay.classList.add('visible');
  }

  /* ----------------------------------------------------------
     Release Notes Builder Modal
     ---------------------------------------------------------- */
  function showReleaseNotesModal(releaseData, onScopeChange, iterationsList = []) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    let currentFormat = 'markdown'; // 'markdown' | 'html' | 'plaintext'
    let data = releaseData;
    let title = data.version || 'Release Notes';
    let currentIteration = data.iterationPath || '';
    let currentScope = data.scope || 'completed';

    // Options
    let includeNotes = true;
    let includePoints = true;
    let includeLinks = true;
    let includeContributors = true;

    function getAllItemIds(d) {
      const ids = new Set();
      ['features', 'bugs', 'tasks', 'other'].forEach((k) => {
        (d.categories?.[k] || []).forEach((t) => ids.add(t.id));
      });
      return ids;
    }

    let checkedTickets = getAllItemIds(data);

    function generateContent() {
      const isMd = currentFormat === 'markdown';
      const isHtml = currentFormat === 'html';
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });

      const selectedFeatures = (data.categories?.features || []).filter((t) => checkedTickets.has(t.id));
      const selectedBugs = (data.categories?.bugs || []).filter((t) => checkedTickets.has(t.id));
      const selectedTasks = (data.categories?.tasks || []).filter((t) => checkedTickets.has(t.id));
      const selectedOther = (data.categories?.other || []).filter((t) => checkedTickets.has(t.id));

      const allSelected = [
        ...selectedFeatures,
        ...selectedBugs,
        ...selectedTasks,
        ...selectedOther,
      ];

      const totalItems = allSelected.length;
      const totalPoints = allSelected.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const activeContributors = Array.from(new Set(allSelected.map((t) => t.assignedTo || t.assigned_to).filter(Boolean))).sort();

      if (isMd) {
        const lines = [];
        lines.push(`# 🚀 ${title}`);
        lines.push(`> *Generated on ${dateStr} • Scope: ${currentIteration ? currentIteration : 'All Iterations'}*`);
        lines.push('');
        lines.push('### 📊 Release Summary');
        lines.push(`- **Total Deliverables:** ${totalItems} work item${totalItems !== 1 ? 's' : ''}`);
        if (includePoints && totalPoints > 0) {
          lines.push(`- **Story Points Delivered:** ${Math.round(totalPoints * 10) / 10} pts`);
        }
        lines.push(`- **Features & Enhancements:** ${selectedFeatures.length}`);
        lines.push(`- **Bug Fixes:** ${selectedBugs.length}`);
        if (selectedTasks.length > 0) lines.push(`- **Technical Tasks:** ${selectedTasks.length}`);
        lines.push('');

        function appendMdSection(secTitle, emoji, items) {
          if (!items || items.length === 0) return;
          lines.push(`### ${emoji} ${secTitle} (${items.length})`);
          items.forEach((t) => {
            const idPart = includeLinks && t.url
              ? `[#${t.adoId}](${t.url})`
              : `#${t.adoId}`;
            const pointsPart = includePoints && t.storyPoints != null ? ` \`(${t.storyPoints} pts)\`` : '';
            const assigneePart = includeContributors && (t.assignedTo || t.assigned_to) ? ` — *${t.assignedTo || t.assigned_to}*` : '';
            lines.push(`- **${idPart}**: ${t.title}${pointsPart}${assigneePart}`);

            if (includeNotes && t.notes && t.notes.length > 0) {
              t.notes.forEach((n) => {
                const noteText = n.text || '';
                lines.push(`  - 📝 *Note:* ${noteText}`);
              });
            }
          });
          lines.push('');
        }

        appendMdSection('Features & Enhancements', '🚀', selectedFeatures);
        appendMdSection('Bug Fixes & Improvements', '🐛', selectedBugs);
        appendMdSection('Technical Tasks & Maintenance', '🛠', selectedTasks);
        appendMdSection('Other Work Items', '📋', selectedOther);

        if (includeContributors && activeContributors.length > 0) {
          lines.push('### 👥 Contributors');
          lines.push(activeContributors.map((c) => `- ${c}`).join('\n'));
          lines.push('');
        }

        return lines.join('\n');
      }

      if (isHtml) {
        const parts = [];
        parts.push(`<h1>🚀 ${escapeHtml(title)}</h1>`);
        parts.push(`<p><em>Generated on ${dateStr} &bull; Scope: ${escapeHtml(currentIteration || 'All Sprints')}</em></p>`);
        parts.push(`<h3>📊 Release Summary</h3>`);
        parts.push(`<ul>`);
        parts.push(`  <li><strong>Deliverables:</strong> ${totalItems} work items</li>`);
        if (includePoints && totalPoints > 0) {
          parts.push(`  <li><strong>Story Points:</strong> ${Math.round(totalPoints * 10) / 10} pts</li>`);
        }
        parts.push(`  <li><strong>Features:</strong> ${selectedFeatures.length} | <strong>Bug Fixes:</strong> ${selectedBugs.length}</li>`);
        parts.push(`</ul>`);

        function appendHtmlSection(secTitle, emoji, items) {
          if (!items || items.length === 0) return;
          parts.push(`<h3>${emoji} ${escapeHtml(secTitle)} (${items.length})</h3>`);
          parts.push(`<ul>`);
          items.forEach((t) => {
            const linkHtml = includeLinks && t.url
              ? `<a href="${escapeHtml(t.url)}" target="_blank">#${t.adoId}</a>`
              : `#${t.adoId}`;
            const ptsHtml = includePoints && t.storyPoints != null ? ` <code>(${t.storyPoints} pts)</code>` : '';
            const assignHtml = includeContributors && (t.assignedTo || t.assigned_to) ? ` <em>(${escapeHtml(t.assignedTo || t.assigned_to)})</em>` : '';
            let noteHtml = '';
            if (includeNotes && t.notes && t.notes.length > 0) {
              noteHtml = `<ul>${t.notes.map((n) => `<li>📝 <em>Note:</em> ${escapeHtml(n.text || '')}</li>`).join('')}</ul>`;
            }
            parts.push(`  <li><strong>${linkHtml}</strong>: ${escapeHtml(t.title)}${ptsHtml}${assignHtml}${noteHtml}</li>`);
          });
          parts.push(`</ul>`);
        }

        appendHtmlSection('Features & Enhancements', '🚀', selectedFeatures);
        appendHtmlSection('Bug Fixes & Improvements', '🐛', selectedBugs);
        appendHtmlSection('Technical Tasks & Maintenance', '🛠', selectedTasks);
        appendHtmlSection('Other Items', '📋', selectedOther);

        if (includeContributors && activeContributors.length > 0) {
          parts.push(`<h3>👥 Contributors</h3>`);
          parts.push(`<ul>${activeContributors.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>`);
        }

        return parts.join('\n');
      }

      // Plain text
      const plain = [];
      plain.push(`RELEASE NOTES: ${title.toUpperCase()}`);
      plain.push(`Date: ${dateStr} | Scope: ${currentIteration || 'All Sprints'}`);
      plain.push('--------------------------------------------------');
      plain.push(`SUMMARY: ${totalItems} items delivered (${totalPoints} pts)`);
      plain.push(`Features: ${selectedFeatures.length} | Bugs Fixed: ${selectedBugs.length} | Tasks: ${selectedTasks.length}`);
      plain.push('');

      function appendPlainSection(secTitle, items) {
        if (!items || items.length === 0) return;
        plain.push(`${secTitle.toUpperCase()} (${items.length}):`);
        items.forEach((t) => {
          const pts = includePoints && t.storyPoints != null ? ` (${t.storyPoints} pts)` : '';
          const who = includeContributors && (t.assignedTo || t.assigned_to) ? ` [${t.assignedTo || t.assigned_to}]` : '';
          plain.push(` • #${t.adoId}: ${t.title}${pts}${who}`);
          if (includeNotes && t.notes && t.notes.length > 0) {
            t.notes.forEach((n) => plain.push(`    - Note: ${n.text}`));
          }
        });
        plain.push('');
      }

      appendPlainSection('Features & Enhancements', selectedFeatures);
      appendPlainSection('Bug Fixes & Resolved Issues', selectedBugs);
      appendPlainSection('Technical Tasks', selectedTasks);
      appendPlainSection('Other Items', selectedOther);

      if (includeContributors && activeContributors.length > 0) {
        plain.push(`CONTRIBUTORS: ${activeContributors.join(', ')}`);
      }

      return plain.join('\n');
    }

    function updatePreviewOnly() {
      const ta = document.getElementById('rn-preview-textarea');
      if (ta) ta.value = generateContent();
      const chip = document.getElementById('rn-stats-chip');
      if (chip) {
        chip.textContent = `${checkedTickets.size} item${checkedTickets.size !== 1 ? 's' : ''} selected`;
      }
    }

    function renderModalHtml() {
      const iterSet = new Set(iterationsList);
      ['features', 'bugs', 'tasks', 'other'].forEach((k) => {
        (data.categories?.[k] || []).forEach((t) => {
          if (t.iterationPath) iterSet.add(t.iterationPath);
        });
      });
      const allIterList = Array.from(iterSet).filter(Boolean).sort();

      const iterOptions = ['<option value="">All Sprints / Iterations</option>']
        .concat(
          allIterList.map(
            (it) => `<option value="${escapeAttr(it)}" ${it === currentIteration ? 'selected' : ''}>${escapeHtml(it)}</option>`
          )
        )
        .join('');

      function renderCategoryChecklist(catTitle, emoji, items) {
        if (!items || items.length === 0) return '';
        const rows = items
          .map((t) => {
            const isChecked = checkedTickets.has(t.id);
            const notesCount = (t.notes || []).length;
            const pointsBadge = t.storyPoints != null ? `<span class="kanban-tag kanban-tag-points" style="font-size:10px">${t.storyPoints}p</span>` : '';
            return `
              <label class="rn-item-row">
                <input type="checkbox" class="rn-checkbox" data-id="${t.id}" ${isChecked ? 'checked' : ''} />
                <div class="rn-item-body">
                  <div>
                    <strong>#${t.adoId}</strong>: ${escapeHtml(t.title || 'Untitled')}
                    ${pointsBadge}
                    <span class="status-badge" data-status="${getStatusClass(t.state)}" style="font-size:9px;padding:1px 5px">${escapeHtml(t.state || 'Done')}</span>
                  </div>
                  ${notesCount > 0 ? `<div class="rn-item-notes-preview">📝 ${escapeHtml(t.notes[0].text)}${notesCount > 1 ? ` (+${notesCount - 1} more note${notesCount > 2 ? 's' : ''})` : ''}</div>` : ''}
                </div>
              </label>
            `;
          })
          .join('');

        return `
          <div class="rn-category-section">
            <div class="rn-category-header">
              <span class="rn-category-title">${emoji} ${catTitle}</span>
              <span class="rn-category-count">${items.length}</span>
            </div>
            <div class="rn-items-container">
              ${rows}
            </div>
          </div>
        `;
      }

      const featuresHtml = renderCategoryChecklist('Features & Enhancements', '🚀', data.categories?.features);
      const bugsHtml = renderCategoryChecklist('Bug Fixes & Resolved Issues', '🐛', data.categories?.bugs);
      const tasksHtml = renderCategoryChecklist('Technical Tasks & Maintenance', '🛠', data.categories?.tasks);
      const otherHtml = renderCategoryChecklist('Other Items', '📋', data.categories?.other);

      const checklistHtml = featuresHtml + bugsHtml + tasksHtml + otherHtml || '<p style="color:var(--text-muted);font-size:12px;padding:20px 0;text-align:center">No tickets found for this scope.</p>';

      overlay.innerHTML = `
        <div class="modal-content release-notes-modal-content">
          <div class="modal-header">
            <div class="modal-title" style="display:flex;align-items:center;gap:8px">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;color:#a78bfa">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                <path d="M6 6h10"/><path d="M6 10h10"/><path d="M6 14h6"/>
              </svg>
              <span>Release Notes Builder</span>
            </div>
            <button class="modal-close" id="rn-close-btn">&times;</button>
          </div>

          <div class="rn-layout-grid">
            <!-- Left: Configurations and Checklist -->
            <div class="rn-selector-column">
              <div class="rn-config-card">
                <div class="rn-form-group">
                  <label for="rn-title-input">Release Title / Version</label>
                  <input type="text" id="rn-title-input" class="rn-input" value="${escapeAttr(title)}" placeholder="e.g. Release v2.4.0 — Sprint 17" />
                </div>

                <div class="rn-form-group">
                  <label for="rn-iteration-select">Sprint / Iteration</label>
                  <select id="rn-iteration-select" class="rn-input">
                    ${iterOptions}
                  </select>
                </div>

                <div class="rn-form-group">
                  <label>Scope</label>
                  <div class="rn-pills-row" id="rn-scope-pills">
                    <button class="rn-pill-btn${currentScope === 'completed' ? ' active' : ''}" data-scope="completed">Completed Only</button>
                    <button class="rn-pill-btn${currentScope === 'all' ? ' active' : ''}" data-scope="all">All Tracked</button>
                  </div>
                </div>

                <div class="rn-options-row">
                  <label class="rn-option-label">
                    <input type="checkbox" id="rn-opt-notes" ${includeNotes ? 'checked' : ''} />
                    <span>Include Notes</span>
                  </label>
                  <label class="rn-option-label">
                    <input type="checkbox" id="rn-opt-points" ${includePoints ? 'checked' : ''} />
                    <span>Story Points</span>
                  </label>
                  <label class="rn-option-label">
                    <input type="checkbox" id="rn-opt-links" ${includeLinks ? 'checked' : ''} />
                    <span>DevOps Links</span>
                  </label>
                  <label class="rn-option-label">
                    <input type="checkbox" id="rn-opt-contributors" ${includeContributors ? 'checked' : ''} />
                    <span>Contributors</span>
                  </label>
                </div>
              </div>

              <!-- Ticket Category Checklist -->
              ${checklistHtml}
            </div>

            <!-- Right: Live Preview & Export -->
            <div class="rn-preview-column">
              <div class="rn-preview-header">
                <div class="standup-format-group" id="rn-format-group">
                  <button class="standup-pill-btn${currentFormat === 'markdown' ? ' active' : ''}" data-format="markdown">Markdown</button>
                  <button class="standup-pill-btn${currentFormat === 'html' ? ' active' : ''}" data-format="html">HTML</button>
                  <button class="standup-pill-btn${currentFormat === 'plaintext' ? ' active' : ''}" data-format="plaintext">Plain Text</button>
                </div>
                <span class="rn-stats-chip" id="rn-stats-chip">${checkedTickets.size} items selected</span>
              </div>

              <textarea class="rn-textarea" id="rn-preview-textarea" spellcheck="false">${escapeHtml(generateContent())}</textarea>

              <div class="rn-footer-actions">
                <button class="btn-ghost" id="rn-cancel-btn">Close</button>
                <div class="rn-footer-right">
                  <button class="btn-download-rn" id="btn-download-rn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span>Download</span>
                  </button>
                  <button class="btn-copy-standup" id="btn-copy-rn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      bindEvents();
    }

    function bindEvents() {
      document.getElementById('rn-close-btn')?.addEventListener('click', hideModal);
      document.getElementById('rn-cancel-btn')?.addEventListener('click', hideModal);

      // Title input
      const titleInput = document.getElementById('rn-title-input');
      if (titleInput) {
        titleInput.addEventListener('input', (e) => {
          title = e.target.value.trim() || 'Release Notes';
          updatePreviewOnly();
        });
      }

      // Checkboxes for individual tickets
      overlay.querySelectorAll('.rn-checkbox').forEach((cb) => {
        cb.addEventListener('change', () => {
          const id = Number(cb.dataset.id);
          if (cb.checked) checkedTickets.add(id);
          else checkedTickets.delete(id);
          updatePreviewOnly();
        });
      });

      // Options
      document.getElementById('rn-opt-notes')?.addEventListener('change', (e) => {
        includeNotes = e.target.checked;
        updatePreviewOnly();
      });
      document.getElementById('rn-opt-points')?.addEventListener('change', (e) => {
        includePoints = e.target.checked;
        updatePreviewOnly();
      });
      document.getElementById('rn-opt-links')?.addEventListener('change', (e) => {
        includeLinks = e.target.checked;
        updatePreviewOnly();
      });
      document.getElementById('rn-opt-contributors')?.addEventListener('change', (e) => {
        includeContributors = e.target.checked;
        updatePreviewOnly();
      });

      // Scope pills
      overlay.querySelectorAll('#rn-scope-pills .rn-pill-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const newScope = btn.dataset.scope;
          if (newScope === currentScope) return;
          currentScope = newScope;
          overlay.querySelectorAll('#rn-scope-pills .rn-pill-btn').forEach((b) => b.classList.toggle('active', b.dataset.scope === currentScope));
          if (onScopeChange) {
            btn.textContent = 'Loading…';
            const fresh = await onScopeChange({ iterationPath: currentIteration, scope: currentScope });
            if (fresh) {
              data = fresh;
              checkedTickets = getAllItemIds(data);
              renderModalHtml();
            }
          }
        });
      });

      // Iteration select change
      const iterSelect = document.getElementById('rn-iteration-select');
      if (iterSelect) {
        iterSelect.addEventListener('change', async (e) => {
          currentIteration = e.target.value;
          if (currentIteration && !titleInput?.value.trim()) {
            title = currentIteration.split('\\').pop();
          }
          if (onScopeChange) {
            const fresh = await onScopeChange({ iterationPath: currentIteration, scope: currentScope });
            if (fresh) {
              data = fresh;
              checkedTickets = getAllItemIds(data);
              renderModalHtml();
            }
          }
        });
      }

      // Format pills
      overlay.querySelectorAll('#rn-format-group .standup-pill-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          currentFormat = btn.dataset.format;
          overlay.querySelectorAll('#rn-format-group .standup-pill-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          updatePreviewOnly();
        });
      });

      // Copy button
      const copyBtn = document.getElementById('btn-copy-rn');
      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          const ta = document.getElementById('rn-preview-textarea');
          const content = ta ? ta.value : generateContent();
          try {
            await navigator.clipboard.writeText(content);
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Copied! 🎉</span>
            `;
            showToast('Release Notes copied to clipboard!', 'success');
            setTimeout(() => {
              copyBtn.classList.remove('copied');
              copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>Copy</span>
              `;
            }, 2500);
          } catch {
            showToast('Failed to copy. Please copy manually from the editor.', 'warning');
          }
        });
      }

      // Download button
      const downloadBtn = document.getElementById('btn-download-rn');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
          const ta = document.getElementById('rn-preview-textarea');
          const content = ta ? ta.value : generateContent();
          const ext = currentFormat === 'markdown' ? 'md' : (currentFormat === 'html' ? 'html' : 'txt');
          const mime = currentFormat === 'markdown' ? 'text/markdown;charset=utf-8' : (currentFormat === 'html' ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8');
          const cleanTitle = (title || 'Release_Notes').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
          const filename = `${cleanTitle}.${ext}`;

          const blob = new Blob([content], { type: mime });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast(`Downloaded ${filename}!`, 'success');
        });
      }
    }

    renderModalHtml();
    overlay.offsetHeight;
    overlay.classList.add('visible');
  }

  function showAddTicketModal() {
    showModal(
      'Track a Work Item',
      `<label>Azure DevOps Work Item ID</label>
       <input type="number" id="modal-ado-id" placeholder="e.g. 12345" autofocus />`,
      () => {
        const input = document.getElementById('modal-ado-id');
        const adoId = input ? parseInt(input.value.trim(), 10) : NaN;
        if (!adoId || isNaN(adoId)) {
          showToast('Please enter a valid numeric work item ID.', 'warning');
          return;
        }
        hideModal();
        if (typeof App !== 'undefined' && App.addTicket) App.addTicket(adoId);
      }
    );

    /* Focus input after animation */
    setTimeout(() => {
      const input = document.getElementById('modal-ado-id');
      if (input) input.focus();
    }, 350);
  }

  function showConfirmDeleteModal(ticket, onConfirm) {
    const label = ticket
      ? `#${ticket.adoId || ticket.ado_id || ticket.id} — ${ticket.title || 'Untitled'}`
      : 'this ticket';

    showModal(
      'Remove Ticket',
      `<p>Are you sure you want to stop tracking <strong>${escapeHtml(label)}</strong>?<br>This will remove it from your tracker (not from Azure DevOps).</p>`,
      () => {
        hideModal();
        if (onConfirm) onConfirm();
      }
    );

    /* Swap confirm button style to danger */
    const btn = document.getElementById('modal-confirm');
    if (btn) {
      btn.className = 'btn-danger';
      btn.textContent = 'Remove';
    }
  }

  function showEditNoteModal(note, onSave) {
    showModal(
      'Edit Note',
      `<label>Note</label>
       <textarea id="modal-edit-note-text">${escapeHtml(note.note_text || note.noteText || note.text || '')}</textarea>
       <label>Target Status</label>
       <select id="modal-edit-note-status">
         <option value="">No target status</option>
         <option value="New"${(note.targetStatus || note.target_status) === 'New' ? ' selected' : ''}>New</option>
         <option value="Active"${(note.targetStatus || note.target_status) === 'Active' ? ' selected' : ''}>Active</option>
         <option value="QA"${(note.targetStatus || note.target_status) === 'QA' ? ' selected' : ''}>QA</option>
         <option value="Resolved"${(note.targetStatus || note.target_status) === 'Resolved' ? ' selected' : ''}>Resolved</option>
         <option value="Closed"${(note.targetStatus || note.target_status) === 'Closed' ? ' selected' : ''}>Closed</option>
       </select>`,
      () => {
        const text = document.getElementById('modal-edit-note-text')?.value.trim();
        const status = document.getElementById('modal-edit-note-status')?.value || '';
        if (!text) {
          showToast('Note text cannot be empty.', 'warning');
          return;
        }
        hideModal();
        if (onSave) onSave(note.id, text, status);
      }
    );

    const btn = document.getElementById('modal-confirm');
    if (btn) btn.textContent = 'Save';

    setTimeout(() => {
      const ta = document.getElementById('modal-edit-note-text');
      if (ta) ta.focus();
    }, 350);
  }

  function showEditPersonalNoteModal(note, onSave) {
    showModal(
      'Edit Note',
      `<label>Heading</label>
       <input type="text" id="modal-personal-note-title" maxlength="120" value="${escapeAttr(note.title || '')}" />
       <label>Description</label>
       <textarea id="modal-personal-note-description">${escapeHtml(note.description || '')}</textarea>`,
      () => {
        const title = document.getElementById('modal-personal-note-title')?.value.trim();
        const description = document.getElementById('modal-personal-note-description')?.value.trim();
        if (!title) {
          showToast('Heading cannot be empty.', 'warning');
          return;
        }
        if (!description) {
          showToast('Description cannot be empty.', 'warning');
          return;
        }
        hideModal();
        if (onSave) onSave(note.id, title, description);
      }
    );

    const btn = document.getElementById('modal-confirm');
    if (btn) btn.textContent = 'Save';

    setTimeout(() => {
      const input = document.getElementById('modal-personal-note-title');
      if (input) input.focus();
    }, 350);
  }

  /* ----------------------------------------------------------
     Misc UI updates
     ---------------------------------------------------------- */
  function updateConnectionStatus(connected) {
    const dot = document.getElementById('connection-dot');
    const label = document.getElementById('connection-label');
    if (dot) {
      dot.classList.toggle('connected', connected);
    }
    if (label) {
      label.textContent = connected ? 'Connected' : 'Disconnected';
    }
  }

  function updateNotificationCount(count) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.add('visible');
    } else {
      badge.classList.remove('visible');
    }
  }

  function updateDesktopNotificationBtn(granted) {
    const btn = document.getElementById('btn-desktop-notif');
    const label = document.getElementById('desktop-notif-label');
    if (!btn || !label) return;
    if (granted) {
      btn.classList.add('active');
      btn.title = 'Desktop alerts are enabled';
      label.textContent = 'Alerts On';
    } else {
      btn.classList.remove('active');
      btn.title = 'Click to enable OS desktop notifications';
      label.textContent = 'Enable Desktop Alerts';
    }
  }

  /* ----------------------------------------------------------
     Notification dropdown panel
     ---------------------------------------------------------- */
  function renderNotificationPanel(notifications) {
    const list = document.getElementById('notification-panel-list');
    if (!list) return;
    list.innerHTML = '';

    if (!notifications || !notifications.length) {
      list.innerHTML = `
        <div class="notification-empty">
          ${icons.bell}
          <p>No notifications yet.<br>Status changes will show up here.</p>
        </div>
      `;
      return;
    }

    notifications.forEach((n, i) => {
      const item = createElement('div', 'notification-item');
      item.style.animationDelay = `${Math.min(i, 8) * 0.03}s`;

      const fromKey = getStatusClass(n.oldState);
      const toKey = getStatusClass(n.newState);

      item.innerHTML = `
        <div class="notification-item-top">
          <span class="notification-item-id">#${escapeHtml(String(n.adoId || ''))}</span>
          <span class="notification-item-time">${formatTimeAgo(n.changedAt)}</span>
        </div>
        <div class="notification-item-title">${escapeHtml(n.title || 'Untitled')}</div>
        <div class="notification-item-change">
          <span class="status-badge" data-status="${fromKey}">${escapeHtml(n.oldState || '—')}</span>
          <span class="timeline-arrow">→</span>
          <span class="status-badge" data-status="${toKey}">${escapeHtml(n.newState || '—')}</span>
        </div>
      `;

      item.addEventListener('click', () => {
        if (typeof App !== 'undefined' && App.selectNotification) App.selectNotification(n);
      });

      list.appendChild(item);
    });
  }

  function toggleNotificationPanel(show) {
    const panel = document.getElementById('notification-panel');
    if (!panel) return;
    panel.classList.toggle('visible', show);
  }

  function isNotificationPanelVisible() {
    const panel = document.getElementById('notification-panel');
    return !!panel && panel.classList.contains('visible');
  }

  function showEmptyState(panel) {
    if (panel === 'detail') {
      const container = document.getElementById('ticket-detail');
      if (!container) return;
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:80px;height:80px;opacity:.2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
          <h3>No Ticket Selected</h3>
          <p>Choose a ticket from the list to see details, status history, and commit notes.</p>
        </div>
      `;
    }
  }

  function setLoading(element, loading) {
    if (!element) return;
    if (loading) {
      element.innerHTML = '<div class="spinner-wrapper"><div class="spinner"></div></div>';
    }
  }

  /* ----------------------------------------------------------
     Tab switching
     ---------------------------------------------------------- */
  function switchTab(tabName) {
    /* Update tab buttons */
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    /* Update tab panels */
    document.querySelectorAll('.tab-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === `panel-${tabName}`);
    });
  }

  /* ----------------------------------------------------------
     Workload — multi-select assignee dropdown
     ---------------------------------------------------------- */

  let _allMembers = [];
  let _selectedMembers = [];
  let _pinnedSet = new Set();
  let _currentSource = 'pinned'; // 'pinned' | 'all'

  /**
   * Populate the assignee multi-select dropdown with checkbox options,
   * defaulting to the locally-pinned shortlist (no Azure DevOps call).
   * @param {string[]} pinnedMembers
   */
  function populateAssigneeList(pinnedMembers) {
    _pinnedSet = new Set(pinnedMembers || []);
    _currentSource = 'pinned';
    _allMembers = [..._pinnedSet].sort((a, b) => a.localeCompare(b));
    _selectedMembers = [];

    const list = document.getElementById('wl-assignee-list');
    if (!list) return;

    _renderSourceToggle();
    _renderAssigneeOptions('');
    _updateAssigneeTags();

    // Set up trigger toggle
    const trigger = document.getElementById('wl-assignee-trigger');
    const multiselect = document.getElementById('wl-assignee-multiselect');
    if (trigger && multiselect) {
      trigger.addEventListener('click', (e) => {
        // Don't toggle if clicking a tag remove button
        if (e.target.closest('.assignee-tag-remove')) return;
        multiselect.classList.toggle('open');
        if (multiselect.classList.contains('open')) {
          const searchInput = document.getElementById('wl-assignee-search');
          if (searchInput) {
            searchInput.value = '';
            setTimeout(() => searchInput.focus(), 100);
          }
          _renderAssigneeOptions('');
        }
      });
    }

    // Search input filter
    const searchInput = document.getElementById('wl-assignee-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        _renderAssigneeOptions(e.target.value.trim().toLowerCase());
      });
      // Prevent click from closing dropdown
      searchInput.addEventListener('click', (e) => e.stopPropagation());
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
      const multiselect = document.getElementById('wl-assignee-multiselect');
      if (multiselect && !multiselect.contains(e.target)) {
        multiselect.classList.remove('open');
      }
    });
  }

  /**
   * Render (or re-render) the "Pinned" / "All (DevOps)" source toolbar
   * inside the dropdown, wiring up click handlers each time.
   */
  function _renderSourceToggle() {
    const container = document.getElementById('wl-assignee-source-toggle');
    if (!container) return;

    container.innerHTML = `
      <button class="assignee-source-btn${_currentSource === 'pinned' ? ' active' : ''}" id="wl-source-pinned-btn" data-source="pinned">
        ${icons.pin} Pinned <span class="assignee-source-count">${_pinnedSet.size}</span>
      </button>
      <button class="assignee-source-btn${_currentSource === 'all' ? ' active' : ''}" id="wl-source-all-btn" data-source="all">
        ${icons.cloud} All (DevOps)
      </button>
    `;

    const pinnedBtn = document.getElementById('wl-source-pinned-btn');
    const allBtn = document.getElementById('wl-source-all-btn');

    if (pinnedBtn) {
      pinnedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof App !== 'undefined' && App.showPinnedMembers) App.showPinnedMembers();
      });
    }
    if (allBtn) {
      allBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof App !== 'undefined' && App.loadAllTeamMembers) App.loadAllTeamMembers();
      });
    }
  }

  /** Switch the dropdown back to showing only pinned members (no fetch). */
  function setAssigneeSourcePinned() {
    _currentSource = 'pinned';
    _allMembers = [..._pinnedSet].sort((a, b) => a.localeCompare(b));
    _renderSourceToggle();
    _renderAssigneeOptions(document.getElementById('wl-assignee-search')?.value?.trim().toLowerCase() || '');
  }

  /**
   * Switch the dropdown to show the full list fetched live from Azure DevOps.
   * @param {string[]} members
   */
  function setAssigneeSourceAll(members) {
    _currentSource = 'all';
    _allMembers = Array.isArray(members) ? [...members].sort((a, b) => a.localeCompare(b)) : [];
    _renderSourceToggle();
    _renderAssigneeOptions(document.getElementById('wl-assignee-search')?.value?.trim().toLowerCase() || '');
  }

  /** Show/hide a loading spinner on the "All (DevOps)" toolbar button. */
  function setAssigneeSourceLoading(isLoading) {
    const btn = document.getElementById('wl-source-all-btn');
    if (!btn) return;
    btn.classList.toggle('loading', !!isLoading);
    btn.disabled = !!isLoading;
  }

  /**
   * Sync the locally-known pinned set after a pin/unpin action.
   * If the "Pinned" view is currently active, the visible list is
   * refreshed to reflect the change immediately.
   * @param {string[]} pinnedMembers
   */
  function updatePinnedMembers(pinnedMembers) {
    _pinnedSet = new Set(pinnedMembers || []);
    if (_currentSource === 'pinned') {
      _allMembers = [..._pinnedSet].sort((a, b) => a.localeCompare(b));
    }
    _renderSourceToggle();
    _renderAssigneeOptions(document.getElementById('wl-assignee-search')?.value?.trim().toLowerCase() || '');
  }

  /**
   * Set loading state for the assignee multiselect.
   * @param {boolean} isLoading
   */
  function setAssigneeListLoading(isLoading) {
    const placeholder = document.getElementById('wl-assignee-placeholder');
    const trigger = document.getElementById('wl-assignee-trigger');

    if (isLoading) {
      if (placeholder) placeholder.textContent = 'Loading team members…';
      if (trigger) {
        trigger.style.pointerEvents = 'none';
        trigger.style.opacity = '0.6';
      }
    } else {
      if (placeholder) placeholder.textContent = 'Select team members (leave empty for all)';
      if (trigger) {
        trigger.style.pointerEvents = 'auto';
        trigger.style.opacity = '1';
      }
    }
  }

  function _renderAssigneeOptions(filter) {
    const list = document.getElementById('wl-assignee-list');
    if (!list) return;
    list.innerHTML = '';

    const filtered = filter
      ? _allMembers.filter(m => m.toLowerCase().includes(filter))
      : _allMembers;

    if (filtered.length === 0) {
      if (_currentSource === 'pinned' && _pinnedSet.size === 0) {
        list.innerHTML = '<div class="assignee-no-results">No pinned members yet.<br>Switch to “All (DevOps)” and pin a few.</div>';
      } else {
        list.innerHTML = '<div class="assignee-no-results">No members found</div>';
      }
      return;
    }

    filtered.forEach(name => {
      const isPinned = _pinnedSet.has(name);
      const option = createElement('div', `assignee-option${_selectedMembers.includes(name) ? ' selected' : ''}`);
      option.innerHTML = `
        <div class="assignee-option-checkbox"></div>
        <span class="assignee-option-name">${escapeHtml(name)}</span>
        <button class="assignee-pin-btn${isPinned ? ' pinned' : ''}" data-name="${escapeHtml(name)}" title="${isPinned ? 'Unpin' : 'Pin for quick access'}">${icons.pin}</button>
      `;
      option.addEventListener('click', (e) => {
        if (e.target.closest('.assignee-pin-btn')) return;
        e.stopPropagation();
        _toggleAssignee(name);
        // Update this option's selected state
        option.classList.toggle('selected', _selectedMembers.includes(name));
        _updateAssigneeTags();
      });
      option.querySelector('.assignee-pin-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof App !== 'undefined' && App.toggleMemberPin) App.toggleMemberPin(name);
      });
      list.appendChild(option);
    });
  }

  function _toggleAssignee(name) {
    const idx = _selectedMembers.indexOf(name);
    if (idx >= 0) {
      _selectedMembers.splice(idx, 1);
    } else {
      _selectedMembers.push(name);
    }
  }

  function _updateAssigneeTags() {
    const tagsEl = document.getElementById('wl-assignee-tags');
    const placeholder = document.getElementById('wl-assignee-placeholder');
    if (!tagsEl) return;

    if (_selectedMembers.length === 0) {
      tagsEl.innerHTML = '';
      if (placeholder) placeholder.style.display = '';
      return;
    }

    if (placeholder) placeholder.style.display = 'none';
    tagsEl.innerHTML = _selectedMembers.map(name => `
      <span class="assignee-tag" data-name="${escapeHtml(name)}">
        ${escapeHtml(name)}
        <span class="assignee-tag-remove" data-name="${escapeHtml(name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
        </span>
      </span>
    `).join('');

    // Attach remove handlers
    tagsEl.querySelectorAll('.assignee-tag-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = btn.dataset.name;
        _toggleAssignee(name);
        _updateAssigneeTags();
        // Update dropdown option if visible
        _renderAssigneeOptions(document.getElementById('wl-assignee-search')?.value?.trim().toLowerCase() || '');
      });
    });
  }

  /**
   * Get the currently selected assignee names.
   * @returns {string[]}
   */
  function getSelectedAssignees() {
    return [..._selectedMembers];
  }

  /**
   * Clear all selected assignees.
   */
  function clearSelectedAssignees() {
    _selectedMembers = [];
    _updateAssigneeTags();
    const searchInput = document.getElementById('wl-assignee-search');
    if (searchInput) searchInput.value = '';
    _renderAssigneeOptions('');
    const multiselect = document.getElementById('wl-assignee-multiselect');
    if (multiselect) multiselect.classList.remove('open');
  }

  /* ----------------------------------------------------------
     Workload — results rendering
     ---------------------------------------------------------- */

  function renderWorkloadLoading() {
    const container = document.getElementById('workload-results');
    if (!container) return;
    container.innerHTML = `
      <div class="workload-loading">
        <div class="spinner"></div>
        <p>Querying Azure DevOps…</p>
      </div>
    `;
  }

  function renderWorkloadEmpty() {
    const container = document.getElementById('workload-results');
    if (!container) return;
    container.innerHTML = `
      <div class="workload-empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:80px;height:80px;opacity:.2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <h3>No Results Found</h3>
        <p>No work items matched your filters. Try adjusting the date range or removing some filters.</p>
      </div>
    `;
  }

  /**
   * Render the workload query results.
   * @param {object} data — response from POST /api/team-workload
   */
  function renderWorkloadResults(data) {
    const container = document.getElementById('workload-results');
    if (!container) return;
    container.innerHTML = '';

    if (!data.members || data.members.length === 0) {
      renderWorkloadEmpty();
      return;
    }

    const maxCount = Math.max(...data.members.map((m) => m.ticketCount));

    // Summary stats bar
    const summaryBar = createElement('div', 'workload-summary-bar');
    const pointsFormatted = data.totalStoryPoints != null ? data.totalStoryPoints : 0;
    summaryBar.innerHTML = `
      <div class="workload-stat-card" style="animation-delay:0s">
        <div class="workload-stat-label">Total Tickets</div>
        <div class="workload-stat-value">${data.totalTickets}</div>
      </div>
      <div class="workload-stat-card" style="animation-delay:0.04s">
        <div class="workload-stat-label">Total Story Points</div>
        <div class="workload-stat-value">${pointsFormatted}<span style="font-size:var(--font-size-sm);font-weight:600;margin-left:4px;color:var(--accent-primary)">pts</span></div>
      </div>
      <div class="workload-stat-card" style="animation-delay:0.08s">
        <div class="workload-stat-label">Team Members</div>
        <div class="workload-stat-value">${data.totalMembers || data.members.length}</div>
      </div>
      <div class="workload-stat-card" style="animation-delay:0.12s">
        <div class="workload-stat-label">Scope</div>
        <div class="workload-stat-value" style="font-size:var(--font-size-md)">${escapeHtml(data.dateFrom || '')} → ${escapeHtml(data.dateTo || '')}</div>
        ${data.iterationPath ? `<div class="workload-stat-sub" title="${escapeHtml(data.iterationPath)}">Sprint: ${escapeHtml(data.iterationPath.split('\\').pop())}</div>` : ''}
      </div>
    `;
    container.appendChild(summaryBar);

    // Export button bar
    const actionsBar = createElement('div', 'workload-actions-bar');
    actionsBar.innerHTML = `
      <button class="btn-export" id="btn-export-excel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        Export to Excel (CSV)
      </button>
    `;
    container.appendChild(actionsBar);

    // Attach export handler
    const exportBtn = document.getElementById('btn-export-excel');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => exportWorkloadToExcel(data));
    }

    // Member list
    const memberList = createElement('div', 'workload-member-list');

    data.members.forEach((member, idx) => {
      const card = createElement('div', 'workload-member-card');
      card.style.animationDelay = `${idx * 0.06}s`;

      // Get initials from name
      const initials = (member.name || '?')
        .split(/\s+/)
        .map((w) => w[0] || '')
        .slice(0, 2)
        .join('');

      // Sort tickets by Area Path, then Status
      const tickets = (member.tickets || []).sort((a, b) => {
        const areaA = (a.areaPath || '').toLowerCase();
        const areaB = (b.areaPath || '').toLowerCase();
        if (areaA < areaB) return -1;
        if (areaA > areaB) return 1;
        
        const statusA = (a.state || '').toLowerCase();
        const statusB = (b.state || '').toLowerCase();
        if (statusA < statusB) return -1;
        if (statusA > statusB) return 1;
        return 0;
      });

      const barWidth = maxCount > 0 ? Math.round((member.ticketCount / maxCount) * 100) : 0;

      // Build ticket rows HTML — now with Story Points, Area, and Iteration
      const ticketRowsHtml = tickets
        .map((t) => {
          const statusKey = getStatusClass(t.state);
          const url = t.url || '#';
          const pointsBadge = t.storyPoints != null
            ? `<span class="member-ticket-points" title="Story Points">${t.storyPoints} pts</span>`
            : '';
          const iterBadge = t.iterationPath
            ? `<span class="member-ticket-iteration" title="${escapeHtml(t.iterationPath)}">${escapeHtml(t.iterationPath.split('\\').pop())}</span>`
            : '';
          return `
            <div class="member-ticket-row">
              <a class="member-ticket-id" href="${escapeHtml(url)}" target="_blank" rel="noopener">#${t.id}</a>
              <span class="member-ticket-title">${escapeHtml(t.title || 'Untitled')}</span>
              ${pointsBadge}
              <span class="member-ticket-project" title="${escapeHtml(t.areaPath || '—')}">${escapeHtml(t.areaPath || '—')}</span>
              ${iterBadge}
              <span class="status-badge" data-status="${statusKey}">${escapeHtml(t.state || 'New')}</span>
              <span class="member-ticket-type">${escapeHtml(t.workItemType || '—')}</span>
              <span class="member-ticket-assigned" title="${escapeHtml(t.assignedTo || 'Unassigned')}">${escapeHtml(t.assignedTo || 'Unassigned')}</span>
            </div>
          `;
        })
        .join('');

      // Calculate Summary
      const assigneeCounts = {};
      tickets.forEach(t => {
        const curr = t.assignedTo || 'Unassigned';
        // Get just the first name for the breakdown if possible, to save space, but let's use the full name for accuracy
        // Since user asked for "Ankit: 0, Shimran: 03" etc. We'll use the first name for a cleaner look
        const firstName = curr.split(' ')[0];
        assigneeCounts[firstName] = (assigneeCounts[firstName] || 0) + 1;
      });
      const memberFirstName = member.name.split(' ')[0];
      if (assigneeCounts[memberFirstName] === undefined) {
        assigneeCounts[memberFirstName] = 0;
      }
      const pad = (n) => n < 10 ? '0' + n : n;
      const summaryItems = Object.entries(assigneeCounts).map(([name, count]) => `${escapeHtml(name)}: ${pad(count)}`);
      
      const summaryHtml = `
        <div class="member-summary-box">
          Assigned to: <strong>${escapeHtml(member.name)}</strong>, 
          ${summaryItems.join(', ')}, 
          Total <strong>${pad(tickets.length)}</strong>
        </div>
      `;

      card.innerHTML = `
        <div class="workload-member-header">
          <div class="member-avatar">${escapeHtml(initials)}</div>
          <div class="member-info">
            <div class="member-name">${escapeHtml(member.name)}</div>
            <div class="member-bar-wrapper">
              <div class="member-bar-track">
                <div class="member-bar-fill" style="width:${barWidth}%"></div>
              </div>
              <span class="member-bar-label">${member.ticketCount} ticket${member.ticketCount !== 1 ? 's' : ''}${member.storyPoints ? ` • ${member.storyPoints} pts` : ''}</span>
            </div>
          </div>
          <span class="member-count-badge">${member.ticketCount}${member.storyPoints ? ` (${member.storyPoints}p)` : ''}</span>
          <svg class="member-expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
        <div class="member-tickets">
          ${ticketRowsHtml}
          ${summaryHtml}
        </div>
      `;

      // Toggle expand on header click
      const header = card.querySelector('.workload-member-header');
      header.addEventListener('click', () => {
        card.classList.toggle('expanded');
      });

      memberList.appendChild(card);
    });

    container.appendChild(memberList);
  }

  /* ----------------------------------------------------------
     Workload — Export to Excel
     ---------------------------------------------------------- */

  /**
   * Export the workload data to an Excel-compatible CSV file with UTF-8 BOM.
   * Eliminates the Excel format mismatch / corrupt file prompt.
   * @param {object} data — the workload response data
   */
  function exportWorkloadToExcel(data) {
    if (!data || !data.members || data.members.length === 0) {
      showToast('No data to export.', 'warning');
      return;
    }

    const dateFrom = data.dateFrom || '';
    const dateTo = data.dateTo || '';

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = [
      ['Team Workload Report'],
      [`Date Range: ${dateFrom} to ${dateTo}${data.iterationPath ? ` | Iteration: ${data.iterationPath}` : ''}`],
      [`Total Tickets: ${data.totalTickets || 0} | Total Story Points: ${data.totalStoryPoints || 0}`],
      [''],
      ['Assigned To', 'Ticket ID', 'Title', 'Story Points', 'Area Path', 'Iteration Path', 'Status', 'Work Item Type', 'Currently Assigned To'],
    ];

    data.members.forEach((member) => {
      (member.tickets || []).forEach((t) => {
        rows.push([
          member.name || '',
          String(t.id || ''),
          t.title || '',
          t.storyPoints != null ? String(t.storyPoints) : '',
          t.areaPath || '',
          t.iterationPath || '',
          t.state || '',
          t.workItemType || '',
          t.assignedTo || 'Unassigned',
        ]);
      });
    });

    rows.push(['']);
    rows.push(['--- Summary Breakdown ---']);

    data.members.forEach((member) => {
      const counts = {};
      (member.tickets || []).forEach((t) => {
        const curr = t.assignedTo || 'Unassigned';
        const firstName = curr.split(' ')[0];
        counts[firstName] = (counts[firstName] || 0) + 1;
      });
      const memberFirstName = member.name.split(' ')[0];
      if (counts[memberFirstName] === undefined) {
        counts[memberFirstName] = 0;
      }
      const pad = (n) => (n < 10 ? '0' + n : n);
      const summaryItems = Object.entries(counts).map(([n, c]) => `${n}: ${pad(c)}`);
      const summaryText = `Assigned to: ${member.name}, ${summaryItems.join(', ')}, Total ${pad((member.tickets || []).length)}`;
      rows.push([summaryText]);
    });

    const csvContent = '\uFEFF' + rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Team_Workload_${dateFrom}_to_${dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Workload report exported to CSV (opens cleanly in Excel)!', 'success');
  }

  /**
   * Populate the Iteration / Sprint select dropdown in workload filters.
   * @param {string[]} iterations
   */
  function populateIterationSelect(iterations) {
    const select = document.getElementById('wl-iteration-select');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">All Sprints / Iterations</option>';
    if (!Array.isArray(iterations) || iterations.length === 0) return;
    iterations.forEach((path) => {
      const opt = document.createElement('option');
      opt.value = path;
      opt.textContent = path;
      if (path === currentVal) opt.selected = true;
      select.appendChild(opt);
    });
  }

  /* ----------------------------------------------------------
     Kanban Board Implementation
     ---------------------------------------------------------- */
  const KANBAN_STAGES = [
    { key: 'new', label: 'New / Backlog', defaultState: 'New' },
    { key: 'active', label: 'Active / In Progress', defaultState: 'Active' },
    { key: 'resolved', label: 'Resolved / QA', defaultState: 'Resolved' },
    { key: 'closed', label: 'Closed / Done', defaultState: 'Closed' },
  ];

  function getKanbanStage(state) {
    if (!state) return 'new';
    const s = String(state).toLowerCase().replace(/[\s\-_]/g, '');
    if (['new', 'proposed', 'todo', 'backlog', 'open'].includes(s)) return 'new';
    if (['active', 'inprogress', 'development', 'committed', 'doing', 'started'].includes(s)) return 'active';
    if (['resolved', 'readyforqa', 'inqa', 'qa', 'review', 'testing', 'codecomplete'].includes(s)) return 'resolved';
    if (['closed', 'done', 'completed', 'removed', 'cancelled'].includes(s)) return 'closed';
    return 'active';
  }

  let _kanbanFilters = { search: '', assignee: '', type: '', commit: 'all' };

  function renderKanbanBoard(tickets, filters = {}) {
    _kanbanFilters = { ..._kanbanFilters, ...filters };
    let filtered = Array.isArray(tickets) ? [...tickets] : [];

    // Filter by search query
    if (_kanbanFilters.search) {
      const q = _kanbanFilters.search.toLowerCase();
      filtered = filtered.filter((t) => {
        const id = String(t.ado_id || t.adoId || '').toLowerCase();
        const title = (t.title || '').toLowerCase();
        const assignee = (t.assigned_to || t.assignedTo || '').toLowerCase();
        return id.includes(q) || title.includes(q) || assignee.includes(q);
      });
    }

    // Filter by assignee
    if (_kanbanFilters.assignee) {
      filtered = filtered.filter((t) => (t.assigned_to || t.assignedTo) === _kanbanFilters.assignee);
    }

    // Filter by work item type
    if (_kanbanFilters.type) {
      filtered = filtered.filter((t) => (t.work_item_type || t.workItemType) === _kanbanFilters.type);
    }

    // Filter by commit status
    if (_kanbanFilters.commit && _kanbanFilters.commit !== 'all') {
      filtered = filtered.filter((t) =>
        _kanbanFilters.commit === 'committed' ? !!t.code_committed : !t.code_committed
      );
    }

    // Overall summary badge
    const totalCount = filtered.length;
    const totalPoints = filtered.reduce(
      (sum, t) => sum + (typeof t.story_points === 'number' ? t.story_points : (typeof t.storyPoints === 'number' ? t.storyPoints : 0)),
      0
    );
    const summaryBadge = document.getElementById('board-summary-badge');
    if (summaryBadge) {
      const ptsFormatted = Math.round(totalPoints * 10) / 10;
      summaryBadge.textContent = `${totalCount} ticket${totalCount !== 1 ? 's' : ''} • ${ptsFormatted} pts`;
    }

    // Group tickets by stage
    const groups = { new: [], active: [], resolved: [], closed: [] };
    filtered.forEach((t) => {
      const stage = getKanbanStage(t.state || t.status);
      if (groups[stage]) {
        groups[stage].push(t);
      } else {
        groups.active.push(t);
      }
    });

    // Render each column
    KANBAN_STAGES.forEach((stageObj) => {
      const listEl = document.getElementById(`cards-stage-${stageObj.key}`);
      const countEl = document.getElementById(`count-stage-${stageObj.key}`);
      const pointsEl = document.getElementById(`points-stage-${stageObj.key}`);
      const colEl = document.getElementById(`kanban-col-${stageObj.key}`);
      if (!listEl) return;

      const items = groups[stageObj.key] || [];
      const stagePoints = items.reduce(
        (sum, t) => sum + (typeof t.story_points === 'number' ? t.story_points : (typeof t.storyPoints === 'number' ? t.storyPoints : 0)),
        0
      );

      if (countEl) countEl.textContent = items.length;
      if (pointsEl) pointsEl.textContent = `${Math.round(stagePoints * 10) / 10} pts`;

      listEl.innerHTML = '';

      if (items.length === 0) {
        listEl.innerHTML = `
          <div class="kanban-empty-col">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/>
            </svg>
            <span>No tickets in this stage</span>
          </div>
        `;
      } else {
        items.forEach((t) => {
          const isCommitted = !!t.code_committed;
          const points = t.story_points ?? t.storyPoints ?? null;
          const pointsBadge = points != null ? `<span class="kanban-tag kanban-tag-points">${points} pts</span>` : '';
          const typeStr = t.work_item_type || t.workItemType || 'Work Item';
          const priority = t.priority;
          const priorityBadge = priority ? `<span class="kanban-tag kanban-tag-priority p${priority}">P${priority}</span>` : '';
          const assignee = t.assigned_to || t.assignedTo || 'Unassigned';
          const initial = assignee.charAt(0) || 'U';
          const area = t.area_path || t.areaPath || '';
          const iter = t.iteration_path || t.iterationPath || '';
          const subPath = iter ? iter.split('\\').pop() : (area ? area.split('\\').pop() : '');

          const card = createElement('div', `kanban-card${isCommitted ? ' committed' : ''}`);
          card.draggable = true;
          card.dataset.id = t.id;
          card.dataset.adoId = t.ado_id || t.adoId;

          card.innerHTML = `
            <div class="kanban-card-top">
              <div class="kanban-card-top-left">
                <a class="kanban-card-id" href="${escapeHtml(t.url || '#')}" target="_blank" rel="noopener">#${escapeHtml(String(t.ado_id || t.adoId || ''))}</a>
                ${pointsBadge}
              </div>
              <div class="kanban-card-top-right">
                <button class="committed-toggle-btn${isCommitted ? ' active' : ''}" data-action="toggle-committed" title="${isCommitted ? 'Completed — click to unmark' : 'Mark as Completed'}">
                  ${icons.commit}
                </button>
              </div>
            </div>
            <div class="kanban-card-tags">
              <span class="kanban-tag kanban-tag-type" data-type="${escapeAttr(typeStr)}">${escapeHtml(typeStr)}</span>
              ${priorityBadge}
              ${subPath ? `<span class="kanban-tag" style="background:rgba(255,255,255,0.04);color:var(--text-muted)" title="${escapeAttr(iter || area)}">${escapeHtml(subPath)}</span>` : ''}
            </div>
            <div class="kanban-card-title" title="${escapeAttr(t.title || 'Untitled')}">${escapeHtml(t.title || 'Untitled')}</div>
            <div class="kanban-card-footer">
              <div class="kanban-card-assignee" title="${escapeAttr(assignee)}">
                <div class="kanban-avatar">${escapeHtml(initial)}</div>
                <span>${escapeHtml(assignee)}</span>
              </div>
              <div class="kanban-card-footer-right">
                <span class="kanban-card-time">${formatTimeAgo(t.last_fetched_at || t.lastUpdated)}</span>
                <select class="kanban-card-move-select" data-action="quick-move" title="Move status">
                  <option value="" disabled selected>Move…</option>
                  <option value="New" ${t.state === 'New' ? 'disabled' : ''}>New</option>
                  <option value="Active" ${t.state === 'Active' ? 'disabled' : ''}>Active</option>
                  <option value="Resolved" ${t.state === 'Resolved' ? 'disabled' : ''}>Resolved</option>
                  <option value="Closed" ${t.state === 'Closed' ? 'disabled' : ''}>Closed</option>
                </select>
              </div>
            </div>
          `;

          // Card drag events
          card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', String(t.id));
            e.dataTransfer.effectAllowed = 'move';
            card.classList.add('dragging');
          });

          card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            document.querySelectorAll('.kanban-column').forEach((col) => col.classList.remove('drag-over'));
          });

          // Card click -> open detail drawer
          card.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('select') || e.target.closest('a')) return;
            openKanbanDrawer(t);
          });

          // Toggle committed
          card.querySelector('[data-action="toggle-committed"]').addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof App !== 'undefined' && App.toggleCodeCommitted) App.toggleCodeCommitted(t.id);
          });

          // Quick move select
          const moveSelect = card.querySelector('[data-action="quick-move"]');
          moveSelect.addEventListener('click', (e) => e.stopPropagation());
          moveSelect.addEventListener('change', (e) => {
            e.stopPropagation();
            const targetState = e.target.value;
            if (targetState && typeof App !== 'undefined' && App.updateTicketState) {
              App.updateTicketState(t.id, targetState);
            }
          });

          listEl.appendChild(card);
        });
      }

      // Column drop listeners
      if (colEl && !colEl.dataset.dropBound) {
        colEl.dataset.dropBound = 'true';
        colEl.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          colEl.classList.add('drag-over');
        });

        colEl.addEventListener('dragleave', (e) => {
          if (!colEl.contains(e.relatedTarget)) {
            colEl.classList.remove('drag-over');
          }
        });

        colEl.addEventListener('drop', (e) => {
          e.preventDefault();
          colEl.classList.remove('drag-over');
          const ticketIdStr = e.dataTransfer.getData('text/plain');
          const ticketId = Number(ticketIdStr);
          if (ticketId && typeof App !== 'undefined' && App.updateTicketState) {
            App.updateTicketState(ticketId, stageObj.defaultState);
          }
        });
      }
    });
  }

  function openKanbanDrawer(ticket) {
    if (!ticket) return;

    const drawer = document.getElementById('kanban-drawer');
    const backdrop = document.getElementById('kanban-drawer-backdrop');
    const idEl = document.getElementById('drawer-ado-id');
    const statusBadge = document.getElementById('drawer-status-badge');
    const adoLink = document.getElementById('drawer-ado-link');
    const body = document.getElementById('kanban-drawer-body');

    if (!drawer || !body) return;

    if (idEl) idEl.textContent = `#${ticket.ado_id || ticket.adoId || ''}`;
    if (statusBadge) {
      statusBadge.dataset.status = getStatusClass(ticket.state || ticket.status);
      statusBadge.textContent = ticket.state || ticket.status || 'New';
    }
    if (adoLink) {
      adoLink.href = ticket.url || '#';
    }

    const isCommitted = !!ticket.code_committed;
    const points = ticket.story_points ?? ticket.storyPoints ?? null;

    body.innerHTML = `
      <h2 style="font-size:var(--font-size-lg);font-weight:700;color:var(--text-primary);line-height:1.4">${escapeHtml(ticket.title || 'Untitled')}</h2>
      
      <div class="metadata-grid">
        <div class="metadata-item">
          <div class="metadata-label">Type</div>
          <div class="metadata-value">${escapeHtml(ticket.work_item_type || ticket.workItemType || '—')}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Assigned To</div>
          <div class="metadata-value">${escapeHtml(ticket.assigned_to || ticket.assignedTo || 'Unassigned')}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Story Points</div>
          <div class="metadata-value" style="color:var(--accent-primary);font-weight:700">${points != null ? `${points} pts` : '—'}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Priority</div>
          <div class="metadata-value">${escapeHtml(String(ticket.priority || '—'))}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Iteration</div>
          <div class="metadata-value" title="${escapeAttr(ticket.iteration_path || ticket.iterationPath || '')}">${escapeHtml((ticket.iteration_path || ticket.iterationPath || '—').split('\\').pop())}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Area</div>
          <div class="metadata-value" title="${escapeAttr(ticket.area_path || ticket.areaPath || '')}">${escapeHtml((ticket.area_path || ticket.areaPath || '—').split('\\').pop())}</div>
        </div>
      </div>

      <div class="detail-actions" style="margin-top:0">
        <button class="btn-ghost" id="drawer-btn-refresh">${icons.refresh} Refresh</button>
        <button class="${isCommitted ? 'btn-committed active' : 'btn-committed'}" id="drawer-btn-toggle-committed">${icons.commit} ${isCommitted ? 'Completed' : 'Mark as Completed'}</button>
        <button class="btn-danger" id="drawer-btn-delete">${icons.trash} Remove</button>
      </div>

      <div style="margin-top:10px">
        <h3 class="section-title">${icons.history} Status History</h3>
        <div id="drawer-status-history"><div class="spinner-wrapper"><div class="spinner"></div></div></div>
      </div>

      <div style="margin-top:16px">
        <h3 class="section-title">${icons.notes} Commit Notes</h3>
        <div id="drawer-commit-notes"><div class="spinner-wrapper"><div class="spinner"></div></div></div>
      </div>
    `;

    // Wire actions
    document.getElementById('drawer-btn-refresh')?.addEventListener('click', async () => {
      if (typeof App !== 'undefined' && App.refreshSelectedTicket) {
        App.selectTicket(ticket.id);
        await App.refreshSelectedTicket();
        const updated = App.tickets.find((t) => t.id === ticket.id);
        if (updated) openKanbanDrawer(updated);
      }
    });

    document.getElementById('drawer-btn-toggle-committed')?.addEventListener('click', async () => {
      if (typeof App !== 'undefined' && App.toggleCodeCommitted) {
        await App.toggleCodeCommitted(ticket.id);
        const updated = App.tickets.find((t) => t.id === ticket.id);
        if (updated) openKanbanDrawer(updated);
      }
    });

    document.getElementById('drawer-btn-delete')?.addEventListener('click', () => {
      closeKanbanDrawer();
      if (typeof App !== 'undefined' && App.deleteSelectedTicket) {
        App.selectTicket(ticket.id);
        App.deleteSelectedTicket();
      }
    });

    document.getElementById('drawer-btn-view-list')?.addEventListener('click', () => {
      closeKanbanDrawer();
      if (typeof App !== 'undefined') {
        App.switchToTab('tickets');
        App.selectTicket(ticket.id);
      }
    });

    // Load history and notes
    if (typeof App !== 'undefined' && App.api) {
      App.api.getHistory(ticket.id).then((history) => {
        renderDrawerStatusHistory(Array.isArray(history) ? history : (history?.history || []));
      }).catch(() => {
        renderDrawerStatusHistory([]);
      });

      App.api.getNotes(ticket.id).then((notes) => {
        renderDrawerCommitNotes(Array.isArray(notes) ? notes : (notes?.notes || []), ticket.id);
      }).catch(() => {
        renderDrawerCommitNotes([], ticket.id);
      });
    }

    drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
  }

  function closeKanbanDrawer() {
    document.getElementById('kanban-drawer')?.classList.remove('open');
    document.getElementById('kanban-drawer-backdrop')?.classList.remove('open');
  }

  function renderDrawerStatusHistory(history) {
    const container = document.getElementById('drawer-status-history');
    if (!container) return;
    container.innerHTML = '';
    if (!history || !history.length) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:var(--font-size-sm)">No status changes recorded.</p>';
      return;
    }
    const timeline = createElement('div', 'timeline');
    history.forEach((entry, i) => {
      const item = createElement('div', 'timeline-item');
      item.style.animationDelay = `${i * 0.04}s`;
      const fromKey = getStatusClass(entry.old_state || entry.fromStatus);
      const toKey = getStatusClass(entry.new_state || entry.toStatus);
      const fromLabel = entry.old_state || entry.fromStatus || '—';
      const toLabel = entry.new_state || entry.toStatus || '—';
      const time = entry.changed_at || entry.changedAt || entry.timestamp;
      item.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-time">${time ? formatTimeAgo(time) : ''}</div>
        <div class="timeline-change">
          <span class="status-badge" data-status="${fromKey}">${escapeHtml(fromLabel)}</span>
          <span class="timeline-arrow">→</span>
          <span class="status-badge" data-status="${toKey}">${escapeHtml(toLabel)}</span>
        </div>
      `;
      timeline.appendChild(item);
    });
    container.appendChild(timeline);
  }

  function renderDrawerCommitNotes(notes, ticketId) {
    const container = document.getElementById('drawer-commit-notes');
    if (!container) return;
    container.innerHTML = '';

    if (notes && notes.length) {
      notes.forEach((note, i) => {
        const card = createElement('div', 'commit-note-card');
        card.style.animationDelay = `${i * 0.04}s`;
        const targetHtml = note.targetStatus || note.target_status
          ? `<span class="commit-note-target">→ ${escapeHtml(note.targetStatus || note.target_status)}</span>`
          : '';
        card.innerHTML = `
          <div class="commit-note-text">${escapeHtml(note.note_text || note.noteText || note.text || '')}</div>
          <div class="commit-note-footer">
            <div class="commit-note-meta">
              ${targetHtml}
              <span class="commit-note-time">${formatTimeAgo(note.createdAt || note.created_at)}</span>
            </div>
            <div class="commit-note-actions">
              <button class="icon-btn" data-action="drawer-edit-note" title="Edit">${icons.edit}</button>
              <button class="icon-btn danger" data-action="drawer-delete-note" title="Delete">${icons.trash}</button>
            </div>
          </div>
        `;
        card.querySelector('[data-action="drawer-edit-note"]').addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof App !== 'undefined' && App.editNote) App.editNote(note);
        });
        card.querySelector('[data-action="drawer-delete-note"]').addEventListener('click', async (e) => {
          e.stopPropagation();
          if (typeof App !== 'undefined' && App.deleteNote) {
            await App.deleteNote(note);
            const freshNotes = await App.api.getNotes(ticketId).catch(() => []);
            renderDrawerCommitNotes(freshNotes, ticketId);
          }
        });
        container.appendChild(card);
      });
    } else {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:var(--font-size-sm)">No notes yet.</p>';
    }

    // Add note form
    const form = createElement('div', 'add-note-form');
    form.innerHTML = `
      <textarea id="drawer-new-note-text" placeholder="Write a note…"></textarea>
      <div class="add-note-controls">
        <select id="drawer-new-note-target">
          <option value="">No target status</option>
          <option value="New">New</option>
          <option value="Active">Active</option>
          <option value="QA">QA</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
        <button class="btn-primary" id="drawer-btn-add-note">${icons.plus} Add Note</button>
      </div>
    `;
    container.appendChild(form);

    form.querySelector('#drawer-btn-add-note')?.addEventListener('click', async () => {
      const textEl = document.getElementById('drawer-new-note-text');
      const targetEl = document.getElementById('drawer-new-note-target');
      const text = textEl?.value?.trim();
      if (!text) {
        showToast('Please enter note text', 'warning');
        return;
      }
      try {
        await App.api.addNote(ticketId, text, targetEl?.value || null);
        showToast('Note added!', 'success');
        const freshNotes = await App.api.getNotes(ticketId).catch(() => []);
        renderDrawerCommitNotes(freshNotes, ticketId);
      } catch (err) {
        showToast(err.message || 'Failed to add note', 'error');
      }
    });
  }

  function populateBoardFilters(tickets) {
    const assigneeSelect = document.getElementById('board-filter-assignee');
    const typeSelect = document.getElementById('board-filter-type');
    if (!Array.isArray(tickets)) return;

    if (assigneeSelect) {
      const currentVal = assigneeSelect.value;
      const assignees = [...new Set(tickets.map((t) => t.assigned_to || t.assignedTo).filter(Boolean))].sort();
      assigneeSelect.innerHTML = '<option value="">All Assignees</option>';
      assignees.forEach((name) => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        if (name === currentVal) opt.selected = true;
        assigneeSelect.appendChild(opt);
      });
    }

    if (typeSelect) {
      const currentVal = typeSelect.value;
      const types = [...new Set(tickets.map((t) => t.work_item_type || t.workItemType).filter(Boolean))].sort();
      typeSelect.innerHTML = '<option value="">All Types</option>';
      types.forEach((type) => {
        const opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type;
        if (type === currentVal) opt.selected = true;
        typeSelect.appendChild(opt);
      });
    }
  }

  /* ----------------------------------------------------------
     Public API
     ---------------------------------------------------------- */
  return {
    renderTicketList,
    renderTicketDetail,
    setCommittedButtonState,
    renderStatusHistory,
    renderCommitNotes,
    renderPersonalNotes,
    renderPersonalNotesLoading,
    showToast,
    showModal,
    hideModal,
    showAddTicketModal,
    showConfirmDeleteModal,
    showEditNoteModal,
    showEditPersonalNoteModal,
    showStandupModal,
    showReleaseNotesModal,
    updateConnectionStatus,
    updateNotificationCount,
    updateDesktopNotificationBtn,
    renderNotificationPanel,
    toggleNotificationPanel,
    isNotificationPanelVisible,
    showEmptyState,
    setLoading,
    formatTimeAgo,
    createElement,
    getStatusClass,
    switchTab,
    populateAssigneeList,
    setAssigneeListLoading,
    setAssigneeSourcePinned,
    setAssigneeSourceAll,
    setAssigneeSourceLoading,
    updatePinnedMembers,
    getSelectedAssignees,
    clearSelectedAssignees,
    populateIterationSelect,
    renderWorkloadResults,
    renderWorkloadLoading,
    renderWorkloadEmpty,
    exportWorkloadToExcel,
    renderKanbanBoard,
    openKanbanDrawer,
    closeKanbanDrawer,
    populateBoardFilters,
  };
})();
