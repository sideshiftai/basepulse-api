/**
 * Blockchain service for interacting with Base network smart contracts
 */

import { createPublicClient, createWalletClient, http, Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { config } from '../config/env';
import { POLLS_CONTRACT_ADDRESS, POLLS_CONTRACT_ABI } from '../config/contracts';

// Create public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

// Current chain ID for the deployment
const CURRENT_CHAIN_ID = baseSepolia.id; // 84532

/**
 * Blockchain service for smart contract interactions
 */
export class BlockchainService {
  /**
   * Get the chain ID where polls are deployed
   * @param pollId - The poll ID (currently all polls are on the same chain)
   * @returns Chain ID (e.g., 84532 for Base Sepolia)
   */
  getPollChain(pollId: string): number {
    // Currently all polls are deployed on the same chain
    // In the future, this could query a database or registry
    // to support multi-chain polls
    return CURRENT_CHAIN_ID;
  }
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

  /**
   * Withdraw funds from a poll (backend automated claim)
   * Requires BACKEND_PRIVATE_KEY environment variable
   */
  async withdrawFunds(pollId: string, recipient: Address): Promise<`0x${string}`> {
    try {
      // Check if backend wallet is configured
      const privateKey = config.backend.privateKey;
      if (!privateKey) {
        throw new Error('Backend wallet not configured. Set BACKEND_PRIVATE_KEY in .env');
      }

      // Create wallet client for backend transactions
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http('https://sepolia.base.org'),
      });

      // Call withdrawFunds on the contract
      const hash = await walletClient.writeContract({
        address: POLLS_CONTRACT_ADDRESS,
        abi: POLLS_CONTRACT_ABI,
        functionName: 'withdrawFunds',
        args: [BigInt(pollId), recipient],
        account,
      });

      // Wait for transaction confirmation
      const receipt = await this.waitForTransaction(hash);

      if (receipt.status !== 'success') {
        throw new Error('Transaction reverted');
      }

      return hash;
    } catch (error) {
      throw new Error(`Failed to withdraw funds: ${error}`);
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
