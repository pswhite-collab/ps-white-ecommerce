import mongoose from 'mongoose';

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI is not set. Skipping MongoDB connection.');
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    mongoose.set('bufferCommands', false);

    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });

    console.log(`MongoDB connected: ${connection.connection.host}`);
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

mongoose.connection.on('error', (error) => {
  console.error('MongoDB runtime error:', error.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

export default connectDB;
