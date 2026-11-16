import api from './api';

const TOKEN_KEY = 'pswhite_token';
const USER_KEY = 'pswhite_user';

const storeSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const unwrap = (response) => response.data?.data || response.data;

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  const data = unwrap(response);
  storeSession(data);
  return data;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const data = unwrap(response);
  storeSession(data);
  return data;
};

export const verifyEmail = async (token) => {
  const response = await api.get(`/auth/verify-email/${token}`);
  return unwrap(response);
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return unwrap(response);
};

export const resetPassword = async (token, password) => {
  const response = await api.post('/auth/reset-password', { token, password });
  const data = unwrap(response);
  storeSession(data);
  return data;
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    clearSession();
  }
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  const data = unwrap(response);
  if (data.user) {
    storeSession({ user: data.user });
  }
  return data.user;
};

export const updateCurrentUser = async (payload) => {
  const response = await api.put('/auth/me', payload);
  const data = unwrap(response);
  if (data.user) {
    storeSession({ user: data.user });
  }
  return data.user;
};

export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
  const value = localStorage.getItem(USER_KEY);
  return value ? JSON.parse(value) : null;
};

export const verifyAdminEmail = async (email) => {
  const response = await api.post('/admin/auth/verify-admin', { email });
  return unwrap(response);
};

export default {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  getCurrentUser,
  updateCurrentUser,
  getToken,
  setToken,
  getStoredUser,
  verifyAdminEmail,
};
