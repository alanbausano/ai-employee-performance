# Runbook: AI Employee Insights Feature

This is a guide for triaging and maintaining the AI Insights feature in production.

## Feature Control: On/Off Switch
The AI Insights feature can be enabled/disabled without a redeploy via a feature flag stored in the user's browser `localStorage`.

- **To Disable/Enable**: Open the browser console and run:
  ```javascript
  localStorage.setItem('ff_ai_insights', 'false'); // or 'true' to enable
  location.reload();
  ```

  Or open the browser console, go to application > local storage > http://localhost:5173/ and set `ff_ai_insights` to `false`, or `true` to enable.

## Potential Issues & Triage

### 1. User reports "AI Insights not appearing"
- **Check Feature Flag**: Verify we're setting `ff_ai_insights` to `true` in localStorage.
- **Check GraphQL**: The drawer needs the `id` from the GraphQL response. If the table is empty or failing, AI insights won't trigger. Possibly need to reload to get the id.
- **Check Consent**: Verify the `POST /api/ai/consent` call succeeded in the Network tab.

### 2. User reports "Insights are taking too long"
- **Expected Behavior**: There could be some latency for several network reasons, AI, UI or server related.
- **Timeout**: The frontend has a **9s client-side timeout**. If a request exceeds this, a "Retry" UI will appear.
- **Action**: Check for `GET /api/ai/insights/:id` hanging in the Network tab. If it's consistently timing out there might be some server issue. Also check the browser console for any errors and the network tab for any failed requests.

### 3. User reports "Rate limited" (429 Error)
- **Constraint**: Given that the AI service is limited to **10 requests per minute**.
- **UX**: The app displays a "Rate limit reached" message with a countdown if provided by the server (`Retry-After`). If the server doesn't provide a countdown, the user will see a "Too many requests — please wait a moment before trying again." message.
- **Action**: Wait 60 seconds.

### 4. User reports "Sensitive info found"
- **Detection**: The frontend uses regex-based PII detection. If triggered, it blurs the summary and shows a red warning.
- **Action**: Report to the data engineering team. In production, we would log the `employeeId` via telemetry (`ai_pii_detected`) to refine our server-side safety filters.

---

## 📈 Monitoring Key Metrics
I'd want to watch these events in the telemetry stream (`/api/telemetry`):

| Metric | Event Name | Action Threshold |

| **AI Error Rate** | `ai_error` | > 10% (excluding timeouts) |
| **PII Exposure** | `ai_pii_detected` | Any occurrence |
| **Low Confidence** | `ai_insights_loaded` | If `confidence < 0.5` is the norm |
| **UI Reveal Rate** | `ai_insights_revealed` | Tracks if users are overriding PII blocks |
