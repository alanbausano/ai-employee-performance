# Decisions and Tradeoffs: Employee Insights Dashboard

This document outlines the architectural decisions and tradeoffs made during the development of the dashboard.

## 1. Architecture & State Management
- **React + TypeScript + Vite**: Standard, performant stack, quick to set up and deploy.

- **TanStack Query (React Query)**: Chosen for server-state management, it's lighter and allows us to handle GraphQL and REST (AI & Telemetry) within the same paradigm, also has a lot of features out of the box and good caching capabilities. 

- **Material UI (MUI v6)**: Used for rapid development of a production-grade UI, it has lots of components out of the box and it's easy to customize and to set up.

## 2. API Strategy
- **GraphQL-Request**: A thin wrapper for GraphQL queries. It's used inside TanStack Query hooks.
- **Axios for REST**: Used for AI and Telemetry endpoints.
- **In-Memory Consent Token**: Security decision. The AI consent token is stored in an in-memory object, not `localStorage`, to prevent persistent token leakage. Intentionally refreshing the token 5 minutes before its 1-hour expiry.

## 3. Resilience & Production Thinking
- **Layered Error Handling**: 
  - `ErrorBoundary` wraps the table and drawer independently. A failure in the AI insights generator won't crash the list of employees.
  - **Graceful Degradation**: If the AI service is slow or rate-limited, the UI provides specific feedback (countdowns, retry buttons) rather than a generic error.
- **AI Safety & UX**:
  - **Lazy Loading**: AI insights are only fetched when requested/viewed to stay within the 10 req/min rate limit.
  - **PII Guardrails**: Implemented regex-based client-side scanning. Summaries containing PII are blurred by default with a "Reveal" override, ensuring user agency while maintaining safety.
  - **Confidence Scores**: Visually mapped to color-coded badges (Green/Yellow/Red) and progress bars to build trust through transparency.

## 4. AI Development Workflow
This project was built using Antigravity.
- **Contextual Awareness**: The AI was provided with the full repo structure, mock server logic, and a UI reference screenshot.
- **Iterative Planning**: Used an `implementation_plan.md` and `task.md` to sync on technical decisions before writing code.
- **Human-in-the-Loop**: I reviewed architectural decisions (e.g., Drawer vs. Page, PII blur strategy) before implementation.

## 5. Privacy & Security
- **Data Minimization**: Only the necessary fields are requested in the GraphQL query.
- **Sensitive Data Handling**: AI summaries are scanned before rendering. Disclaimers are persistently shown to remind users of the limitations of LLM outputs.

## 6. What I'd do with more time (Future Improvements)
- **Unit/Integration Testing**: Add Vitest/Testing Library for the PII detection regex and the consent token refresh logic.
- **E2E Testing**: Use Playwright to verify a full workflow.
- **Accessibility (A11y)**: Full ARIA audit for the drawer and table keyboard navigation.
- **Server Component Adaptation**: If moving to a framework like Next.js, move initial data fetching to the server for faster LCP.
