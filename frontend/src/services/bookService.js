import api from './api';

export const getBooks = async () => {
  const { data } = await api.get('/books');
  return data.books || [];
};

export const getBookById = async (id) => {
  const { data } = await api.get(`/books/${id}`);
  return data.book;
};

export const searchBooks = async (query) => {
  const { data } = await api.get('/books/search', { params: { q: query } });
  return data.books || [];
};

export default {
  getBooks,
  getBookById,
  searchBooks,
};
