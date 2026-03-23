import connectDB from '../config/db.js';
import Settings from '../models/Settings.js';

const SETTINGS_DOC_ID = 'site-settings';

const initSettings = async () => {
  try {
    await connectDB();

    let settings = await Settings.findById(SETTINGS_DOC_ID);

    if (!settings) {
      settings = await Settings.create({ _id: SETTINGS_DOC_ID });
      console.log('Default settings created.');
    } else {
      console.log('Settings already exist. No changes made.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize settings:', error.message);
    process.exit(1);
  }
};

initSettings();
