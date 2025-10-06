/**
 * Blockchain service for interacting with PulseChain smart contracts
 */

import { createPublicClient, createWalletClient, http, Address } from 'viem';
import { pulsechain } from 'viem/chains';
import { config } from '../config/env';
import { POLLS_CONTRACT_ADDRESS, POLLS_CONTRACT_ABI } from '../config/contracts';

// Create public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: pulsechain,
  transport: http(config.blockchain.rpcUrl),
});

/**
 * Blockchain service for smart contract interactions
 */
export class BlockchainService {
  /**
   * Get poll data from smart contract
   */
  async getPoll(pollId: bigint) {
    try {
      const result = await publicClient.readContract({
        address: POLLS_CONTRACT_ADDRESS,
        abi: POLLS_CONTRACT_ABI,
        functionName: 'getPoll',
        args: [pollId],
      });

      return {
        id: result[0],
        question: result[1],
        options: result[2],
        votes: result[3],
        endTime: result[4],
        isActive: result[5],
        creator: result[6],
        totalFunding: result[7],
      };
    } catch (error) {
      throw new Error(`Failed to get poll ${pollId}: ${error}`);
    }
  }

  /**
   * Get poll funding details
   */
  async getPollFundings(pollId: bigint) {
    try {
      const result = await publicClient.readContract({
        address: POLLS_CONTRACT_ADDRESS,
        abi: POLLS_CONTRACT_ABI,
        functionName: 'getPollFundings',
        args: [pollId],
      });

      return result.map((funding) => ({
        token: funding.token,
        amount: funding.amount,
        funder: funding.funder,
        timestamp: funding.timestamp,
      }));
    } catch (error) {
      throw new Error(`Failed to get poll fundings ${pollId}: ${error}`);
    }
  }

  /**
   * Verify that a poll exists and is valid
   */
  async validatePoll(pollId: string): Promise<boolean> {
    try {
      const poll = await this.getPoll(BigInt(pollId));
      return poll.id > 0n;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if poll has ended and has funds to claim
   */
  async canClaimRewards(pollId: string): Promise<{ canClaim: boolean; reason?: string }> {
    try {
      const poll = await this.getPoll(BigInt(pollId));

      if (!poll.isActive) {
        return { canClaim: false, reason: 'Poll is not active' };
      }

      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      if (currentTime < poll.endTime) {
        return { canClaim: false, reason: 'Poll has not ended yet' };
      }

      if (poll.totalFunding === 0n) {
        return { canClaim: false, reason: 'Poll has no funding' };
      }

      return { canClaim: true };
    } catch (error) {
      return { canClaim: false, reason: `Error checking poll: ${error}` };
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: `0x${string}`) {
    try {
      return await publicClient.getTransactionReceipt({ hash: txHash });
    } catch (error) {
      throw new Error(`Failed to get transaction receipt: ${error}`);
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: `0x${string}`, confirmations = 1) {
    try {
      return await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations,
      });
    } catch (error) {
      throw new Error(`Transaction failed: ${error}`);
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
