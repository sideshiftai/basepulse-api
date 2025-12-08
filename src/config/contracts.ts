/**
 * Smart contract configuration
 */

import { Address } from 'viem';
import { config } from './env';

// Network chain IDs
export const BASE_MAINNET_CHAIN_ID = 8453;
export const BASE_SEPOLIA_CHAIN_ID = 84532;

// RPC URLs for each network (with fallback defaults)
export const BASE_MAINNET_RPC = config.blockchain.baseMainnetRpcUrl || 'https://mainnet.base.org';
export const BASE_SEPOLIA_RPC = config.blockchain.baseSepoliaRpcUrl || 'https://sepolia.base.org';

// Contract addresses for each network (from environment variables)
const BASE_MAINNET_POLLS_CONTRACT: Address = config.blockchain.baseMainnetPollsContract as Address;
const BASE_SEPOLIA_POLLS_CONTRACT: Address = config.blockchain.baseSepoliaPollsContract as Address;

// Staking contract addresses (set when deployed)
const BASE_MAINNET_STAKING_CONTRACT: Address = (config.blockchain.baseMainnetStakingContract || '0x0000000000000000000000000000000000000000') as Address;
const BASE_SEPOLIA_STAKING_CONTRACT: Address = (config.blockchain.baseSepoliaStakingContract || '0x0000000000000000000000000000000000000000') as Address;

// Premium subscription contract addresses (set when deployed)
const BASE_MAINNET_PREMIUM_CONTRACT: Address = (config.blockchain.baseMainnetPremiumContract || '0x0000000000000000000000000000000000000000') as Address;
const BASE_SEPOLIA_PREMIUM_CONTRACT: Address = (config.blockchain.baseSepoliaPremiumContract || '0x0000000000000000000000000000000000000000') as Address;

// Environment-based configuration
const isProduction = process.env.NODE_ENV === 'production';

// Export active configuration based on environment
export const CHAIN_ID = isProduction ? BASE_MAINNET_CHAIN_ID : BASE_SEPOLIA_CHAIN_ID;
export const POLLS_CONTRACT_ADDRESS: Address = isProduction
  ? BASE_MAINNET_POLLS_CONTRACT
  : BASE_SEPOLIA_POLLS_CONTRACT;
export const STAKING_CONTRACT_ADDRESS: Address = isProduction
  ? BASE_MAINNET_STAKING_CONTRACT
  : BASE_SEPOLIA_STAKING_CONTRACT;
export const PREMIUM_CONTRACT_ADDRESS: Address = isProduction
  ? BASE_MAINNET_PREMIUM_CONTRACT
  : BASE_SEPOLIA_PREMIUM_CONTRACT;
export const RPC_URL = isProduction ? BASE_MAINNET_RPC : BASE_SEPOLIA_RPC;

// Helper to get config for a specific network
export const getNetworkConfig = (chainId: number) => {
  if (chainId === BASE_MAINNET_CHAIN_ID) {
    return {
      chainId: BASE_MAINNET_CHAIN_ID,
      pollsContract: BASE_MAINNET_POLLS_CONTRACT,
      rpcUrl: BASE_MAINNET_RPC,
      network: 'Base Mainnet',
    };
  } else if (chainId === BASE_SEPOLIA_CHAIN_ID) {
    return {
      chainId: BASE_SEPOLIA_CHAIN_ID,
      pollsContract: BASE_SEPOLIA_POLLS_CONTRACT,
      rpcUrl: BASE_SEPOLIA_RPC,
      network: 'Base Sepolia',
    };
  }
  throw new Error(`Unsupported chain ID: ${chainId}`);
};

// Contract ABI - Optimized contract (deployed 2025-01-10)
export const POLLS_CONTRACT_ABI = [
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'pollId', type: 'uint256' },
      { indexed: false, internalType: 'enum PollsContract.DistributionMode', name: 'mode', type: 'uint8' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'DistributionModeSet',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'pollId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
      { indexed: false, internalType: 'address', name: 'token', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'FundsWithdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'pollId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'creator', type: 'address' },
      { indexed: false, internalType: 'string', name: 'question', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'endTime', type: 'uint256' },
    ],
    name: 'PollCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'pollId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'funder', type: 'address' },
      { indexed: false, internalType: 'address', name: 'token', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'PollFunded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'pollId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'claimer', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'token', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'RewardClaimed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'pollId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'token', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'RewardDistributed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'pollId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'voter', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'optionIndex', type: 'uint256' },
    ],
    name: 'Voted',
    type: 'event',
  },
  // Functions
  {
    inputs: [
      { internalType: 'uint256', name: 'pollId', type: 'uint256' },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'address[]', name: 'tokens', type: 'address[]' }, // NEW: tokens array parameter
    ],
    name: 'withdrawFunds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'pollId', type: 'uint256' },
      { internalType: 'address', name: 'token', type: 'address' }, // NEW: token parameter
      { internalType: 'address[]', name: 'recipients', type: 'address[]' },
      { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
    ],
    name: 'distributeRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'pollId', type: 'uint256' }],
    name: 'getPoll',
    outputs: [
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'string', name: 'question', type: 'string' },
      { internalType: 'string[]', name: 'options', type: 'string[]' },
      { internalType: 'uint256[]', name: 'votes', type: 'uint256[]' },
      { internalType: 'uint256', name: 'endTime', type: 'uint256' },
      { internalType: 'bool', name: 'isActive', type: 'bool' },
      { internalType: 'address', name: 'creator', type: 'address' },
      { internalType: 'uint256', name: 'totalFunding', type: 'uint256' },
      { internalType: 'enum PollsContract.DistributionMode', name: 'distributionMode', type: 'uint8' }, // NEW: distributionMode
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'pollId', type: 'uint256' },
      { internalType: 'address', name: 'token', type: 'address' },
    ],
    name: 'getPollTokenBalance', // NEW: replaces getPollFundings
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'pollId', type: 'uint256' }],
    name: 'fundPollWithETH',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'pollId', type: 'uint256' },
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'fundPollWithToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'pollId', type: 'uint256' },
      { internalType: 'uint256', name: 'optionIndex', type: 'uint256' },
    ],
    name: 'vote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'pollId', type: 'uint256' }],
    name: 'getActivePolls',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'pollId', type: 'uint256' }],
    name: 'isPollActive',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'pollId', type: 'uint256' },
      { internalType: 'address', name: 'user', type: 'address' },
    ],
    name: 'hasUserVoted',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // VotesBought event for quadratic voting
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'pollId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'voter', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'optionIndex', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'numVotes', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'cost', type: 'uint256' },
    ],
    name: 'VotesBought',
    type: 'event',
  },
] as const;

// Staking Contract ABI
export const STAKING_CONTRACT_ABI = [
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'Staked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'Unstaked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'RewardsClaimed',
    type: 'event',
  },
  // View functions
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'isPremiumByStaking',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalStaked',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Premium Subscription Contract ABI
export const PREMIUM_CONTRACT_ABI = [
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint8', name: 'tier', type: 'uint8' },
      { indexed: false, internalType: 'uint256', name: 'expirationTime', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'price', type: 'uint256' },
    ],
    name: 'SubscriptionPurchased',
    type: 'event',
  },
  // View functions
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'isPremium',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'isPremiumOrStaked',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
