import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import AdminWhitelist from '../models/AdminWhitelist.js';

dotenv.config();

const run = async () => {
  await connectDB();

  const email = (process.env.ADMIN_WHITELIST_EMAIL || 'pswhite786@gmail.com').toLowerCase();

  const record = await AdminWhitelist.findOneAndUpdate(
    { email },
    { $set: { email, role: 'super_admin', active: true } },
    { upsert: true, new: true }
  );

  console.log(`Admin whitelist ready for: ${record.email}`);
  process.exit(0);
};

run().catch((error) => {
  console.error('Failed to seed admin whitelist:', error.message);
  process.exit(1);
});
