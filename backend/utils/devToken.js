import '../config/env.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const getDevToken = async (emailInput) => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pswhite_local';
  const connection = await mongoose.connect(mongoUri);
  const dbName = connection.connection.name;

  if (!dbName.endsWith('_local') && !dbName.endsWith('_test')) {
    console.error(`REFUSING DEV TOKEN: Database name "${dbName}" does not end with _local or _test!`);
    process.exit(1);
  }

  const email = (emailInput || process.env.ADMIN_WHITELIST_EMAIL || 'pswhite786@gmail.com').toLowerCase();
  const user = await User.findOne({ email });

  if (!user) {
    console.error(`User not found for email: ${email}`);
    process.exit(1);
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET || 'local_test_jwt_secret_pswhite_32_characters_minimum',
    { expiresIn: '7d' }
  );

  return token;
};

if (process.argv[1] && process.argv[1].endsWith('devToken.js')) {
  const argEmail = process.argv[2];
  getDevToken(argEmail)
    .then((token) => {
      console.log(token);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => {
      mongoose.connection.close();
    });
}

export default getDevToken;
