import api from './api';

const unwrap = (response) => response.data?.data || response.data;

export const createStripeIntent = async (orderId) => {
  const response = await api.post('/payment/stripe/create-intent', { orderId });
  return unwrap(response);
};

export const confirmStripePayment = async (orderId, paymentIntentId) => {
  const response = await api.post('/payment/stripe/confirm', {
    orderId,
    paymentIntentId,
  });
  return unwrap(response);
};

export default {
  createStripeIntent,
  confirmStripePayment,
};
