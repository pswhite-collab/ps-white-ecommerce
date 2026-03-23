import api from './api';

const unwrap = (response) => response.data?.data || response.data;

export const createOrder = async (payload) => {
  const response = await api.post('/orders', payload);
  return unwrap(response).order;
};

export const getOrders = async (params = {}) => {
  const response = await api.get('/orders', { params });
  const data = unwrap(response);
  return {
    orders: data.orders || [],
    pagination: data.pagination,
  };
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return unwrap(response).order;
};

export const updateOrderStatus = async (id, statusOrPayload) => {
  const payload =
    typeof statusOrPayload === 'string' ? { status: statusOrPayload } : statusOrPayload;
  const response = await api.put(`/orders/${id}/status`, payload);
  return unwrap(response).order;
};

export const processRefund = async (id) => {
  const response = await api.post(`/orders/${id}/refund`);
  return unwrap(response);
};

export const updateOrderTracking = async (id, payload) => {
  const response = await api.put(`/orders/${id}/tracking`, payload);
  return response.data;
};

export const sendShippingNotification = async (id) => {
  const response = await api.post(`/orders/${id}/notify-shipping`);
  return response.data;
};

export default {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  processRefund,
  updateOrderTracking,
  sendShippingNotification,
};
