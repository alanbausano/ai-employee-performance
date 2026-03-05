import { useCallback } from 'react';
import { apiClient } from '../api/axios';

type TelemetryEvent =
  | { type: 'page_view'; page: string }
  | { type: 'search_performed'; query: string }
  | { type: 'filter_applied'; filter: string; value: string }
  | { type: 'employee_viewed'; employeeId: string }
  | { type: 'ai_insights_loaded'; employeeId: string; confidence: number; processingTimeMs: number }
  | { type: 'ai_pii_detected'; employeeId: string }
  | { type: 'ai_error'; employeeId: string; errorType: 'timeout' | 'rate-limit' | 'error' }
  | { type: 'ai_insights_revealed'; employeeId: string }
  | { type: 'consent_obtained' };

export function useTelemetry() {
  const track = useCallback((event: TelemetryEvent) => {
    // Fire and forget — never block the UI
    apiClient
      .post('/api/telemetry', {
        ...event,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      })
      .catch(() => {
        // Silently ignore telemetry failures
      });
  }, []);

  return { track };
}
