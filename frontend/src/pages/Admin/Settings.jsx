import { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import api from '../../services/api';

const DEFAULT_SETTINGS = {
  siteName: '',
  siteDescription: '',
  siteEmail: '',
  allowRegistration: true,
  maintenanceMode: false,
  freeShippingThreshold: 50,
  currency: 'USD',
  timezone: 'America/New_York',
};

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[Settings] Fetching settings from /api/settings');

      const response = await api.get('/settings');
      console.log('[Settings] GET response:', response.data);

      const payload = response?.data?.data?.settings || response?.data?.data || {};
      setSettings((prev) => ({
        ...prev,
        ...payload,
      }));
    } catch (err) {
      console.error('[Settings] Error fetching settings:', err);
      setError(err.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[Settings] Component mounted');
    fetchSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;

    console.log(`[Settings] Field changed: ${name}`, nextValue);
    setSettings((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('[Settings] Form submitted. Payload:', settings);

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        siteName: settings.siteName,
        siteDescription: settings.siteDescription,
        siteEmail: settings.siteEmail,
        allowRegistration: Boolean(settings.allowRegistration),
        maintenanceMode: Boolean(settings.maintenanceMode),
        freeShippingThreshold: Number(settings.freeShippingThreshold || 0),
        currency: settings.currency,
        timezone: settings.timezone,
      };

      console.log('[Settings] Sending PUT /api/settings with payload:', payload);
      const response = await api.put('/settings', payload);
      console.log('[Settings] PUT response:', response.data);

      const updated = response?.data?.data?.settings || response?.data?.data || payload;
      setSettings((prev) => ({
        ...prev,
        ...updated,
      }));
      setSuccess('Settings saved successfully.');
    } catch (err) {
      console.error('[Settings] Error saving settings:', err);
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    console.log('[Settings] Reset requested');
    if (window.confirm('Reset to last saved settings?')) {
      fetchSettings();
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Sidebar />
        <section className="rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
          <div className="py-8 text-center text-charcoal/70">Loading settings...</div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="space-y-4 rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
        <header>
          <h1 className="font-display text-4xl text-mocha">Settings</h1>
          <p className="mt-1 text-sm text-charcoal/70">
            Manage general site preferences and store defaults.
          </p>
        </header>

        {error ? <p className="text-sm text-error">{error}</p> : null}
        {success ? <p className="text-sm text-success">{success}</p> : null}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <article className="space-y-4 rounded-card border border-taupe/30 bg-oat/20 p-4">
            <h2 className="font-display text-2xl text-mocha">General Settings</h2>
            <label className="flex flex-col gap-1 text-sm text-charcoal">
              Site Name *
              <input
                type="text"
                name="siteName"
                value={settings.siteName || ''}
                onChange={handleChange}
                className="rounded-card border border-taupe/50 bg-white px-3 py-2"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-charcoal">
              Site Description
              <textarea
                rows={3}
                name="siteDescription"
                value={settings.siteDescription || ''}
                onChange={handleChange}
                className="rounded-card border border-taupe/50 bg-white px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-charcoal">
              Contact Email *
              <input
                type="email"
                name="siteEmail"
                value={settings.siteEmail || ''}
                onChange={handleChange}
                className="rounded-card border border-taupe/50 bg-white px-3 py-2"
                required
              />
            </label>
          </article>

          <article className="space-y-4 rounded-card border border-taupe/30 bg-oat/20 p-4">
            <h2 className="font-display text-2xl text-mocha">User Settings</h2>
            <label className="inline-flex items-start gap-3 text-sm text-charcoal">
              <input
                type="checkbox"
                name="allowRegistration"
                checked={Boolean(settings.allowRegistration)}
                onChange={handleChange}
                className="mt-1"
              />
              <span>
                <strong className="font-medium">Allow User Registration</strong>
                <br />
                Allow new users to create accounts on the website.
              </span>
            </label>
            <label className="inline-flex items-start gap-3 text-sm text-charcoal">
              <input
                type="checkbox"
                name="maintenanceMode"
                checked={Boolean(settings.maintenanceMode)}
                onChange={handleChange}
                className="mt-1"
              />
              <span>
                <strong className="font-medium">Maintenance Mode</strong>
                <br />
                Temporarily disable customer access during maintenance.
              </span>
            </label>
          </article>

          <article className="space-y-4 rounded-card border border-taupe/30 bg-oat/20 p-4">
            <h2 className="font-display text-2xl text-mocha">Store Settings</h2>
            <label className="flex flex-col gap-1 text-sm text-charcoal">
              Free Shipping Threshold
              <input
                type="number"
                name="freeShippingThreshold"
                min="0"
                step="0.01"
                value={settings.freeShippingThreshold ?? 50}
                onChange={handleChange}
                className="rounded-card border border-taupe/50 bg-white px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-charcoal">
              Currency
              <select
                name="currency"
                value={settings.currency || 'USD'}
                onChange={handleChange}
                className="rounded-card border border-taupe/50 bg-white px-3 py-2"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-charcoal">
              Timezone
              <select
                name="timezone"
                value={settings.timezone || 'America/New_York'}
                onChange={handleChange}
                className="rounded-card border border-taupe/50 bg-white px-3 py-2"
              >
                <option value="America/New_York">Eastern Time (US)</option>
                <option value="America/Chicago">Central Time (US)</option>
                <option value="America/Denver">Mountain Time (US)</option>
                <option value="America/Los_Angeles">Pacific Time (US)</option>
                <option value="Asia/Kolkata">India Standard Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </label>
          </article>

          <div className="flex gap-3 rounded-card border-2 border-mocha/20 bg-milk p-4 shadow-soft">
            <button
              type="submit"
              disabled={saving}
              className={[
                'flex-1 rounded-pill px-6 py-3 font-semibold transition-all',
                saving
                  ? 'cursor-not-allowed bg-charcoal/40 text-milk'
                  : 'bg-mocha text-milk hover:bg-charcoal',
              ].join(' ')}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="rounded-pill border-2 border-mocha px-6 py-3 font-semibold text-mocha transition-all hover:bg-oat disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
            </button>
          </div>
        </form>

        <details className="rounded-card border border-taupe/30 bg-oat/20 p-3 text-xs text-charcoal/70">
          <summary className="cursor-pointer font-semibold text-charcoal">Debug settings state</summary>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words">
            {JSON.stringify(settings, null, 2)}
          </pre>
        </details>
      </section>
    </div>
  );
}
