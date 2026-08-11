// server/src/config/db.ts
import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Connect to MongoDB using the URI from environment variables.
 * Logs a success message when the connection is established.
 */
export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}
