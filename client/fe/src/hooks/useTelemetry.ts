import { useCallback } from 'react';

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
    // Faked telemetry — just log to console
    console.log('[Telemetry Event]', {
      ...event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  }, []);

  return { track };
}
