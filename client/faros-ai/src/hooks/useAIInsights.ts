import { useQuery } from '@tanstack/react-query';
import { getInsights, type AIInsightsResponse } from '../api/ai';

// PII detection patterns
const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/,                   // SSN
  /\(\d{3}\)\s?\d{3}-\d{4}/,                  // Phone
  /\b\d+\s+\w+\s+(Street|Avenue|Lane|Drive|Court)\b/i, // Address
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i, // Date of birth (long)
  /\b\d{1,2}\/\d{1,2}\/\d{4}\b/,             // DOB mm/dd/yyyy
  /personal\d+@gmail\.com/i,                  // Personal email snippet
];

export function detectPII(text: string): boolean {
  return PII_PATTERNS.some((pattern) => pattern.test(text));
}

export type InsightsStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'timeout'
  | 'rate-limited'
  | 'error';

export function useAIInsights(employeeId: string | null, enabled: boolean) {
  const query = useQuery<AIInsightsResponse>({
    queryKey: ['ai-insights', employeeId],
    queryFn: async ({ signal }) => {
      if (!employeeId) throw new Error('No employee ID');
      // 9s client-side timeout via AbortController
      const timeout = setTimeout(() => {
        // The signal from useQuery is the one we abort
        (signal as AbortSignal & { abort?: () => void }).abort?.();
      }, 9000);
      try {
        return await getInsights(employeeId, signal);
      } finally {
        clearTimeout(timeout);
      }
    },
    enabled: !!employeeId && enabled,
    retry: false,    // No auto-retry for AI — user must decide
    staleTime: 2 * 60 * 1000, // 2 min cache per employee
  });

  const isTimeout =
    query.isError &&
    (query.error as Error)?.name === 'AbortError';

  const isRateLimited =
    query.isError &&
    // axios wraps HTTP errors
    (query.error as { response?: { status?: number } })?.response?.status === 429;

  const retryAfter =
    isRateLimited
      ? (query.error as { response?: { headers?: { 'retry-after'?: string } } })?.response?.headers?.['retry-after']
      : undefined;

  const hasPII = query.data ? detectPII(query.data.summary) : false;

  const status: InsightsStatus = query.isLoading
    ? 'loading'
    : isTimeout
    ? 'timeout'
    : isRateLimited
    ? 'rate-limited'
    : query.isError
    ? 'error'
    : query.isSuccess
    ? 'success'
    : 'idle';

  return {
    data: query.data,
    status,
    hasPII,
    retryAfter,
    refetch: query.refetch,
    isLoading: query.isLoading,
  };
}
