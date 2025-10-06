/**
 * Environment configuration with validation
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database - at least one must be provided
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),

  // Blockchain
  PULSECHAIN_RPC_URL: z.string().url(),

  // Sideshift
  SIDESHIFT_AFFILIATE_ID: z.string().optional(),

  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Security
  WEBHOOK_SECRET: z.string().min(32),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    const env = envSchema.parse(process.env);

    // Validate that at least one database is configured
    if (!env.DATABASE_URL && !env.REDIS_URL) {
      throw new Error('Either DATABASE_URL or REDIS_URL must be provided');
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.issues.forEach((err: z.ZodIssue) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

export const config = {
  server: {
    port: parseInt(env.PORT, 10),
    env: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
  },
  database: {
    url: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
  },
  blockchain: {
    rpcUrl: env.PULSECHAIN_RPC_URL,
  },
  sideshift: {
    apiUrl: 'https://sideshift.ai/api/v2',
    affiliateId: env.SIDESHIFT_AFFILIATE_ID,
  },
  cors: {
    origin: env.FRONTEND_URL,
  },
  security: {
    webhookSecret: env.WEBHOOK_SECRET,
  },
} as const;
