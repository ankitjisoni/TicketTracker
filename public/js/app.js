/* ============================================================
   App Module — Application controller & state
   ============================================================ */

// eslint-disable-next-line no-unused-vars
const App = (() => {
  'use strict';

  /* ----------------------------------------------------------
     State
     ---------------------------------------------------------- */
  let tickets = [];
  let selectedTicketId = null;
  let eventSource = null;
  let unreadCount = 0;
  let searchQuery = '';
  let committedFilter = 'all'; // 'all' | 'committed' | 'not-committed'
  let notifications = [];
  let personalNotes = [];
  let notesLoaded = false;
  let boardFilters = { search: '', assignee: '', type: '', commit: 'all' };
  const MAX_NOTIFICATIONS = 30;

  /* ----------------------------------------------------------
     API Service
     ---------------------------------------------------------- */
  const api = {
    async _fetch(url, opts = {}) {
      try {
        const res = await fetch(url, {
          headers: { 'Content-Type': 'application/json', ...opts.headers },
          ...opts,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error || err.message || `HTTP ${res.status}`);
        }
        /* 204 No Content */
        if (res.status === 204) return null;
        return res.json();
      } catch (err) {
        UI.showToast(err.message || 'Network error', 'error');
        throw err;
      }
    },

    getTickets() {
      return this._fetch('/api/tickets');
    },

    addTicket(adoId) {
      return this._fetch('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({ adoId }),
      });
    },

    deleteTicket(id) {
      return this._fetch(`/api/tickets/${id}`, { method: 'DELETE' });
    },

    refreshTicket(id) {
      return this._fetch(`/api/tickets/${id}/refresh`);
    },

    refreshAllTickets() {
      return this._fetch('/api/tickets/refresh-all', { method: 'POST' });
    },

    setCodeCommitted(id, committed) {
      return this._fetch(`/api/tickets/${id}/code-committed`, {
        method: 'PATCH',
        body: JSON.stringify({ committed }),
      });
    },

    getHistory(id) {
      return this._fetch(`/api/tickets/${id}/history`);
    },

    getNotes(id) {
      return this._fetch(`/api/tickets/${id}/notes`);
    },

    addNote(ticketId, noteText, targetStatus) {
      return this._fetch(`/api/tickets/${ticketId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ noteText, targetStatus }),
      });
    },

    updateNote(noteId, noteText, targetStatus) {
      return this._fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify({ noteText, targetStatus }),
      });
    },

    deleteNote(noteId) {
      return this._fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
    },

    getPinnedTeamMembers() {
      return this._fetch('/api/pinned-team-members');
    },

    pinTeamMember(name) {
      return this._fetch(`/api/pinned-team-members/${encodeURIComponent(name)}`, { method: 'PUT' });
    },

    unpinTeamMember(name) {
      return this._fetch(`/api/pinned-team-members/${encodeURIComponent(name)}`, { method: 'DELETE' });
    },

    getPersonalNotes() {
      return this._fetch('/api/personal-notes');
    },

    addPersonalNote(title, description) {
      return this._fetch('/api/personal-notes', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      });
    },

    updatePersonalNote(id, title, description) {
      return this._fetch(`/api/personal-notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, description }),
      });
    },

    deletePersonalNote(id) {
      return this._fetch(`/api/personal-notes/${id}`, { method: 'DELETE' });
    },

    uploadImage(dataUrl, filename) {
      return this._fetch('/api/upload-image', {
        method: 'POST',
        body: JSON.stringify({ dataUrl, filename }),
      });
    },

    getStandupData(hours = 24) {
      return this._fetch(`/api/standup?hours=${hours}`);
    },

    getIterations() {
      return this._fetch('/api/iterations');
    },

    updateTicketState(id, state) {
      return this._fetch(`/api/tickets/${id}/state`, {
        method: 'PATCH',
        body: JSON.stringify({ state }),
      });
    },

    getReleaseNotes({ iterationPath = '', scope = 'completed', version = '' } = {}) {
      const q = new URLSearchParams();
      if (iterationPath) q.set('iterationPath', iterationPath);
      if (scope) q.set('scope', scope);
      if (version) q.set('version', version);
      return this._fetch(`/api/release-notes?${q.toString()}`);
    },
  };

  /* ----------------------------------------------------------
     SSE — Server-Sent Events
     ---------------------------------------------------------- */
  function connectSSE() {
    if (eventSource) {
      eventSource.close();
    }

    eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      UI.updateConnectionStatus(true);
    };

    eventSource.onerror = () => {
      UI.updateConnectionStatus(false);
      /* EventSource reconnects automatically */
    };

    eventSource.addEventListener('connected', () => {
      UI.updateConnectionStatus(true);
    });

    eventSource.addEventListener('status_change', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleStatusChange(data);
      } catch { /* ignore parse errors */ }
    });

    eventSource.addEventListener('ticket_updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleTicketUpdated(data);
      } catch { /* ignore parse errors */ }
    });

    /* Generic message fallback */
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'ticket_updated') handleTicketUpdated(data);
        else if (data.type === 'status_change') handleStatusChange(data);
      } catch { /* ignore */ }
    };
  }

  function handleTicketUpdated(data) {
    if (!data) return;
    const ticketId = data.ticketId || data.id || (data.ticket && data.ticket.id);
    const idx = tickets.findIndex((t) => t.id === ticketId);

    if (idx !== -1) {
      if (data.ticket) {
        tickets[idx] = { ...tickets[idx], ...data.ticket };
      } else {
        if (data.newState) tickets[idx].state = data.newState;
        if (data.newAssignee !== undefined) tickets[idx].assigned_to = data.newAssignee;
        if (data.title) tickets[idx].title = data.title;
        if (data.changedAt) tickets[idx].changed_date = data.changedAt;
      }
      renderFilteredList();
      if (selectedTicketId === ticketId) {
        loadTicketDetail(selectedTicketId);
      }
    } else if (data.ticket) {
      tickets.unshift(data.ticket);
      renderFilteredList();
    }

    if (data.assigneeChanged) {
      const from = data.oldAssignee || 'Unassigned';
      const to = data.newAssignee || 'Unassigned';
      UI.showToast(`#${data.adoId || ''}: Assigned to ${to} (was ${from})`, 'info');
      sendDesktopNotification({
        title: `Work Item #${data.adoId} Reassigned 👤`,
        body: `Now assigned to ${to} (was ${from})`,
        ticketId,
      });
    } else if (data.stateChanged) {
      handleStatusChange(data);
    }
  }

  function handleStatusChange(data) {
    /* Update local ticket */
    const idx = tickets.findIndex((t) => t.id === data.ticketId || t.id === data.id);
    if (idx !== -1) {
      if (data.newState || data.new_state) {
        tickets[idx].state = data.newState || data.new_state;
      }
      if (data.assignedTo || data.assigned_to) {
        tickets[idx].assigned_to = data.assignedTo || data.assigned_to;
      }
      if (data.title) tickets[idx].title = data.title;
      tickets[idx].last_fetched_at = data.changedAt || data.timestamp || new Date().toISOString();
    }

    /* Re-render */
    renderFilteredList();

    if (selectedTicketId && (data.ticketId === selectedTicketId || data.id === selectedTicketId)) {
      loadTicketDetail(selectedTicketId);
    }

    /* Toast */
    const idLabel = data.adoId || data.ado_id || data.ticketId || '';
    const from = data.oldState || data.old_state || '?';
    const to = data.newState || data.new_state || '?';
    UI.showToast(`#${idLabel}: ${from} → ${to}`, 'info');

    /* Record in notification history */
    const ticketId = data.ticketId || data.id;
    notifications.unshift({
      id: `${ticketId}-${Date.now()}`,
      ticketId,
      adoId: idLabel,
      title: data.title || (tickets.find((t) => t.id === ticketId) || {}).title,
      oldState: from,
      newState: to,
      changedAt: data.changedAt || data.timestamp || new Date().toISOString(),
    });
    if (notifications.length > MAX_NOTIFICATIONS) notifications.length = MAX_NOTIFICATIONS;
    if (UI.isNotificationPanelVisible()) UI.renderNotificationPanel(notifications);

    /* Unread count */
    unreadCount++;
    UI.updateNotificationCount(unreadCount);

    /* Subtle notification beep */
    playBeep();

    /* Desktop OS notification */
    sendDesktopNotification({
      title: `ADO #${idLabel}: ${from} → ${to}`,
      body: data.title || 'Work item status updated',
      ticketId,
    });
  }

  /* ----------------------------------------------------------
     Notification panel
     ---------------------------------------------------------- */
  function openNotificationPanel() {
    UI.renderNotificationPanel(notifications);
    UI.toggleNotificationPanel(true);
    unreadCount = 0;
    UI.updateNotificationCount(0);
    if ('Notification' in window) {
      UI.updateDesktopNotificationBtn(Notification.permission === 'granted');
    }
  }

  function closeNotificationPanel() {
    UI.toggleNotificationPanel(false);
  }

  function toggleNotificationPanelOpen() {
    if (UI.isNotificationPanelVisible()) {
      closeNotificationPanel();
    } else {
      openNotificationPanel();
    }
  }

  function clearNotifications() {
    notifications = [];
    UI.renderNotificationPanel(notifications);
  }

  function selectNotification(notification) {
    closeNotificationPanel();
    if (!notification || !notification.ticketId) return;
    switchToTab('tickets');
    selectTicket(notification.ticketId);
  }

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch { /* audio not available */ }
  }

  function sendDesktopNotification({ title, body, ticketId, requireInteraction = false }) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2306b6d4"><circle cx="12" cy="12" r="10"/></svg>',
          tag: `ticket-${ticketId || Date.now()}`,
          requireInteraction,
        });
        notif.onclick = () => {
          window.focus();
          switchToTab('tickets');
          if (ticketId) selectTicket(ticketId);
          notif.close();
        };
      } catch (err) {
        console.warn('[notif] Failed to create desktop notification:', err);
      }
    }
  }

  async function testDesktopNotification() {
    if (!('Notification' in window)) {
      UI.showToast('Desktop notifications are not supported in this browser.', 'warning');
      return;
    }

    if (Notification.permission === 'denied') {
      UI.showToast('Desktop alerts are blocked in site permissions. Click the lock/settings icon in your address bar to allow.', 'warning');
      return;
    }

    if (Notification.permission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }

    playBeep();
    sendDesktopNotification({
      title: 'Ticket Tracker Notifications Active 🚀',
      body: 'Native OS desktop notifications are active on Windows! You will be alerted when ticket states change.',
      ticketId: selectedTicketId,
    });
    UI.showToast('Test desktop notification sent!', 'success');
  }

  async function requestNotificationPermission() {
    if (!('Notification' in window)) {
      UI.showToast('Desktop notifications are not supported in this browser.', 'warning');
      return false;
    }
    if (Notification.permission === 'granted') {
      UI.showToast('Desktop alerts are already enabled.', 'info');
      UI.updateDesktopNotificationBtn(true);
      return true;
    }
    if (Notification.permission === 'denied') {
      UI.showToast('Notifications are blocked by your browser settings. Click the site settings icon in your address bar to enable.', 'warning');
      UI.updateDesktopNotificationBtn(false);
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      UI.updateDesktopNotificationBtn(granted);
      if (granted) {
        UI.showToast('Desktop notifications enabled!', 'success');
        sendDesktopNotification({
          title: 'Ticket Tracker Notifications Enabled 🚀',
          body: 'Desktop notifications are active. You will receive updates even when this tab is in background.',
        });
      } else {
        UI.showToast('Notification permission was not granted.', 'warning');
      }
      return granted;
    } catch {
      return false;
    }
  }

  /* ----------------------------------------------------------
     Actions
     ---------------------------------------------------------- */
  async function loadTickets() {
    try {
      const data = await api.getTickets();
      tickets = Array.isArray(data) ? data : (data.tickets || []);
      renderFilteredList();
    } catch { /* handled in _fetch */ }
  }

  async function selectTicket(id) {
    selectedTicketId = id;
    renderFilteredList();
    await loadTicketDetail(id);
  }

  async function loadTicketDetail(id) {
    const ticket = tickets.find((t) => t.id === id);
    UI.renderTicketDetail(ticket);

    /* Load history & notes in parallel */
    const [history, notes] = await Promise.allSettled([
      api.getHistory(id),
      api.getNotes(id),
    ]);

    if (history.status === 'fulfilled') {
      UI.renderStatusHistory(Array.isArray(history.value) ? history.value : (history.value?.history || []));
    } else {
      UI.renderStatusHistory([]);
    }

    if (notes.status === 'fulfilled') {
      UI.renderCommitNotes(Array.isArray(notes.value) ? notes.value : (notes.value?.notes || []));
    } else {
      UI.renderCommitNotes([]);
    }
  }

  async function addTicket(adoId) {
    try {
      const ticket = await api.addTicket(adoId);
      if (ticket) {
        tickets.push(ticket);
        renderFilteredList();
        sendDesktopNotification({
          title: `Work Item #${adoId} Tracked 📋`,
          body: ticket.title || 'Work item added to tracker',
          ticketId: ticket.id,
        });
        UI.showToast(`Ticket #${adoId} added successfully!`, 'success');
      }
    } catch { /* handled in _fetch */ }
  }

  async function refreshSelectedTicket() {
    if (!selectedTicketId) return;
    try {
      const updated = await api.refreshTicket(selectedTicketId);
      if (updated) {
        const idx = tickets.findIndex((t) => t.id === selectedTicketId);
        if (idx !== -1) tickets[idx] = updated;
        renderFilteredList();
        await loadTicketDetail(selectedTicketId);
        UI.showToast('Ticket refreshed from Azure DevOps.', 'success');
      }
    } catch { /* handled */ }
  }

  async function toggleCodeCommitted(id) {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) return;

    const nextValue = !ticket.code_committed;
    try {
      const updated = await api.setCodeCommitted(id, nextValue);
      if (updated) {
        const idx = tickets.findIndex((t) => t.id === id);
        if (idx !== -1) tickets[idx] = updated;
        renderFilteredList();
        if (selectedTicketId === id) UI.setCommittedButtonState(updated.code_committed);
        if (nextValue) {
          sendDesktopNotification({
            title: `Ticket #${ticket.ado_id || ticket.adoId} Completed ✅`,
            body: ticket.title || 'Code committed',
            ticketId: id,
          });
        }
        UI.showToast(
          nextValue ? 'Ticket marked as Completed.' : 'Completed mark removed.',
          'success'
        );
      }
    } catch { /* handled */ }
  }

  async function updateTicketState(id, newState) {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) return;
    const oldState = ticket.state;
    if (oldState === newState) return;

    // Optimistic state update
    ticket.state = newState;
    renderFilteredList();

    try {
      const res = await api.updateTicketState(id, newState);
      if (res) {
        ticket.state = res.state || newState;
        ticket.last_fetched_at = res.last_fetched_at || new Date().toISOString();
        renderFilteredList();
        if (selectedTicketId === id) {
          loadTicketDetail(id);
        }
        UI.showToast(`#${ticket.ado_id || ticket.adoId} moved to ${newState}`, 'success');
      }
    } catch {
      ticket.state = oldState;
      renderFilteredList();
    }
  }

  function deleteSelectedTicket() {
    if (!selectedTicketId) return;
    const ticket = tickets.find((t) => t.id === selectedTicketId);
    UI.showConfirmDeleteModal(ticket, async () => {
      try {
        await api.deleteTicket(selectedTicketId);
        tickets = tickets.filter((t) => t.id !== selectedTicketId);
        selectedTicketId = null;
        renderFilteredList();
        UI.showEmptyState('detail');
        UI.showToast('Ticket removed from tracker.', 'success');
      } catch { /* handled */ }
    });
  }

  async function addNote() {
    if (!selectedTicketId) return;
    const textEl = document.getElementById('new-note-text');
    const text = textEl?.value.trim();

    if (!text) {
      UI.showToast('Please enter note text.', 'warning');
      return;
    }

    try {
      await api.addNote(selectedTicketId, text);
      /* Reload notes */
      const notes = await api.getNotes(selectedTicketId);
      UI.renderCommitNotes(Array.isArray(notes) ? notes : (notes?.notes || []));
      UI.showToast('Note added.', 'success');
    } catch { /* handled */ }
  }

  function editNote(note) {
    UI.showEditNoteModal(note, async (noteId, text) => {
      try {
        await api.updateNote(noteId, text);
        const notes = await api.getNotes(selectedTicketId);
        UI.renderCommitNotes(Array.isArray(notes) ? notes : (notes?.notes || []));
        UI.showToast('Note updated.', 'success');
      } catch { /* handled */ }
    });
  }

  function deleteNote(note) {
    UI.showModal(
      'Delete Note',
      '<p>Are you sure you want to delete this note? This cannot be undone.</p>',
      async () => {
        UI.hideModal();
        try {
          await api.deleteNote(note.id);
          const notes = await api.getNotes(selectedTicketId);
          UI.renderCommitNotes(Array.isArray(notes) ? notes : (notes?.notes || []));
          UI.showToast('Note deleted.', 'success');
        } catch { /* handled */ }
      }
    );

    /* Style confirm as danger */
    const btn = document.getElementById('modal-confirm');
    if (btn) {
      btn.className = 'btn-danger';
      btn.textContent = 'Delete';
    }
  }

  /* ----------------------------------------------------------
     Search / Filter
     ---------------------------------------------------------- */
  function getFilteredTickets() {
    let result = tickets;

    if (committedFilter === 'committed') {
      result = result.filter((t) => !!t.code_committed);
    } else if (committedFilter === 'not-committed') {
      result = result.filter((t) => !t.code_committed);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => {
        const id = String(t.ado_id || t.adoId || '').toLowerCase();
        const title = (t.title || '').toLowerCase();
        return id.includes(q) || title.includes(q);
      });
    }

    return result;
  }

  function renderFilteredList() {
    UI.renderTicketList(getFilteredTickets(), selectedTicketId);
    UI.populateBoardFilters(tickets);
    UI.renderKanbanBoard(tickets, boardFilters);
  }

  function filterTickets(query) {
    searchQuery = query || '';
    renderFilteredList();
  }

  function setCommittedFilter(value) {
    committedFilter = value;
    renderFilteredList();
  }

  /* ----------------------------------------------------------
     Team Workload
     ---------------------------------------------------------- */
  let workloadFiltersLoaded = false;
  let pinnedMembers = [];
  let fullTeamMembersLoaded = false;
  let fullTeamMembersCache = [];

  /**
   * Populate the assignee dropdown from the locally-pinned shortlist,
   * which never calls Azure DevOps. Falls back to a live DevOps fetch
   * only if nothing has been pinned yet (nothing else to pick from).
   */
  async function loadWorkloadFilters() {
    if (workloadFiltersLoaded) return;
    try {
      UI.setAssigneeListLoading(true);
      const [pinned, iterations] = await Promise.all([
        api.getPinnedTeamMembers().catch(() => []),
        api.getIterations().catch(() => []),
      ]);
      pinnedMembers = Array.isArray(pinned) ? pinned : [];
      UI.populateAssigneeList(pinnedMembers);
      if (Array.isArray(iterations)) {
        UI.populateIterationSelect(iterations);
      }
      workloadFiltersLoaded = true;

      if (pinnedMembers.length === 0) {
        await loadAllTeamMembers();
      }
    } catch {
      /* handled by _fetch */
    } finally {
      UI.setAssigneeListLoading(false);
    }
  }

  /** Fetch the full team member list from Azure DevOps (cached after first call). */
  async function loadAllTeamMembers() {
    if (fullTeamMembersLoaded) {
      UI.setAssigneeSourceAll(fullTeamMembersCache);
      return;
    }
    try {
      UI.setAssigneeSourceLoading(true);
      const members = await api._fetch('/api/team-members');
      fullTeamMembersCache = Array.isArray(members) ? members : [];
      fullTeamMembersLoaded = true;
      UI.setAssigneeSourceAll(fullTeamMembersCache);
    } catch {
      /* handled by _fetch */
    } finally {
      UI.setAssigneeSourceLoading(false);
    }
  }

  /** Switch the assignee dropdown back to the pinned-only shortlist. */
  function showPinnedMembers() {
    UI.setAssigneeSourcePinned();
  }

  /** Pin or unpin a team member and persist it for future server starts. */
  async function toggleMemberPin(name) {
    const isPinned = pinnedMembers.includes(name);
    try {
      const updated = isPinned
        ? await api.unpinTeamMember(name)
        : await api.pinTeamMember(name);
      pinnedMembers = Array.isArray(updated) ? updated : [];
      UI.updatePinnedMembers(pinnedMembers);
    } catch { /* handled by _fetch */ }
  }

  async function searchTeamWorkload() {
    const dateFrom = document.getElementById('wl-date-from')?.value;
    const dateTo = document.getElementById('wl-date-to')?.value;
    const iterationPath = document.getElementById('wl-iteration-select')?.value?.trim();
    const assignees = UI.getSelectedAssignees();

    if (!dateFrom || !dateTo) {
      UI.showToast('Please select both From and To dates.', 'warning');
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      UI.showToast('From date must be before To date.', 'warning');
      return;
    }

    UI.renderWorkloadLoading();

    try {
      const body = { dateFrom, dateTo };
      if (iterationPath) {
        body.iterationPath = iterationPath;
      }
      if (assignees.length > 0) {
        body.assignedTo = assignees;
      }
      const data = await api._fetch('/api/team-workload', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      UI.renderWorkloadResults(data);
    } catch {
      UI.renderWorkloadEmpty();
    }
  }

  function clearWorkloadFilters() {
    const dateFrom = document.getElementById('wl-date-from');
    const dateTo = document.getElementById('wl-date-to');
    const iterationSelect = document.getElementById('wl-iteration-select');

    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    if (iterationSelect) iterationSelect.value = '';
    UI.clearSelectedAssignees();

    // Reset results
    const container = document.getElementById('workload-results');
    if (container) {
      container.innerHTML = `
        <div class="workload-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:80px;height:80px;opacity:.2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <h3>Team Workload</h3>
          <p>Set your filters above and click <strong>Search</strong> to see how many tickets each team member has worked on.</p>
        </div>
      `;
    }
  }

  /* ----------------------------------------------------------
     Personal Notes
     ---------------------------------------------------------- */
  async function loadPersonalNotes() {
    if (notesLoaded) {
      UI.renderPersonalNotes(personalNotes);
      return;
    }

    UI.renderPersonalNotesLoading();
    try {
      const data = await api.getPersonalNotes();
      personalNotes = Array.isArray(data) ? data : [];
      notesLoaded = true;
      UI.renderPersonalNotes(personalNotes);
    } catch {
      UI.renderPersonalNotes([]);
    }
  }

  function clearPersonalNoteForm() {
    const titleEl = document.getElementById('personal-note-title');
    const descriptionEl = document.getElementById('personal-note-description');
    if (titleEl) titleEl.value = '';
    if (descriptionEl) descriptionEl.value = '';
    const tray = document.getElementById('personal-note-image-tray');
    if (tray) tray.innerHTML = '';
  }

  async function savePersonalNote() {
    const titleEl = document.getElementById('personal-note-title');
    const descriptionEl = document.getElementById('personal-note-description');
    let title = titleEl?.value.trim();
    const description = descriptionEl?.value.trim();

    if (!description) {
      UI.showToast('Please enter a note description or paste an image.', 'warning');
      descriptionEl?.focus();
      return;
    }

    if (!title) {
      const now = new Date();
      title = `Note — ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
      if (titleEl) titleEl.value = title;
    }

    try {
      const note = await api.addPersonalNote(title, description);
      personalNotes = [note, ...personalNotes.filter((item) => item.id !== note.id)];
      notesLoaded = true;
      clearPersonalNoteForm();
      UI.renderPersonalNotes(personalNotes);
      UI.showToast('Note saved.', 'success');
    } catch { /* handled by _fetch */ }
  }

  function editPersonalNote(note) {
    UI.showEditPersonalNoteModal(note, async (id, title, description) => {
      try {
        const updated = await api.updatePersonalNote(id, title, description);
        personalNotes = personalNotes
          .map((item) => (item.id === id ? updated : item))
          .sort((a, b) => new Date(b.updated_at || b.updatedAt) - new Date(a.updated_at || a.updatedAt));
        UI.renderPersonalNotes(personalNotes);
        UI.showToast('Note updated.', 'success');
      } catch { /* handled by _fetch */ }
    });
  }

  function deletePersonalNote(note) {
    UI.showModal(
      'Delete Note',
      '<p>Are you sure you want to delete this note? This cannot be undone.</p>',
      async () => {
        UI.hideModal();
        try {
          await api.deletePersonalNote(note.id);
          personalNotes = personalNotes.filter((item) => item.id !== note.id);
          UI.renderPersonalNotes(personalNotes);
          UI.showToast('Note deleted.', 'success');
        } catch { /* handled by _fetch */ }
      }
    );

    const btn = document.getElementById('modal-confirm');
    if (btn) {
      btn.className = 'btn-danger';
      btn.textContent = 'Delete';
    }
  }

  /* ----------------------------------------------------------
     Daily Standup Generator
     ---------------------------------------------------------- */
  async function openDailyStandup() {
    try {
      UI.showToast('Fetching standup activity…', 'info');
      const data = await api.getStandupData(24);
      UI.showStandupModal(data, async (hours) => {
        try {
          return await api.getStandupData(hours);
        } catch {
          return null;
        }
      });
    } catch {
      /* handled in _fetch */
    }
  }

  /* ----------------------------------------------------------
     Release Notes Builder
     ---------------------------------------------------------- */
  async function openReleaseNotesBuilder() {
    try {
      UI.showToast('Preparing Release Notes…', 'info');
      const [releaseData, iterations] = await Promise.all([
        api.getReleaseNotes({ scope: 'completed' }),
        api.getIterations().catch(() => []),
      ]);

      const iterationsList = Array.isArray(iterations) ? iterations : [];
      UI.showReleaseNotesModal(
        releaseData,
        async (scopeParams) => {
          try {
            return await api.getReleaseNotes(scopeParams);
          } catch {
            return null;
          }
        },
        iterationsList
      );
    } catch {
      /* handled in _fetch */
    }
  }

  /* ----------------------------------------------------------
     Tab Switching
     ---------------------------------------------------------- */
  function switchToTab(tabName) {
    UI.switchTab(tabName);

    // Sync view mode buttons
    if (tabName === 'tickets') {
      document.querySelectorAll('.view-mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === 'list'));
    } else if (tabName === 'board') {
      document.querySelectorAll('.view-mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === 'board'));
      UI.populateBoardFilters(tickets);
      UI.renderKanbanBoard(tickets, boardFilters);
    }

    // Lazy-load workload filter data when switching to that tab
    if (tabName === 'workload') {
      loadWorkloadFilters();
    }

    if (tabName === 'notes') {
      loadPersonalNotes();
    }
  }

  /* ----------------------------------------------------------
     Initialization
     ---------------------------------------------------------- */
  function init() {
    /* Load data */
    loadTickets();

    /* SSE */
    connectSSE();

    /* Show empty detail state */
    UI.showEmptyState('detail');

    /* Standup button */
    const standupBtn = document.getElementById('btn-standup-trigger');
    if (standupBtn) {
      standupBtn.addEventListener('click', openDailyStandup);
    }

    /* Release Notes button */
    const releaseNotesBtn = document.getElementById('btn-release-notes-trigger');
    if (releaseNotesBtn) {
      releaseNotesBtn.addEventListener('click', openReleaseNotesBuilder);
    }

    /* FAB click */
    const fab = document.getElementById('fab-add');
    if (fab) fab.addEventListener('click', () => UI.showAddTicketModal());

    /* Search */
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => filterTickets(e.target.value.trim()), 200);
      });
    }

    /* Code-committed filter */
    const commitFilterGroup = document.getElementById('commit-filter-group');
    if (commitFilterGroup) {
      commitFilterGroup.querySelectorAll('.commit-filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          commitFilterGroup.querySelectorAll('.commit-filter-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          setCommittedFilter(btn.dataset.filter);
        });
      });
    }

    /* Notification bell */
    const bell = document.getElementById('notification-bell');
    if (bell) {
      bell.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNotificationPanelOpen();
      });
    }

    /* Notification "Clear all" */
    const notifClearBtn = document.getElementById('notification-clear-btn');
    if (notifClearBtn) {
      notifClearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearNotifications();
      });
    }

    /* Desktop alerts enable button */
    const desktopNotifBtn = document.getElementById('btn-desktop-notif');
    if (desktopNotifBtn) {
      if ('Notification' in window) {
        UI.updateDesktopNotificationBtn(Notification.permission === 'granted');
      }
      desktopNotifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        requestNotificationPermission();
      });
    }

    /* Test Desktop Alert button */
    const testNotifBtn = document.getElementById('btn-test-desktop-notif');
    if (testNotifBtn) {
      testNotifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        testDesktopNotification();
      });
    }

    /* Close notification panel when clicking outside it */
    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('notification-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        closeNotificationPanel();
      }
    });

    /* Tab navigation */
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchToTab(btn.dataset.tab);
      });
    });

    /* Workload search button */
    const searchBtn = document.getElementById('btn-wl-search');
    if (searchBtn) {
      searchBtn.addEventListener('click', searchTeamWorkload);
    }

    /* Workload clear button */
    const clearBtn = document.getElementById('btn-wl-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearWorkloadFilters);
    }

    /* Notes tab */
    const saveNoteBtn = document.getElementById('btn-save-personal-note');
    if (saveNoteBtn) {
      saveNoteBtn.addEventListener('click', savePersonalNote);
    }

    const clearNoteBtn = document.getElementById('btn-clear-personal-note');
    if (clearNoteBtn) {
      clearNoteBtn.addEventListener('click', clearPersonalNoteForm);
    }

    /* Personal Notes image paste, drag & drop, and file attachment */
    const personalDescEl = document.getElementById('personal-note-description');
    const personalTrayEl = document.getElementById('personal-note-image-tray');
    const personalFileEl = document.getElementById('file-personal-img');
    const personalAttachBtn = document.getElementById('btn-attach-personal-img');
    if (personalDescEl && personalTrayEl && typeof UI !== 'undefined' && UI.setupImagePasteAndDrop) {
      UI.setupImagePasteAndDrop(personalDescEl, personalTrayEl, personalFileEl, {
        onUploaded: () => {
          const titleEl = document.getElementById('personal-note-title');
          if (titleEl && !titleEl.value.trim()) {
            const now = new Date();
            titleEl.value = `Image Note — ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
          }
        },
      });
      if (personalAttachBtn && personalFileEl) {
        personalAttachBtn.addEventListener('click', () => personalFileEl.click());
      }
    }

    /* View mode toggles (List vs Board) */
    document.querySelectorAll('.view-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchToTab(btn.dataset.view === 'board' ? 'board' : 'tickets');
      });
    });

    /* Kanban Board Toolbar filters */
    const boardSearch = document.getElementById('board-search');
    if (boardSearch) {
      let debounce;
      boardSearch.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          boardFilters.search = e.target.value.trim();
          UI.renderKanbanBoard(tickets, boardFilters);
        }, 150);
      });
    }

    const boardAssignee = document.getElementById('board-filter-assignee');
    if (boardAssignee) {
      boardAssignee.addEventListener('change', (e) => {
        boardFilters.assignee = e.target.value;
        UI.renderKanbanBoard(tickets, boardFilters);
      });
    }

    const boardType = document.getElementById('board-filter-type');
    if (boardType) {
      boardType.addEventListener('change', (e) => {
        boardFilters.type = e.target.value;
        UI.renderKanbanBoard(tickets, boardFilters);
      });
    }

    const boardCommit = document.getElementById('board-filter-commit');
    if (boardCommit) {
      boardCommit.addEventListener('change', (e) => {
        boardFilters.commit = e.target.value;
        UI.renderKanbanBoard(tickets, boardFilters);
      });
    }

    const boardRefreshBtn = document.getElementById('btn-board-refresh');
    if (boardRefreshBtn) {
      boardRefreshBtn.addEventListener('click', async () => {
        UI.showToast('Syncing all tickets from Azure DevOps…', 'info');
        try {
          const fresh = await api.refreshAllTickets();
          if (Array.isArray(fresh)) {
            tickets = fresh;
            renderFilteredList();
            UI.showToast('All tickets live synced with Azure DevOps!', 'success');
            return;
          }
        } catch { /* fallback */ }
        await loadTickets();
      });
    }

    const boardAddBtn = document.getElementById('btn-board-add');
    if (boardAddBtn) {
      boardAddBtn.addEventListener('click', () => {
        UI.showAddTicketModal();
      });
    }

    /* Kanban Drawer close handlers */
    document.getElementById('drawer-close-btn')?.addEventListener('click', () => {
      UI.closeKanbanDrawer();
    });
    document.getElementById('kanban-drawer-backdrop')?.addEventListener('click', () => {
      UI.closeKanbanDrawer();
    });

    /* Keyboard shortcut: Escape closes modal / notification panel / kanban drawer */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        UI.hideModal();
        closeNotificationPanel();
        UI.closeKanbanDrawer();
      }
    });
  }

  /* Auto-init */
  document.addEventListener('DOMContentLoaded', init);

  /* ----------------------------------------------------------
     Public API
     ---------------------------------------------------------- */
  return {
    get tickets() { return tickets; },
    get selectedTicketId() { return selectedTicketId; },
    get unreadCount() { return unreadCount; },
    api,
    selectTicket,
    addTicket,
    refreshSelectedTicket,
    deleteSelectedTicket,
    toggleCodeCommitted,
    selectNotification,
    addNote,
    editNote,
    deleteNote,
    connectSSE,
    searchTeamWorkload,
    loadAllTeamMembers,
    showPinnedMembers,
    toggleMemberPin,
    savePersonalNote,
    editPersonalNote,
    deletePersonalNote,
    loadPersonalNotes,
    requestNotificationPermission,
    testDesktopNotification,
    sendDesktopNotification,
    openDailyStandup,
    openReleaseNotesBuilder,
    updateTicketState,
    switchToTab,
    init,
  };
})();
