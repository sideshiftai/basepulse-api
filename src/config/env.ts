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
  BASE_MAINNET_POLLS_CONTRACT: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
  BASE_SEPOLIA_POLLS_CONTRACT: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
  BASE_MAINNET_RPC_URL: z.string().url().optional(),
  BASE_SEPOLIA_RPC_URL: z.string().url().optional(),
  // Staking contracts (optional - set when deployed)
  BASE_MAINNET_STAKING_CONTRACT: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format').optional(),
  BASE_SEPOLIA_STAKING_CONTRACT: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format').optional(),
  // Premium subscription contracts (optional - set when deployed)
  BASE_MAINNET_PREMIUM_CONTRACT: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format').optional(),
  BASE_SEPOLIA_PREMIUM_CONTRACT: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format').optional(),

  // Sideshift
  SIDESHIFT_AFFILIATE_ID: z.string().optional(),
  SIDESHIFT_SECRET: z.string().optional(),

  // CORS - Comma-separated list of frontend URLs
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Security
  WEBHOOK_SECRET: z.string().min(32),

  // Backend Wallet (for automated contract calls)
  BACKEND_PRIVATE_KEY: z.string().optional(),
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
    baseMainnetPollsContract: env.BASE_MAINNET_POLLS_CONTRACT,
    baseSepoliaPollsContract: env.BASE_SEPOLIA_POLLS_CONTRACT,
    baseMainnetRpcUrl: env.BASE_MAINNET_RPC_URL,
    baseSepoliaRpcUrl: env.BASE_SEPOLIA_RPC_URL,
    baseMainnetStakingContract: env.BASE_MAINNET_STAKING_CONTRACT,
    baseSepoliaStakingContract: env.BASE_SEPOLIA_STAKING_CONTRACT,
    baseMainnetPremiumContract: env.BASE_MAINNET_PREMIUM_CONTRACT,
    baseSepoliaPremiumContract: env.BASE_SEPOLIA_PREMIUM_CONTRACT,
  },
  sideshift: {
    apiUrl: 'https://sideshift.ai/api/v2',
    affiliateId: env.SIDESHIFT_AFFILIATE_ID,
    secret: env.SIDESHIFT_SECRET,
  },
  cors: {
    origin: (() => {
      const urls = env.FRONTEND_URL.split(',').map(url => url.trim());
      // Validate each URL
      urls.forEach(url => {
        try {
          new URL(url);
        } catch (error) {
          throw new Error(`Invalid URL in FRONTEND_URL: ${url}`);
        }
      });
      return urls;
    })(),
  },
  security: {
    webhookSecret: env.WEBHOOK_SECRET,
  },
  backend: {
    privateKey: env.BACKEND_PRIVATE_KEY,
  },
} as const;
