/**
 * Request validation schemas using Zod
 */

import { z } from 'zod';
import { isAddress } from 'viem';

// Custom address validator
const ethereumAddress = z.string().refine(
  (val) => isAddress(val),
  { message: 'Invalid Ethereum address' }
);

// Create shift request validation
export const createShiftSchema = z.object({
  pollId: z.string().min(1, 'Poll ID is required'),
  userAddress: ethereumAddress,
  purpose: z.enum(['fund_poll', 'claim_reward']),
  sourceCoin: z.string().min(1, 'Source coin is required'),
  destCoin: z.string().min(1, 'Destination coin is required'),
  sourceNetwork: z.string().optional(),
  destNetwork: z.string().optional(),
  sourceAmount: z.string().optional(),
  refundAddress: ethereumAddress.optional(),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;

// Webhook payload validation
export const webhookPayloadSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  createdAt: z.string(),
  type: z.enum(['shift', 'quote']),
  status: z.enum([
    'waiting',
    'processing',
    'settling',
    'settled',
    'refund',
    'refunded',
    'expired',
  ]),
  depositCoin: z.string(),
  settleCoin: z.string(),
  depositNetwork: z.string(),
  settleNetwork: z.string(),
  depositAddress: z.string(),
  settleAddress: z.string(),
  depositAmount: z.string().optional(),
  settleAmount: z.string().optional(),
  depositReceived: z.string().optional(),
  settleReceived: z.string().optional(),
  depositHash: z.string().optional(),
  settleHash: z.string().optional(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
