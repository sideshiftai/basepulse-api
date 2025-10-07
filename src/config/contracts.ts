/**
 * Smart contract configuration
 */

import { Address } from 'viem';

// Base Sepolia network configuration
export const BASE_SEPOLIA_CHAIN_ID = 84532;

// Contract addresses - update these with your deployed contract addresses
export const POLLS_CONTRACT_ADDRESS: Address = '0xa3713739c39419aA1c6daf349dB4342Be59b9142';

// Contract ABI - minimal ABI for the functions we need
export const POLLS_CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'pollId', type: 'uint256' },
      { internalType: 'address', name: 'recipient', type: 'address' },
    ],
    name: 'withdrawFunds',
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
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'pollId', type: 'uint256' }],
    name: 'getPollFundings',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'token', type: 'address' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'address', name: 'funder', type: 'address' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        ],
        internalType: 'struct PollsContract.Funding[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
