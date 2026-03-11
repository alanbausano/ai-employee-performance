import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { postConsent, type ConsentResponse } from '../api/ai';
import { consentStore } from '../api/axios';

const CONSENT_USER_ID = 'faros-dashboard-user';
const CONSENT_SCOPE = 'insights';
const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'ai_consent_accepted';

export function useAIConsent() {
  const queryClient = useQueryClient();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAccepted, setIsAccepted] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');

  const query = useQuery({
    queryKey: ['ai-consent'],
    queryFn: async (): Promise<ConsentResponse> => {
      const response = await postConsent(CONSENT_USER_ID, CONSENT_SCOPE);
      consentStore.set(response.consentToken, response.expiresAt);
      return response;
    },
    enabled: isAccepted,
    staleTime: Infinity,   // we manage expiry ourselves
    retry: 3,
  });

  const giveConsent = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsAccepted(true);
  };

  // Schedule proactive token refresh before it expires
  useEffect(() => {
    if (!query.data?.expiresAt) return;

    const expiresAt = new Date(query.data.expiresAt).getTime();
    const now = Date.now();
    const refreshAt = expiresAt - REFRESH_BEFORE_EXPIRY_MS;
    const delay = Math.max(0, refreshAt - now);

    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['ai-consent'] });
    }, delay);

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [query.data?.expiresAt, queryClient]);

  return {
    isAccepted,
    isReady: !!query.data && !query.isError,
    isLoading: query.isLoading,
    giveConsent,
    error: query.error,
  };
}
