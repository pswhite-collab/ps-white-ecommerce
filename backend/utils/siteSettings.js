import Settings from '../models/Settings.js';

const SETTINGS_DOC_ID = 'site-settings';
let cachedSettings = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5000;

export const clearSettingsCache = () => {
  cachedSettings = null;
  cacheExpiry = 0;
};

export const getSiteSettings = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && now < cacheExpiry) {
    return cachedSettings;
  }

  try {
    let settings = await Settings.findById(SETTINGS_DOC_ID).lean();
    if (!settings) {
      settings = await Settings.create({ _id: SETTINGS_DOC_ID });
      settings = settings.toObject();
    }
    cachedSettings = settings;
    cacheExpiry = now + CACHE_TTL_MS;
    return cachedSettings;
  } catch (error) {
    // If database is not connected or in transient state, return fallback defaults
    if (cachedSettings) {
      return cachedSettings;
    }
    return {
      _id: SETTINGS_DOC_ID,
      siteName: 'PS White',
      siteDescription: 'Official website of PS White',
      siteEmail: 'pswhite786@gmail.com',
      allowRegistration: true,
      maintenanceMode: false,
      freeShippingThreshold: 50,
      currency: 'USD',
      timezone: 'America/New_York',
    };
  }
};

export const isMaintenanceMode = async () => {
  const settings = await getSiteSettings();
  return Boolean(settings?.maintenanceMode);
};

export const isRegistrationAllowed = async () => {
  const settings = await getSiteSettings();
  return settings?.allowRegistration !== false;
};

export const getFreeShippingThreshold = async () => {
  const settings = await getSiteSettings();
  return typeof settings?.freeShippingThreshold === 'number' ? settings.freeShippingThreshold : 50;
};

export default {
  getSiteSettings,
  isMaintenanceMode,
  isRegistrationAllowed,
  getFreeShippingThreshold,
  clearSettingsCache,
};
