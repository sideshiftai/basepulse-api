/**
 * Smart contract configuration
 */

import { Address } from 'viem';

// Network chain IDs
export const BASE_MAINNET_CHAIN_ID = 8453;
export const BASE_SEPOLIA_CHAIN_ID = 84532;

// RPC URLs for each network
export const BASE_MAINNET_RPC = 'https://mainnet.base.org';
export const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

// Contract addresses for each network
const BASE_MAINNET_POLLS_CONTRACT: Address = '0xfc0323F3c5eD271564Ca8F3d4C5FfAD32D553893';
const BASE_SEPOLIA_POLLS_CONTRACT: Address = '0xdfb6881ad34F26D57c3146d335848EDba21dFb6f'; // Optimized contract deployed 2025-01-10

// Environment-based configuration
const isProduction = process.env.NODE_ENV === 'production';

// Export active configuration based on environment
export const CHAIN_ID = isProduction ? BASE_MAINNET_CHAIN_ID : BASE_SEPOLIA_CHAIN_ID;
export const POLLS_CONTRACT_ADDRESS: Address = isProduction
  ? BASE_MAINNET_POLLS_CONTRACT
  : BASE_SEPOLIA_POLLS_CONTRACT;
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
] as const;
