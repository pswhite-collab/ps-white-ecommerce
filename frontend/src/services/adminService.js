import api from './api';

const unwrap = (response) => response.data?.data || response.data;

export const getDashboard = async () => {
  const response = await api.get('/admin/dashboard/stats');
  return unwrap(response);
};

export const getAdminOrders = async (params = {}) => {
  const response = await api.get('/admin/orders', { params });
  const data = unwrap(response);
  return {
    orders: data.orders || [],
    pagination: data.pagination || null,
  };
};

export const getCustomers = async (params = {}) => {
  const response = await api.get('/admin/customers', { params });
  const data = unwrap(response);
  return {
    customers: data.customers || [],
    pagination: data.pagination || null,
  };
};

export const getReadingAnalytics = async () => {
  const response = await api.get('/admin/dashboard/reading-stats');
  const data = unwrap(response);
  return data.reading || data;
};

export const getCustomerById = async (customerId) => {
  const response = await api.get(`/admin/customers/${customerId}`);
  return unwrap(response);
};

export const getCustomerReading = async (customerId) => {
  const response = await api.get(`/admin/customers/${customerId}/reading`);
  return unwrap(response);
};

export const getAnalytics = async () => {
  const response = await api.get('/admin/analytics');
  return unwrap(response);
};

export const getQuotes = async (status = '') => {
  const response = await api.get(`/quotes${status ? `?status=${status}` : ''}`);
  return response.data?.data || [];
};

export const getQuoteStats = async () => {
  const response = await api.get('/quotes/stats');
  return unwrap(response);
};

export const createQuote = async (quoteData) => {
  const response = await api.post('/quotes', quoteData);
  return unwrap(response);
};

export const updateQuote = async (quoteId, quoteData) => {
  const response = await api.put(`/quotes/${quoteId}`, quoteData);
  return unwrap(response);
};

export const deleteQuote = async (quoteId) => {
  const response = await api.delete(`/quotes/${quoteId}`);
  return response.data;
};

export const getNewsletterSubscribers = async (status = '') => {
  const response = await api.get(`/newsletter${status ? `?status=${status}` : ''}`);
  return response.data?.data || [];
};

export const getNewsletterStats = async () => {
  const response = await api.get('/newsletter/stats');
  return unwrap(response);
};

export const deleteNewsletterSubscriber = async (subscriberId) => {
  const response = await api.delete(`/newsletter/${subscriberId}`);
  return unwrap(response);
};

export const getSiteSettings = async (defaultSettings) => {
  const response = await api.get('/settings');
  const data = unwrap(response);
  const settings = data.settings || data;
  if (!defaultSettings) {
    return settings;
  }
  try {
    return {
      ...defaultSettings,
      ...settings,
    };
  } catch (_error) {
    return defaultSettings;
  }
};

export const saveSiteSettings = async (settings) => {
  const response = await api.put('/settings', settings);
  const data = unwrap(response);
  return data.settings || data;
};

export const resetSiteSettings = async (defaultSettings) => {
  return getSiteSettings(defaultSettings);
};

export default {
  getDashboard,
  getAdminOrders,
  getCustomers,
  getReadingAnalytics,
  getCustomerById,
  getCustomerReading,
  getAnalytics,
  getQuotes,
  getQuoteStats,
  createQuote,
  updateQuote,
  deleteQuote,
  getNewsletterSubscribers,
  getNewsletterStats,
  deleteNewsletterSubscriber,
  getSiteSettings,
  saveSiteSettings,
  resetSiteSettings,
};
