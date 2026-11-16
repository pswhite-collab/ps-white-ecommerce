import '../config/env.js';
import mongoose from 'mongoose';

const resetLocalDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pswhite_local';
  const connection = await mongoose.connect(mongoUri);
  const dbName = connection.connection.name;

  console.log(`Connected to database for reset: ${dbName}`);
  if (!dbName.endsWith('_local') && !dbName.endsWith('_test')) {
    console.error(`REFUSING TO DROP: Database name "${dbName}" does not end with _local or _test!`);
    process.exit(1);
  }

  console.log(`Dropping test database: ${dbName}...`);
  await mongoose.connection.dropDatabase();
  console.log(`Successfully dropped ${dbName}.`);
  await mongoose.connection.close();
};

resetLocalDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Reset failed:', err.message);
    process.exit(1);
  });
