import api from './api';

const unwrap = (response) => response.data?.data || response.data;

export const subscribe = async (email) => {
  const response = await api.post('/newsletter/subscribe', { email });
  return unwrap(response);
};

export const unsubscribe = async (email) => {
  const response = await api.post('/newsletter/unsubscribe', { email });
  return unwrap(response);
};

export const getSubscribers = async () => {
  const response = await api.get('/newsletter/subscribers');
  return unwrap(response).subscribers || [];
};

export default {
  subscribe,
  unsubscribe,
  getSubscribers,
};
