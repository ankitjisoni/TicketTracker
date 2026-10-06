# Azure DevOps Ticket Tracker

A real-time status tracker, team workload analyzer, and personal worklog dashboard for Azure DevOps work items.

## Features

- **Real-Time Status Monitoring**: Live push updates via Server-Sent Events (SSE) with audio alerts and notification history.
- **Code Committed Tracker**: Mark and track tickets ready for deployment / code committed milestones.
- **Commit & Progress Notes**: Add custom notes with target status tags per ticket.
- **Team Workload Analyzer**: Query work items across date ranges, pin frequently viewed team members, and export to Excel.
- **Personal Notes Scratchpad**: Quick personal note-taking board with persistence.
- **Modern Dark UI**: Responsive, glassmorphism design system built with vanilla CSS.

## Architecture & Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (`better-sqlite3` with WAL mode)
- **Real-Time Updates**: Server-Sent Events (SSE) + background poller
- **Integration**: Azure DevOps REST API v7.1
- **Frontend**: Vanilla HTML5, CSS3 (Custom Design Tokens), JavaScript

## Quick Start

### 1. Prerequisites
- Node.js 18+ installed

### 2. Configuration
Copy `.env.example` to `.env` and fill in your Azure DevOps credentials:

```bash
cp .env.example .env
```

Set the following variables:
- `ADO_ORG`: Your Azure DevOps organization name
- `ADO_PROJECT`: Your Azure DevOps project name
- `ADO_PAT`: Personal Access Token with read access to Work Items
- `POLL_INTERVAL_MS`: Polling interval in ms (default: `30000` = 30s)
- `PORT`: Server port (default: `3000`)

### 3. Installation & Run
```bash
npm install
npm run dev
```

Or on Windows, simply double-click `start-server.bat`.

Open [http://localhost:3000](http://localhost:3000) in your browser.
