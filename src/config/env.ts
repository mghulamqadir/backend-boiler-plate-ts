import type { AppEnv } from '../types/index.js';

function get(key: keyof AppEnv, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env: AppEnv = {
  NODE_ENV: (process.env['NODE_ENV'] ?? 'development') as AppEnv['NODE_ENV'],
  PORT: parseInt(process.env['PORT'] ?? '3000', 10),
  CLIENT_URL: get('CLIENT_URL', 'http://localhost:5173'),
  MONGO_URI: get('MONGO_URI'),
  JWT_SECRET: get('JWT_SECRET'),
  JWT_EXPIRES_IN: get('JWT_EXPIRES_IN', '7d'),
  GOOGLE_CLIENT_ID: get('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: get('GOOGLE_CLIENT_SECRET'),
  STRIPE_SECRET_KEY: get('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: get('STRIPE_WEBHOOK_SECRET'),
  AWS_REGION: get('AWS_REGION', 'us-east-1'),
  AWS_ACCESS_KEY_ID: get('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY: get('AWS_SECRET_ACCESS_KEY'),
  AWS_S3_BUCKET: get('AWS_S3_BUCKET'),
  BREVO_API_KEY: get('BREVO_API_KEY'),
  SENDER_EMAIL: get('SENDER_EMAIL'),
  SENDER_NAME: get('SENDER_NAME'),
};
