import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

// send the JWT with every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// expired or invalid token: clear it and go back to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => {
  if (e.response?.data?.message) return e.response.data.message;
  if (!e.response || e.response.status >= 500) {
    return 'Cannot reach the server. Check that the backend is running (npm run dev in the server folder) and MongoDB is connected.';
  }
  return e.message;
};

export default api;
