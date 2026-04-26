import axios from 'axios';

const api = axios.create({
  baseURL: 'https://app-inventario-version.vercel.app/api',
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
