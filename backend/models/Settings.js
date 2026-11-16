import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: 'site-settings',
    },

    // General settings
    siteName: {
      type: String,
      default: 'PS White',
      trim: true,
    },
    siteDescription: {
      type: String,
      default: 'Official website of PS White',
      trim: true,
    },
    siteEmail: {
      type: String,
      default: 'pswhite786@gmail.com',
      trim: true,
      lowercase: true,
    },

    // User settings
    allowRegistration: {
      type: Boolean,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    // Store settings
    freeShippingThreshold: {
      type: Number,
      default: 50,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'INR'],
      default: 'USD',
    },
    timezone: {
      type: String,
      default: 'America/New_York',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
