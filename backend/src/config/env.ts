import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  db: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    name: process.env.DATABASE_NAME || 'sweety',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  },
  jwtSecret:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === 'test' ? 'test-only-jwt-secret-key' : ''),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

if (!env.jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required.');
}

