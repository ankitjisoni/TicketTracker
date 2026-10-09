<div align="center">

# 🚀 Azure DevOps Ticket Tracker

**A blazing-fast, local-first dashboard for Azure DevOps work items.**  
Real-time Kanban board, team workload analytics, visual commit notes, 1-click release notes builder, and live desktop notifications — without enterprise bloat.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D%2018.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite%20(WAL)-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Features](#-features) • [Why TicketTracker?](#-why-tickettracker) • [Quick Start](#-quick-start) • [Docker](#-docker-setup) • [Configuration](#-configuration) • [Contributing](#-contributing)

</div>

---

## ⚡ Why TicketTracker?

The standard Azure DevOps web interface can feel heavy and slow to navigate during daily standups and sprint planning. **TicketTracker** is built from the ground up as a high-performance companion app:

- **⚡ Blazing Fast & Lightweight**: Zero frontend bundle overhead. Handcrafted vanilla JavaScript and glassmorphism CSS deliver instant load times and 60fps animations.
- **🔒 100% Local-First & Private**: Runs directly on your machine or private server. Your Personal Access Token (PAT) and SQLite database never leave your network.
- **📡 Real-Time SSE Sync**: Background poller automatically detects ADO work item transitions and broadcasts them live across all browser tabs via Server-Sent Events.
- **🖼 Screenshot-Ready Notes**: Paste screenshots directly with <kbd>Ctrl+V</kbd> into notes with instant preview and full-screen lightbox viewing.

---

## ✨ Features

### 📋 Interactive Kanban Board
- **Drag-and-Drop Stages**: Seamlessly transition tickets between `New`, `Active`, `Resolved`, and `Closed`.
- **Live Filtering**: Instant instant search by keyword, assignee, priority (`P1`–`P4`), work item type, and completion status.
- **Slide-Over Detail Drawer**: Comprehensive ticket inspector with full metadata grid, status history timeline, and commit notes.
- **Code Committed Tracker**: Mark items ready for deployment with a single click.

### 👥 Team Workload & Sprint Analytics
- **Member Allocation Breakdown**: Visual workload progress bars and per-developer item distribution.
- **Date & Sprint Scope**: Filter workload by date range or specific ADO sprint iteration path.
- **1-Click Excel / CSV Export**: Generate clean, UTF-8 formatted CSV reports with summary statistics ready for management review.

### 📝 Visual Commit Notes & Scratchpad
- **Rich Note Taking**: Add progress logs and commit notes directly to any ticket.
- **Clipboard Image Pasting**: Hit <kbd>Ctrl+V</kbd> anywhere in the note input to upload and attach screenshots immediately.
- **Lightbox Viewer**: Click any attached screenshot to open a high-res lightbox viewer.
- **Personal Notes Board**: Standalone scratchpad tab for quick private notes and sprint ideas.

### 🚀 Automated Release Notes Builder
- **Instant Generation**: Compile all completed deliverables into polished release documentation with one click.
- **Multi-Format Export**: Copy or download release notes formatted in **Markdown**, **HTML**, or **Plain Text**.
- **Smart Categorization**: Automatically groups items by **Features & Enhancements**, **Bug Fixes**, and **Technical Tasks**, complete with contributor attributions and item notes.

### 🔔 Multi-Channel Notification Engine
- **In-App Toast Banners**: Real-time status change toasts (`#52633: Active → Resolved`).
- **Native OS Desktop Alerts**: HTML5 Notification API sends native Windows / macOS / Linux desktop banners even when the tab is in the background.
- **Audio Chimes**: Gentle Web Audio API sound alerts for critical updates.
- **History Drawer**: Dedicated notification center to review recent work item activity.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- An Azure DevOps account with a Personal Access Token (PAT) with *Work Items (Read)* scope.

### 1. Clone the repository
```bash
git clone https://github.com/ankitjisoni/TicketTracker.git
cd TicketTracker
```

### 2. Configure credentials
Copy the template environment file:
```bash
cp .env.example .env
```

Open `.env` and fill in your details:
```env
# Azure DevOps Configuration
ADO_ORG=your-organization-name
ADO_PROJECT=your-project-name
ADO_PAT=your-personal-access-token

# Polling interval in ms (default: 30000 = 30 seconds)
POLL_INTERVAL_MS=30000

# Server port
PORT=3000
```

### 3. Install and run
```bash
npm install
npm start
```

Or for development with automatic restart:
```bash
npm run dev
```

> **Windows Users:** You can also simply double-click [`start-server.bat`](start-server.bat) to launch the server!

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🐳 Docker Setup

Run TicketTracker in a lightweight Docker container with zero setup:

```bash
docker compose up -d
```

Your data and uploaded images will persist in `./data` and `./public/uploads`.

---

## ⚙️ Configuration Reference

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `ADO_ORG` | **Yes** | — | Your Azure DevOps organization name |
| `ADO_PROJECT` | **Yes** | — | Your Azure DevOps project name |
| `ADO_PAT` | **Yes** | — | Personal Access Token (PAT) with `Work Items: Read` permission |
| `POLL_INTERVAL_MS`| No | `30000` | Background polling interval in milliseconds |
| `PORT` | No | `3000` | HTTP port for the web dashboard |

---

## 🏛 Architecture

```text
TicketTracker/
├── server.js              # Express app, SSE broker, and server entry point
├── src/
│   ├── ado-client.js      # Azure DevOps REST API client
│   ├── db.js              # SQLite database (WAL mode) schema & queries
│   ├── poller.js          # Background polling engine with SSE broadcast
│   └── routes.js          # REST endpoints (Tickets, Notes, Workload, Uploads)
├── public/                # Zero-build vanilla frontend
│   ├── index.html         # Semantic HTML5 layout
│   ├── css/index.css      # Dark glassmorphism design system
│   ├── js/app.js          # Client controller, SSE listener, desktop notifications
│   └── js/ui.js           # UI rendering, Kanban board, drag & drop, modals
├── Dockerfile             # Multi-stage production container
└── docker-compose.yml     # Container orchestration
```

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn and build. Any contributions you make are **greatly appreciated**!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please review our [Contributing Guidelines](CONTRIBUTING.md) for more details.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

**Enjoying TicketTracker? Star ⭐ the repository to support development and help others discover it!**

</div>
