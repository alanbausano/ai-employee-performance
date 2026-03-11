# Faros AI — Employee Insights Dashboard

A streamlined employee dashboard featuring real-time AI insights powered by Groq, with a focus on data privacy and operational resilience.

## 🌟 Overview

This dashboard allows engineering managers to view employee activity and generate AI-powered performance summaries. To ensure maximum flexibility and speed:
- **Real LLM**: Integrates with [Groq](https://groq.com/) for high-speed inference (Llama 3.3).
- **Data-Driven**: Employee data is hardcoded in the frontend, making the backend a stateless LLM wrapper.
- **Privacy First**: Explicit user consent is required before any AI features are activated, and PII detection protects sensitive data.

---

## 🚀 Setup & Running Locally

### 1. Prerequisites
- Node.js 20+
- npm
- A [Groq API Key](https://console.groq.com/keys)

### 2. Backend Setup (Groq LLM Wrapper)
1. Initialize the backend:
   ```bash
   cd mock-server
   npm install
   ```
2. Create a `.env` file in `mock-server/`:
   ```env
   GROQ_API_KEY=your_gsk_key_here
   PORT=4000
   ```
3. Start the server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Initialize the frontend:
   ```bash
   cd client/fe
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173`.

---

## 🛠 Features
- **Stateless AI Architecture**: The frontend sends the full employee record to the backend, ensuring insights are always based on the latest local data.
- **AI Consent Flow**: Full audit trail of user agreement before enabling AI.
- **PII Guardrails**: Automatic client-side scanning for sensitive data (SSNs, phone numbers) in AI outputs.
- **Operational Ready**: 
  - **Feature Flags**: Toggle AI features in real-time.
  - **Telemetry**: Local logging of all AI performance and user interactions.

## 📄 Documentation
- [DECISIONS.md](./DECISIONS.md) — Architecture decisions and next iterations.
- [RUNBOOK.md](./RUNBOOK.md) — Triage guide and operational metrics.
