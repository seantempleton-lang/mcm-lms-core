import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET;
const corsOrigin = process.env.CORS_ORIGIN || null;

if (!jwtSecret && nodeEnv !== 'development') {
  throw new Error('JWT_SECRET is required outside development');
}

if (!jwtSecret && nodeEnv === 'development') {
  console.warn('JWT_SECRET is not set. Using development fallback secret.');
}

export const config = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: jwtSecret || 'dev_secret',
  corsOrigin,
  corsCredentials: Boolean(corsOrigin),
  nodeEnv,
};
