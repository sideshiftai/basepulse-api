/**
 * Sideshift AI API Types
 * Based on https://sideshift.ai/api
 */

export type ShiftType = 'fixed' | 'variable';

export type ShiftStatus =
  | 'waiting'      // Waiting for deposit
  | 'processing'   // Processing the shift
  | 'settling'     // Settling the transaction
  | 'settled'      // Completed successfully
  | 'refund'       // Refund in progress
  | 'refunded'     // Refund completed
  | 'expired';     // Shift expired

export interface SideshiftAsset {
  coin: string;           // e.g., "BTC", "ETH"
  name: string;           // Full name
  networks: string[];     // Available networks
  hasMemo: boolean;       // Whether the asset requires a memo
  fixedOnly: string[];    // Networks that only support fixed-rate shifts
  variableOnly: string[]; // Networks that only support variable-rate shifts
}

export interface SideshiftQuote {
  id: string;
  createdAt: string;
  depositCoin: string;
  settleCoin: string;
  depositNetwork: string;
  settleNetwork: string;
  expiresAt: string;
  depositAmount: string;
  settleAmount: string;
  rate: string;
  affiliateId?: string;
}

export interface SideshiftOrder {
  id: string;
  createdAt: string;
  depositCoin: string;
  settleCoin: string;
  depositNetwork: string;
  settleNetwork: string;
  depositAddress: string;
  settleAddress: string;
  depositMin?: string;
  depositMax?: string;
  type: ShiftType;
  quoteId?: string;
  depositAmount?: string;
  settleAmount?: string;
  expiresAt: string;
  status: ShiftStatus;
  averageShiftSeconds?: string;
}

export interface SideshiftPermission {
  createShift: boolean;
}

// Request to create a quote (step 1 for fixed shifts)
export interface CreateQuoteRequest {
  depositCoin: string;
  settleCoin: string;
  depositNetwork?: string;
  settleNetwork?: string;
  depositAmount?: string;
  settleAmount?: string;
  affiliateId?: string;
}

// Request to create a fixed shift (step 2 for fixed shifts)
export interface CreateFixedShiftRequest {
  quoteId: string;
  settleAddress: string;
  affiliateId?: string;
  settleMemo?: string;
  refundAddress?: string;
  refundMemo?: string;
  externalId?: string;
}

export interface CreateVariableShiftRequest {
  settleAddress: string;
  affiliateId?: string;
  settleNetwork?: string;
  depositCoin: string;
  settleCoin: string;
  depositNetwork?: string;
  refundAddress?: string;
  refundNetwork?: string;
}

export interface SideshiftWebhookPayload {
  id: string;
  orderId: string;
  createdAt: string;
  type: 'shift' | 'quote';
  status: ShiftStatus;
  depositCoin: string;
  settleCoin: string;
  depositNetwork: string;
  settleNetwork: string;
  depositAddress: string;
  settleAddress: string;
  depositAmount?: string;
  settleAmount?: string;
  depositReceived?: string;
  settleReceived?: string;
  depositHash?: string;
  settleHash?: string;
}
