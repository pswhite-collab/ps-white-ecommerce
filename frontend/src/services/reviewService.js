import api from './api';

const unwrap = (response) => response.data?.data || response.data;

export const getBookReviews = async (bookId, params = {}) => {
  const response = await api.get(`/reviews/book/${bookId}`, { params });
  const data = unwrap(response);
  return {
    reviews: data.reviews || [],
    pagination: data.pagination,
  };
};

export const getFeaturedReviews = async (params = {}) => {
  const response = await api.get('/reviews/featured', { params });
  const data = unwrap(response);
  return data.reviews || [];
};

export const getAdminReviews = async (params = {}) => {
  const response = await api.get('/reviews/admin', { params });
  const payload = response.data || {};
  return {
    reviews: payload.data?.reviews || [],
    statusCounts: payload.statusCounts || { all: 0, pending: 0, approved: 0, rejected: 0 },
    count: payload.count || 0,
  };
};

export const createReview = async (payload) => {
  const response = await api.post('/reviews', payload);
  return unwrap(response);
};

export const updateReview = async (id, payload) => {
  const response = await api.put(`/reviews/${id}`, payload);
  return unwrap(response);
};

export const deleteReview = async (id) => {
  const response = await api.delete(`/reviews/${id}`);
  return unwrap(response);
};

export const approveReview = async (id) => {
  const response = await api.put(`/reviews/${id}/approve`);
  return unwrap(response);
};

export const rejectReview = async (id) => {
  const response = await api.put(`/reviews/${id}/reject`);
  return unwrap(response);
};

export const voteHelpful = async (id) => {
  const response = await api.post(`/reviews/${id}/helpful`);
  return unwrap(response);
};

export default {
  getBookReviews,
  getFeaturedReviews,
  getAdminReviews,
  createReview,
  updateReview,
  deleteReview,
  approveReview,
  rejectReview,
  voteHelpful,
};
