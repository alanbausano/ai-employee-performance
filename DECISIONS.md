# Decisions and Tradeoffs: Employee Insights Dashboard

This document explains the choices I made while building this dashboard.

## 1. Architecture Choices
I chose a stack consisting of **React, TypeScript, and Vite**. This is my go-to for speed and performance.
- **TanStack Query**: I used this for all data fetching. It handles the "chaos" server (errors and latency) really well out of the box with its retry logic and caching. I considered Apollo Client since we are using GraphQL, but TanStack Query is more flexible because it also handles our REST calls (AI and Telemetry) under one pattern.
- **Material UI (MUI v6)**: I chose this to build a production-grade UI quickly. It allowed me to match the Figma closely while giving me accessible components for the complex bits like the drawer and filters.

## 2. AI Development Workflow
I built this project using Antigravity.
- **Setup**: I provided the AI with the full repository context and a special `task.md` file to track our progress. I used an iterative planning process where the AI would propose an `implementation_plan.md` before writing any code.
- **Corrections**: Early on, the AI implemented the AI consent fetch as a background process. After reviewing the requirements, I had to correct this flow to be "explicit," requiring a real user interaction to accept terms.
- **Long-term changes**: For a longer project, I'd integrate the AI tools directly into my local CI/CD flow to catch linting or type errors before the AI even presents them to me.

## 3. Data and API Challenges
The mock server was intentionally complex. 
- **Variable Latency**: I handled this by adding clear loading states (skeletons) and a "pre-loading" strategy for some data.
- **Data Quality**: I found some messy records, like "Fred Weasley" being assigned to the same team twice. I fixed this by implementing a client-side deduplication step in the table chips.
- **Server Errors**: I used exponential backoff retries so the app survives the occasional 503 "Service Unavailable" errors.

## 4. Privacy and Security
- **Explicit Consent**: I designed a "Consent Overlay" in the AI drawer. Insights aren't even requested from the backend until the user explicitly agrees to the data usage.
- **In-Memory Tokens**: I store the AI consent token in an in-memory object rather than `localStorage`. This prevents the token from leaking if someone walks away from the computer.
- **PII Guardrails**: I implemented a regex-based scanner on the client side. If the AI returns sensitive info (like a phone number), I blur it out by default.

## 5. What I'd do in next iterations
If this were going to a real production environment, I'd add:
- **Next.js Integration**: Moving to a framework would allow for **SSR (Server-Side Rendering)** and **Middleware**. This moves a lot of the data fetching and security logic (like consent verification) to the server, improving LCP and reducing the client-side bundle.
- **Edge Strategy**: In case the app escalates to much more users, I'd deploy the application to geographically distributed servers (the Edge). This ensures that a user in New York and a user in London both get fast, low-latency responses by reaching the server closest to them.
- **Observability**:  I'd integrate professional monitoring tools like **Sentry or Datadog**.
- **Advanced A11y**: I'd do a full ARIA audit, especially for keyboard navigation in the infinite-scrolling table.

## 6. Testing Strategy
- **Utility Logic**: I'd use **Vitest** to unit test the PII detection regex and the token refresh math, as these are easy to break.
- **End-to-End**: I'd use **Playwright** to verify the full flow: searching for an employee, opening their drawer, and triggering an AI insight.
- **AI Specifics**: For AI content, I would set up a "golden set" of mock responses to verify that our PII blur filters and confidence badges consistently work across different model outputs.
