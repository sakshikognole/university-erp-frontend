import axios from 'axios';

// Determine backend URLs at runtime based on where the app is running.
// localhost → Vite proxy (local dev / Docker).
// anything else → real Render URLs.
const onLocalhost = window.location.hostname === 'localhost';

const SPRING_BASE = onLocalhost
  ? '/api'
  : 'https://university-erp-spring.onrender.com/api';

const NODE_BASE = onLocalhost
  ? '/node-api'
  : 'https://university-erp-node.onrender.com/api';

export const springApi = axios.create({ baseURL: SPRING_BASE });
export const nodeApi   = axios.create({ baseURL: NODE_BASE });

const interceptor = [
  (res) => res.data,
  (err) => Promise.reject(new Error(
    err.response?.data?.message || err.message || 'Request failed'
  )),
];

springApi.interceptors.response.use(...interceptor);
nodeApi.interceptors.response.use(...interceptor);

export default springApi;
