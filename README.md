# Faros AI — Employee Insights Dashboard

A production-ready employee dashboard with AI-powered insights, telemetry, and resilience patterns.

## 🚀 Setup & Running Locally

### 1. Prerequisites
- Node.js 20+
- npm

### 2. Start Mock Server
```bash
cd mock-server
npm install
npm start
```
The server will run at `http://localhost:4000`.

### 3. Start Frontend App
```bash
cd client/faros-ai
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## 🛠 Features
- **Employee Table**: Search, filter, and cursor-based pagination.
- **AI Insights**: Lazy-loaded summaries with PII detection and confidence scoring.
- **Operational Ready**: 
  - **Feature Flags**: Toggle AI features via `localStorage.setItem('ff_ai_insights', 'true')`.
  - **Telemetry**: Automated tracking of user interactions and AI performance.
  - **Error Boundaries**: Component-level resilience for table and drawer.

## 📄 Documentation
- [DECISIONS.md](./DECISIONS.md) — Architecture, tradeoffs, and AI workflow.
- [RUNBOOK.md](./RUNBOOK.md) — Triage guide and operational metrics.
