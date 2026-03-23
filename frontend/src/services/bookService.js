import api from './api';

const unwrap = (response) => response.data?.data || response.data;

export const getBooks = async (params = {}) => {
  const response = await api.get('/books', { params });
  const data = unwrap(response);
  return {
    books: data.books || [],
    pagination: data.pagination,
  };
};

export const getFeaturedBooks = async () => {
  const response = await api.get('/books/featured');
  const data = unwrap(response);
  return data.books || [];
};

export const getBookById = async (id) => {
  const response = await api.get(`/books/${id}`);
  const data = unwrap(response);
  return data.book;
};

export const searchBooks = async (query) => {
  const response = await api.get('/books/search', { params: { q: query } });
  const data = unwrap(response);
  return data.books || [];
};

export const createBook = async (payload) => {
  const response = await api.post('/books', payload);
  return unwrap(response).book;
};

export const updateBook = async (id, payload) => {
  const response = await api.put(`/books/${id}`, payload);
  return unwrap(response).book;
};

export const deleteBook = async (id) => {
  const response = await api.delete(`/books/${id}`);
  return unwrap(response);
};

const fileToFormData = (file, extra = {}) => {
  const form = new FormData();
  form.append('file', file);
  Object.entries(extra).forEach(([key, value]) => form.append(key, value));
  return form;
};

export const uploadBookCover = async (id, file) => {
  const response = await api.post(`/books/${id}/upload-cover`, fileToFormData(file), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap(response);
};

export const uploadEbookFile = async (id, file, fileType) => {
  const response = await api.post(`/books/${id}/upload-ebook`, fileToFormData(file, { fileType }), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap(response);
};

export const uploadAudiobook = async (id, file) => {
  const response = await api.post(`/books/${id}/upload-audio`, fileToFormData(file), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap(response);
};

export default {
  getBooks,
  getFeaturedBooks,
  getBookById,
  searchBooks,
  createBook,
  updateBook,
  deleteBook,
  uploadBookCover,
  uploadEbookFile,
  uploadAudiobook,
};
