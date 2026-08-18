import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE.replace(/\/$/, '')}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medsummary_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('medsummary_token');
      localStorage.removeItem('medsummary_user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
