import api from './api';

const unwrap = (response) => response.data?.data || response.data;

export const getLibrary = async () => {
  const response = await api.get('/reading/library');
  return unwrap(response).library || [];
};

export const getProgress = async (bookId) => {
  const response = await api.get(`/reading/progress/${bookId}`);
  return unwrap(response).progress;
};

export const updateProgress = async (bookId, payload) => {
  const response = await api.put(`/reading/progress/${bookId}/page`, payload);
  return unwrap(response).progress;
};

export const addBookmark = async (bookId, payload) => {
  const response = await api.post(`/reading/progress/${bookId}/bookmark`, payload);
  return unwrap(response).progress;
};

export const deleteBookmark = async (bookId, bookmarkId) => {
  const response = await api.delete(`/reading/progress/${bookId}/bookmark/${bookmarkId}`);
  return unwrap(response).progress;
};

export const updateSettings = async (bookId, payload) => {
  const response = await api.put(`/reading/progress/${bookId}/settings`, payload);
  return unwrap(response).settings;
};

export const markCompleted = async (bookId) => {
  const response = await api.post(`/reading/progress/${bookId}/complete`);
  return unwrap(response);
};

export const getStats = async () => {
  const response = await api.get('/reading/stats');
  return unwrap(response).stats;
};

export const getCurrentlyReading = async () => {
  const response = await api.get('/reading/currently-reading');
  return unwrap(response).items || [];
};

export const getBookContent = async (bookId) => {
  const response = await api.get(`/reader/${bookId}/content`);
  return unwrap(response);
};

export const getBookPreview = async (bookId) => {
  const response = await api.get(`/reader/${bookId}/preview`);
  return unwrap(response);
};

export const getReaderMetadata = async (bookId) => {
  const response = await api.get(`/reader/${bookId}/metadata`);
  return unwrap(response);
};

export const downloadBook = async (bookId, format = 'pdf') => {
  const content = await getBookContent(bookId);
  const url = format === 'epub' ? content.epubUrl : content.pdfUrl;
  if (!url) {
    throw new Error('Requested format is not available for download');
  }

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.click();
};

export default {
  getLibrary,
  getProgress,
  updateProgress,
  addBookmark,
  deleteBookmark,
  updateSettings,
  markCompleted,
  getStats,
  getCurrentlyReading,
  getBookContent,
  getBookPreview,
  getReaderMetadata,
  downloadBook,
};
