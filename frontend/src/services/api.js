import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pswhite_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.warn('Unauthorized API request detected.');
    }

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'API request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
