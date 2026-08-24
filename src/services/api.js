import axios from 'axios';

// Runtime URL detection — works without any build-time env vars.
// On localhost: uses Vite proxy paths (/api, /node-api).
// On any other host (Render): uses real backend URLs directly.
const IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

const SPRING_BASE = IS_PROD
  ? 'https://university-erp-spring.onrender.com/api'
  : '/api';

const NODE_BASE = IS_PROD
  ? 'https://university-erp-node.onrender.com/api'
  : '/node-api';

export const springApi = axios.create({ baseURL: SPRING_BASE });
export const nodeApi   = axios.create({ baseURL: NODE_BASE });

const responseInterceptor = [
  (res) => res.data,
  (err) => Promise.reject(new Error(err.response?.data?.message || err.message || 'Request failed')),
];

springApi.interceptors.response.use(...responseInterceptor);
nodeApi.interceptors.response.use(...responseInterceptor);

export default springApi;
