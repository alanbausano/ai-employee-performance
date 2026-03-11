// ---- Types ----

export interface ConsentResponse {
  consentToken: string;
  expiresAt: string;
  scope: string;
}

export interface AIInsightsResponse {
  employeeId: string;
  employeeUid: string;
  summary: string;
  confidence: number;
  generatedAt: string;
  model: string;
  processingTimeMs: number;
}

// ---- API calls (Faked Consent, Real LLM Insights) ----

import { apiClient } from './axios';
import { type Employee } from './employees';

/**
 * Faked consent call. Now just logs to console instead of hit the backend.
 */
export async function postConsent(userId: string, scope = 'insights'): Promise<ConsentResponse> {
  console.log('[AI Consent] Obtaining faked consent for:', { userId, scope });
  
  // Return a dummy token that expires in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  return {
    consentToken: 'faked-consent-token-' + Math.random().toString(36).substring(7),
    expiresAt,
    scope,
  };
}

export async function getInsights(
  employee: Employee,
  signal?: AbortSignal
): Promise<AIInsightsResponse> {
  const { data } = await apiClient.post<AIInsightsResponse>(
    '/api/ai/insights',
    employee,
    { signal, timeout: 30000 } // Increased timeout for real LLM latency
  );
  return data;
}
