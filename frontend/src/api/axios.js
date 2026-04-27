import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.DEV 
    ? 'http://localhost:5000/api' 
    : 'https://app-inventario-sigma-livid.vercel.app/api',
});

// Interceptor para inyectar automáticamente el token en todas las peticiones
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default api;
