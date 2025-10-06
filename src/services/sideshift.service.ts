/**
 * Sideshift AI API Client
 * Handles all interactions with Sideshift AI API
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import {
  SideshiftAsset,
  SideshiftQuote,
  SideshiftOrder,
  SideshiftPermission,
  CreateFixedShiftRequest,
  CreateVariableShiftRequest,
  ShiftType,
} from '../types';

export class SideshiftService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.sideshift.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          throw new Error(
            `Sideshift API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
          );
        } else if (error.request) {
          throw new Error('Sideshift API: No response received');
        } else {
          throw new Error(`Sideshift API error: ${error.message}`);
        }
      }
    );
  }

  /**
   * Get all supported coins/assets
   */
  async getCoins(): Promise<SideshiftAsset[]> {
    const response = await this.client.get<SideshiftAsset[]>('/coins');
    return response.data;
  }

  /**
   * Get pair information (exchange rates and limits)
   */
  async getPair(depositCoin: string, settleCoin: string) {
    const response = await this.client.get(`/pair/${depositCoin}/${settleCoin}`);
    return response.data;
  }

  /**
   * Get current permissions (rate limits)
   */
  async getPermissions(): Promise<SideshiftPermission> {
    const response = await this.client.get<SideshiftPermission>('/permissions');
    return response.data;
  }

  /**
   * Create a fixed-rate quote
   */
  async createQuote(params: {
    depositCoin: string;
    settleCoin: string;
    depositNetwork?: string;
    settleNetwork?: string;
    depositAmount: string;
    affiliateId?: string;
  }): Promise<SideshiftQuote> {
    const response = await this.client.post<SideshiftQuote>('/quotes', {
      depositCoin: params.depositCoin,
      settleCoin: params.settleCoin,
      depositNetwork: params.depositNetwork,
      settleNetwork: params.settleNetwork,
      depositAmount: params.depositAmount,
      affiliateId: params.affiliateId || config.sideshift.affiliateId,
    });
    return response.data;
  }

  /**
   * Create a fixed-rate shift
   */
  async createFixedShift(params: CreateFixedShiftRequest): Promise<SideshiftOrder> {
    const payload = {
      ...params,
      affiliateId: params.affiliateId || config.sideshift.affiliateId,
    };

    const response = await this.client.post<SideshiftOrder>('/shifts/fixed', payload);
    return response.data;
  }

  /**
   * Create a variable-rate shift
   */
  async createVariableShift(params: CreateVariableShiftRequest): Promise<SideshiftOrder> {
    const payload = {
      ...params,
      affiliateId: params.affiliateId || config.sideshift.affiliateId,
    };

    const response = await this.client.post<SideshiftOrder>('/shifts/variable', payload);
    return response.data;
  }

  /**
   * Get shift status by order ID
   */
  async getShift(orderId: string): Promise<SideshiftOrder> {
    const response = await this.client.get<SideshiftOrder>(`/shifts/${orderId}`);
    return response.data;
  }

  /**
   * Helper: Create a shift (fixed or variable)
   */
  async createShift(
    type: ShiftType,
    params: CreateFixedShiftRequest | CreateVariableShiftRequest
  ): Promise<SideshiftOrder> {
    if (type === 'fixed') {
      return this.createFixedShift(params as CreateFixedShiftRequest);
    } else {
      return this.createVariableShift(params as CreateVariableShiftRequest);
    }
  }

  /**
   * Helper: Get recommended networks for a coin pair
   */
  async getRecommendedNetworks(depositCoin: string, settleCoin: string) {
    const coins = await this.getCoins();

    const depositCoinData = coins.find((c) => c.coin.toLowerCase() === depositCoin.toLowerCase());
    const settleCoinData = coins.find((c) => c.coin.toLowerCase() === settleCoin.toLowerCase());

    if (!depositCoinData || !settleCoinData) {
      throw new Error(`Coin not found: ${depositCoin} or ${settleCoin}`);
    }

    return {
      depositNetworks: depositCoinData.networks,
      settleNetworks: settleCoinData.networks,
      defaultDepositNetwork: depositCoinData.networks[0],
      defaultSettleNetwork: settleCoinData.networks[0],
    };
  }
}

// Export singleton instance
export const sideshiftService = new SideshiftService();
