import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load from all possible locations with override:true so the LAST one that exists wins
// This ensures the key is picked up regardless of where the server process is started from
const envPaths = [
  path.resolve(process.cwd(), '.env'),                  // wherever node is run from
  path.resolve(process.cwd(), 'server/.env'),            // root/server/.env
  path.resolve(__dirname, '../../.env'),                 // dist/../../../.env (compiled path)
  path.resolve(__dirname, '../../../server/.env'),       // compiled path -> server root
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath, override: true });
}


export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// Validate required env vars
const required = ['MONGODB_URI', 'JWT_SECRET'] as const;
for (const key of required) {
  if (!env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}