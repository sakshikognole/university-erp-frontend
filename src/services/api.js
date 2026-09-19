import axios from 'axios';

// Runtime URL detection.
// localhost  → Vite proxy (local dev / Docker).
// Render/any other host → real backend URLs.
const onLocalhost = window.location.hostname === 'localhost';

const SPRING_BASE = onLocalhost
  ? '/api'
  : 'https://university-erp-spring.onrender.com/api';

const NODE_BASE = onLocalhost
  ? '/node-api'
  : 'https://university-erp-node.onrender.com/api';

// ── Retry helper ─────────────────────────────────────────────────────────────
// On Render free tier services sleep after 15 min of inactivity.
// The first request can fail with a network error while the service wakes up.
// We retry up to 3 times with exponential backoff (1s, 2s, 4s) before giving up.
async function withRetry(fn, retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isNetworkError =
        err.code === 'ERR_NETWORK' ||
        err.message === 'Network Error' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('ERR_CONNECTION_REFUSED');

      // Only retry on network errors, not 4xx/5xx responses
      if (!isNetworkError || attempt === retries) throw err;

      // Wait before retrying (1s, 2s, 4s)
      await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
  }
}

// ── Axios instances ───────────────────────────────────────────────────────────
export const springApi = axios.create({ baseURL: SPRING_BASE });
export const nodeApi   = axios.create({ baseURL: NODE_BASE });

// ── Response interceptor ─────────────────────────────────────────────────────
// Unwraps axios response so callers receive the body directly.
// Surfaces a clean error message on failure.
const responseInterceptor = [
  (res) => res.data,
  (err) => {
    const msg =
      err.response?.data?.message ||
      err.response?.data?.error   ||
      err.message                 ||
      'Request failed';
    return Promise.reject(new Error(msg));
  },
];

springApi.interceptors.response.use(...responseInterceptor);
nodeApi.interceptors.response.use(...responseInterceptor);

// ── Retry-wrapped helpers ─────────────────────────────────────────────────────
// Use these instead of springApi/nodeApi directly for initial page data loads.
// For user-triggered actions (save, delete) use springApi/nodeApi directly
// since the user can just click again.

export const springGet = (url, config) =>
  withRetry(() => springApi.get(url, config));

export const nodeGet = (url, config) =>
  withRetry(() => nodeApi.get(url, config));

export default springApi;
