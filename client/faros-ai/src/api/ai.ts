import { apiClient } from './axios';

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

// ---- API calls ----

export async function postConsent(userId: string, scope = 'insights'): Promise<ConsentResponse> {
  const { data } = await apiClient.post<ConsentResponse>('/api/ai/consent', { userId, scope });
  return data;
}

export async function getInsights(
  employeeId: string,
  signal?: AbortSignal
): Promise<AIInsightsResponse> {
  const { data } = await apiClient.get<AIInsightsResponse>(
    `/api/ai/insights/${employeeId}`,
    { signal, timeout: 11000 }
  );
  return data;
}
