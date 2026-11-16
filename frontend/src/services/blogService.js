import api from './api';

const unwrap = (response) => response.data?.data || response.data;

export const getPosts = async (params = {}) => {
  const response = await api.get('/blog/posts', { params });
  const data = unwrap(response);
  return {
    posts: data.posts || [],
    pagination: data.pagination,
  };
};

export const getAdminPosts = async (params = {}) => {
  const response = await api.get('/blog/admin/posts', { params });
  const data = unwrap(response);
  return {
    posts: data.posts || [],
    pagination: data.pagination,
  };
};

export const getPostBySlug = async (slug) => {
  const response = await api.get(`/blog/posts/${slug}`);
  return unwrap(response).post;
};

export const createPost = async (payload) => {
  const response = await api.post('/blog/posts', payload);
  return unwrap(response).post;
};

export const updatePost = async (id, payload) => {
  const response = await api.put(`/blog/posts/${id}`, payload);
  return unwrap(response).post;
};

export const deletePost = async (id) => {
  const response = await api.delete(`/blog/posts/${id}`);
  return unwrap(response);
};

export const addComment = async (id, comment) => {
  const response = await api.post(`/blog/posts/${id}/comments`, { comment });
  return unwrap(response);
};

export default {
  getPosts,
  getAdminPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  addComment,
};
