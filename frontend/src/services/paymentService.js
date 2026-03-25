import api from './api';

const unwrap = (response) => response.data?.data || response.data;

export const createRazorpayOrder = async (orderId) => {
  const response = await api.post('/payment/razorpay/create-order', { orderId });
  return unwrap(response);
};

export const verifyRazorpayPayment = async (payload) => {
  const response = await api.post('/payment/razorpay/verify', payload);
  return unwrap(response);
};

export const createStripeIntent = async (orderId) => {
  const response = await api.post('/payment/stripe/create-intent', { orderId });
  return unwrap(response);
};

export const confirmStripePayment = async (orderId, transactionId) => {
  const response = await api.post('/payment/stripe/confirm', { orderId, transactionId });
  return unwrap(response);
};


export default {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeIntent,
  confirmStripePayment,
};
