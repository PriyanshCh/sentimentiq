import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config; s
});

api.interceptors.response.use(
  response => response,
  error => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/api/auth/');
    if (!isAuthEndpoint && (error.response?.status === 401 || error.response?.status === 403)) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;