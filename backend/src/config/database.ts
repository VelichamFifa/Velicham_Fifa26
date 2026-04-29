import mongoose from 'mongoose';
import { config } from './index';

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log('✓ MongoDB disconnected');
};
