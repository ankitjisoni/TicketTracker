# Contributing to TicketTracker

Thank you for your interest in contributing to **TicketTracker**! We welcome bug reports, feature requests, documentation improvements, and code contributions.

---

## 🛠 Local Development Setup

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/ankitjisoni/TicketTracker.git
   cd TicketTracker
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```
   Fill in your Azure DevOps credentials (`ADO_ORG`, `ADO_PROJECT`, `ADO_PAT`).

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Access the dashboard at `http://localhost:3000`.

---

## 📋 Submitting a Pull Request

1. Create a feature branch: `git checkout -b feature/your-feature-name`.
2. Keep dependencies minimal: TicketTracker relies on **Vanilla JavaScript, HTML5, and CSS** on the frontend for zero-bundle-overhead and ultra-fast performance.
3. Verify syntax and tests before committing:
   ```bash
   node -c server.js
   node -c public/js/app.js
   node -c public/js/ui.js
   ```
4. Push your branch and open a Pull Request with a clear description of the problem solved.

---

## 💡 Reporting Issues

- Check existing [GitHub Issues](https://github.com/ankitjisoni/TicketTracker/issues) first to avoid duplicates.
- Provide step-by-step reproduction instructions and your environment details (Node version, OS).
