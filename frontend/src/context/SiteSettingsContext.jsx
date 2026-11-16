import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const DEFAULT_SETTINGS = {
  siteName: 'PS White',
  siteDescription: 'Official website of PS White',
  siteEmail: 'pswhite786@gmail.com',
  allowRegistration: true,
  maintenanceMode: false,
  freeShippingThreshold: 50,
  currency: 'USD',
  timezone: 'America/New_York',
};

const SiteSettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refreshSettings: async () => {},
});

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const response = await api.get('/settings/public');
      const payload = response?.data?.data?.settings || response?.data?.settings;
      if (payload) {
        setSettings((prev) => ({
          ...prev,
          ...payload,
        }));
      }
    } catch (err) {
      // In development or when offline, keep default settings
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    if (settings.siteName) {
      document.title = `${settings.siteName} | Literary Fiction & Books`;
    }
  }, [settings.siteName]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};

export default SiteSettingsContext;
