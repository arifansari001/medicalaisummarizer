// server/src/server.ts
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

async function start() {
  try {
    // Connect to MongoDB using helper
    await connectDB();
    // Start server
    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
  
}

start();
