import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
});

// In-memory consent token store (never persisted to localStorage for security)
export const consentStore = {
  token: null as string | null,
  expiresAt: null as Date | null,

  set(token: string, expiresAt: string) {
    this.token = token;
    this.expiresAt = new Date(expiresAt);
  },

  get(): string | null {
    if (!this.token || !this.expiresAt) return null;
    // Consider expired 60s early to avoid race conditions
    if (new Date(this.expiresAt.getTime() - 60_000) < new Date()) {
      this.token = null;
      this.expiresAt = null;
      return null;
    }
    return this.token;
  },

  clear() {
    this.token = null;
    this.expiresAt = null;
  },
};

// Attach consent token to AI requests automatically
apiClient.interceptors.request.use((config) => {
  if (config.url?.startsWith('/api/ai/')) {
    const token = consentStore.get();
    if (token) {
      config.headers['X-Consent-Token'] = token;
    }
  }
  return config;
});
