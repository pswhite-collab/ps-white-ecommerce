import api from './api';

export const getReadingProgress = async (bookId) => {
  const { data } = await api.get(`/reading/${bookId}`);
  return data;
};

export const updateProgress = async (bookId, payload) => {
  const { data } = await api.patch(`/reading/${bookId}`, payload);
  return data;
};

export const addBookmark = async (bookId, payload) => {
  const { data } = await api.post(`/reading/${bookId}/bookmarks`, payload);
  return data;
};

export default {
  getReadingProgress,
  updateProgress,
  addBookmark,
};
