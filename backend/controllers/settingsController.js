import Settings from '../models/Settings.js';

const SETTINGS_DOC_ID = 'site-settings';

const toSettingsPayload = (doc) => ({
  _id: doc._id,
  siteName: doc.siteName,
  siteDescription: doc.siteDescription,
  siteEmail: doc.siteEmail,
  allowRegistration: doc.allowRegistration,
  maintenanceMode: doc.maintenanceMode,
  freeShippingThreshold: doc.freeShippingThreshold,
  currency: doc.currency,
  timezone: doc.timezone,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const ensureSettings = async () => {
  let settings = await Settings.findById(SETTINGS_DOC_ID);
  if (!settings) {
    settings = await Settings.create({ _id: SETTINGS_DOC_ID });
  }
  return settings;
};

export const getSettings = async (_req, res, next) => {
  try {
    const settings = await ensureSettings();

    return res.json({
      success: true,
      data: {
        settings: toSettingsPayload(settings),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const settings = await ensureSettings();

    const allowedFields = [
      'siteName',
      'siteDescription',
      'siteEmail',
      'allowRegistration',
      'maintenanceMode',
      'freeShippingThreshold',
      'currency',
      'timezone',
    ];

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        settings[field] = req.body[field];
      }
    });

    if (req.body.freeShippingThreshold !== undefined) {
      settings.freeShippingThreshold = Number(req.body.freeShippingThreshold);
    }

    await settings.save();

    return res.json({
      success: true,
      message: 'Settings saved successfully',
      data: {
        settings: toSettingsPayload(settings),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  getSettings,
  updateSettings,
};
