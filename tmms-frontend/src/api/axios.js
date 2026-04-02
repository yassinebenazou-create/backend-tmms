import axios from 'axios';

function normalizeBaseUrl(raw) {
  const value = String(raw || '').trim();
  if (!value || value === 'VITE_API_URL') return '';
  return value.replace(/\/+$/, '');
}

function resolveApiBaseUrl() {
  const envBase = normalizeBaseUrl(import.meta.env.VITE_API_URL);
  if (envBase) return envBase;

  // Safety fallback for misconfigured Vercel envs.
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://tmms-backend.vercel.app';
  }

  return '';
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tmms-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      const wrapped = new Error('Cannot reach server. Check VITE_API_URL and backend status.');
      wrapped.original = error;
      throw wrapped;
    }
    throw error;
  }
);

export default api;
