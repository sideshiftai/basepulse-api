/**
 * AI Configuration for BasePulse Chatbox
 * OpenAI API integration settings and system prompts
 */

// AI Model Configuration
export const AI_CONFIG = {
  model: process.env.AI_MODEL || 'gpt-4o',
  maxTokens: 2048,
  temperature: 0.7,
} as const;

// System prompt for the AI assistant
export const SYSTEM_PROMPT = `You are the BasePulse AI Assistant, helping users create and manage polls on the Base blockchain.

## CRITICAL: Always Use Tools
You MUST use the provided function tools to perform actions. Do NOT just describe what you would do - actually call the tools.

When a user wants to create a poll:
1. IMMEDIATELY call the \`preview_poll\` function with the poll details
2. Do NOT just list the options in text - use the tool to generate a visual preview
3. The preview_poll tool will display a nice UI card for the user

## Your Capabilities:
1. **Create Polls** - Use \`preview_poll\` to show a preview, then \`create_poll\` after confirmation
2. **Fund Polls** - Use \`create_funding_shift\` to create SideShift orders
3. **Manage Polls** - Use \`get_user_polls\` and \`get_poll_details\` to show poll info
4. **Claim Rewards** - Use \`create_claim_shift\` to claim rewards in any cryptocurrency

## Poll Creation Flow:
1. User requests a poll → Call \`preview_poll\` with question, options, duration
2. If user doesn't specify options, suggest 4-6 relevant ones and call \`preview_poll\`
3. Duration defaults to 7 days (604800 seconds) if not specified
4. maxVoters defaults to 0 (unlimited) if not specified

## Important Rules:
- ALWAYS call \`preview_poll\` when user wants to create a poll - never just describe it in text
- Extract poll parameters from user's message and pass them to the tool
- Be concise in your text responses
- The UI will render tool results nicely - trust the tools

Remember: You're helping democratize decision-making through blockchain-powered polls!`;

// Tool definitions for OpenAI function calling
export const AI_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'preview_poll',
      description: 'REQUIRED: Call this function whenever a user wants to create a poll. This displays a visual preview card with the poll details. Always use this instead of describing the poll in text.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The poll question to ask voters',
          },
          options: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of 2-10 voting options. Generate sensible options if user did not specify.',
          },
          duration: {
            type: 'number',
            description: 'Poll duration in seconds. Default to 604800 (7 days) if not specified.',
          },
          maxVoters: {
            type: 'number',
            description: 'Maximum number of voters. Use 0 or omit for unlimited.',
          },
          fundingAmount: {
            type: 'string',
            description: 'Funding amount in USD equivalent (e.g., "50")',
          },
          fundingToken: {
            type: 'string',
            description: 'Token to fund with (e.g., "USDC", "ETH")',
          },
        },
        required: ['question', 'options'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_poll',
      description: 'Create a new poll on the blockchain. Only call this after the user confirms the preview.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The poll question',
          },
          options: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of poll options',
          },
          duration: {
            type: 'number',
            description: 'Poll duration in seconds',
          },
          maxVoters: {
            type: 'number',
            description: 'Maximum number of voters (0 for unlimited)',
          },
        },
        required: ['question', 'options', 'duration'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_funding_shift',
      description: 'Create a SideShift order to fund a poll with any cryptocurrency',
      parameters: {
        type: 'object',
        properties: {
          pollId: {
            type: 'string',
            description: 'The poll ID to fund',
          },
          sourceCoin: {
            type: 'string',
            description: 'Source cryptocurrency (e.g., "BTC", "ETH", "SOL")',
          },
          sourceNetwork: {
            type: 'string',
            description: 'Source network (e.g., "bitcoin", "ethereum", "solana")',
          },
          amount: {
            type: 'string',
            description: 'Amount to send in source currency',
          },
        },
        required: ['pollId', 'sourceCoin', 'amount'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_user_polls',
      description: 'Get all polls created by the current user',
      parameters: {
        type: 'object',
        properties: {
          userAddress: {
            type: 'string',
            description: 'User wallet address',
          },
          status: {
            type: 'string',
            enum: ['active', 'ended', 'all'],
            description: 'Filter by poll status',
          },
        },
        required: ['userAddress'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_poll_details',
      description: 'Get details of a specific poll',
      parameters: {
        type: 'object',
        properties: {
          pollId: {
            type: 'string',
            description: 'The poll ID',
          },
        },
        required: ['pollId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_claimable_rewards',
      description: 'Get claimable rewards for a user',
      parameters: {
        type: 'object',
        properties: {
          userAddress: {
            type: 'string',
            description: 'User wallet address',
          },
        },
        required: ['userAddress'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_claim_shift',
      description: 'Create a SideShift order to claim rewards in any cryptocurrency',
      parameters: {
        type: 'object',
        properties: {
          pollId: {
            type: 'string',
            description: 'The poll ID to claim rewards from',
          },
          destCoin: {
            type: 'string',
            description: 'Destination cryptocurrency (e.g., "BTC", "USDC", "SOL")',
          },
          destNetwork: {
            type: 'string',
            description: 'Destination network (e.g., "bitcoin", "ethereum", "solana")',
          },
        },
        required: ['pollId', 'destCoin'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_shift_status',
      description: 'Check the status of a SideShift order',
      parameters: {
        type: 'object',
        properties: {
          shiftId: {
            type: 'string',
            description: 'The SideShift order ID',
          },
        },
        required: ['shiftId'],
      },
    },
  },
];
