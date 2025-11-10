# BasePulse API Documentation

Complete API reference for the BasePulse backend service.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://api.basepulse.io/api` (configure in deployment)

## Authentication

Currently, the API is public. Future versions may require API keys or wallet signatures for write operations.

---

## Polls API

### Get All Polls

```
GET /api/polls
```

Get list of all polls with optional filtering.

**Query Parameters:**
- `chainId` (optional): Filter by chain ID (8453 for Base Mainnet, 84532 for Base Sepolia)
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "polls": [
    {
      "id": "uuid",
      "chainId": 84532,
      "pollId": "1",
      "distributionMode": "MANUAL_PULL",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "limit": 50,
    "offset": 0,
    "count": 10
  }
}
```

### Get Poll by ID

```
GET /api/polls/:id
```

Get a specific poll by database ID.

**Response:**
```json
{
  "poll": {
    "id": "uuid",
    "chainId": 84532,
    "pollId": "1",
    "distributionMode": "MANUAL_PULL",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Poll with Distributions

```
GET /api/polls/:id/full
```

Get poll details including all distribution logs.

**Response:**
```json
{
  "poll": {
    "id": "uuid",
    "chainId": 84532,
    "pollId": "1",
    "distributionMode": "AUTOMATED",
    "distributions": [
      {
        "id": "uuid",
        "pollId": "uuid",
        "recipient": "0x123...",
        "amount": "1000000000000000000",
        "token": "0x000...",
        "txHash": "0xabc...",
        "eventType": "distributed",
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Get Poll by Chain and Poll ID

```
GET /api/polls/chain/:chainId/:pollId
```

Get poll using chain ID and on-chain poll ID.

**Parameters:**
- `chainId`: Chain ID (e.g., 84532)
- `pollId`: On-chain poll ID (e.g., 1)

### Update Distribution Mode

```
PUT /api/polls/:id/distribution-mode
```

Update the distribution mode for a poll.

**Request Body:**
```json
{
  "mode": "MANUAL_PULL" | "MANUAL_PUSH" | "AUTOMATED"
}
```

**Response:**
```json
{
  "poll": {
    "id": "uuid",
    "distributionMode": "AUTOMATED",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Poll Distributions

```
GET /api/polls/:id/distributions
```

Get all distribution logs for a poll.

**Response:**
```json
{
  "pollId": "uuid",
  "distributions": [...],
  "count": 10
}
```

### Get Poll Statistics

```
GET /api/polls/:id/stats
```

Get aggregated statistics for a poll.

**Response:**
```json
{
  "pollId": "uuid",
  "stats": {
    "totalDistributed": "5000000000000000000",
    "distributionCount": 10,
    "uniqueRecipients": 8
  }
}
```

---

## Leaderboard API

### Get Comprehensive Leaderboard

```
GET /api/leaderboard
```

Get top users across all ranking categories.

**Query Parameters:**
- `limit` (optional): Number of users per category (default: 10)

**Response:**
```json
{
  "topByRewards": [...],
  "topByVotes": [...],
  "topByPollsCreated": [...],
  "topByParticipation": [...]
}
```

### Get Top Users by Rewards

```
GET /api/leaderboard/rewards
```

**Query Parameters:**
- `limit` (optional): Number of results (default: 10)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "address": "0x123...",
      "totalRewards": "10000000000000000000",
      "pollsParticipated": 5,
      "totalVotes": 15,
      "pollsCreated": 2,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "limit": 10,
    "offset": 0,
    "count": 10
  }
}
```

### Get Top Users by Votes

```
GET /api/leaderboard/votes
```

Same query parameters and response format as rewards endpoint.

### Get Top Creators

```
GET /api/leaderboard/creators
```

Get top users by number of polls created.

### Get Top by Participation

```
GET /api/leaderboard/participation
```

Get top users by number of polls participated in.

### Get Platform Statistics

```
GET /api/leaderboard/stats
```

Get aggregated platform statistics.

**Response:**
```json
{
  "stats": {
    "totalUsers": 1000,
    "totalRewardsDistributed": "50000000000000000000",
    "totalVotes": 5000,
    "totalPolls": 100
  }
}
```

### Get User Statistics

```
GET /api/leaderboard/user/:address
```

Get statistics and rankings for a specific user.

**Response:**
```json
{
  "address": "0x123...",
  "stats": {
    "totalRewards": "1000000000000000000",
    "pollsParticipated": 5,
    "totalVotes": 10,
    "pollsCreated": 1
  },
  "rankings": {
    "byRewards": 45,
    "byVotes": 32
  }
}
```

---

## Preferences API

### Get User Preferences

```
GET /api/preferences/:address
```

Get preferences for a wallet address.

**Response:**
```json
{
  "preferences": {
    "id": "uuid",
    "address": "0x123...",
    "preferredToken": "USDC",
    "autoClaimEnabled": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update User Preferences

```
PUT /api/preferences/:address
```

**Request Body:**
```json
{
  "preferredToken": "USDC",
  "autoClaimEnabled": true
}
```

### Update Preferred Token

```
PATCH /api/preferences/:address/token
```

**Request Body:**
```json
{
  "token": "USDC"
}
```

### Update Auto-Claim Setting

```
PATCH /api/preferences/:address/auto-claim
```

**Request Body:**
```json
{
  "enabled": true
}
```

### Delete Preferences

```
DELETE /api/preferences/:address
```

**Response:**
```json
{
  "success": true
}
```

---

## Analytics API

### Get Analytics Overview

```
GET /api/analytics/overview
```

Get system-wide analytics overview.

**Response:**
```json
{
  "polls": {
    "totalPolls": 100,
    "pollsByChain": [...]
  },
  "distributions": {
    "totalDistributions": 500,
    "totalAmount": "50000000000000000000",
    "uniqueRecipients": 250,
    "byEventType": [...]
  },
  "users": {
    "totalUsers": 1000,
    "totalRewards": "50000000000000000000",
    "totalVotes": 5000,
    "activeUsers": 800
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Poll Analytics

```
GET /api/analytics/polls/:pollId
```

Get detailed analytics for a specific poll.

**Response:**
```json
{
  "poll": {...},
  "distributions": {
    "logs": [...],
    "stats": {
      "totalDistributed": "5000000000000000000",
      "distributionCount": 10,
      "uniqueRecipients": 8,
      "avgAmount": "500000000000000000",
      "maxAmount": "1000000000000000000",
      "minAmount": "100000000000000000"
    }
  }
}
```

### Get Participation Trends

```
GET /api/analytics/trends
```

Get participation trends over time.

**Query Parameters:**
- `chainId` (optional): Filter by chain
- `days` (optional): Number of days to look back (default: 30)

**Response:**
```json
{
  "period": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-31T00:00:00.000Z",
    "days": 30
  },
  "polls": [
    {
      "date": "2024-01-01",
      "pollsCreated": 5
    }
  ],
  "distributions": [
    {
      "date": "2024-01-01",
      "distributionCount": 20,
      "totalAmount": "2000000000000000000"
    }
  ]
}
```

### Get Reward Analytics

```
GET /api/analytics/rewards
```

Get reward distribution analytics.

**Query Parameters:**
- `chainId` (optional): Filter by chain

**Response:**
```json
{
  "byPoll": [...],
  "byMode": {
    "MANUAL_PULL": {
      "count": 10,
      "totalDistributed": "10000000000000000000",
      "totalRecipients": 50
    },
    "AUTOMATED": {
      "count": 20,
      "totalDistributed": "20000000000000000000",
      "totalRecipients": 100
    }
  },
  "total": {
    "polls": 30,
    "totalDistributed": "30000000000000000000"
  }
}
```

### Get User Engagement

```
GET /api/analytics/engagement
```

Get user engagement metrics.

**Response:**
```json
{
  "metrics": {
    "totalUsers": 1000,
    "activeVoters": 800,
    "activeCreators": 50,
    "rewardRecipients": 600,
    "avgVotesPerUser": "5.5",
    "avgRewardsPerUser": "50000000000000000"
  },
  "topContributors": [...]
}
```

### Compare Polls

```
POST /api/analytics/compare
```

Compare multiple polls side by side.

**Request Body:**
```json
{
  "pollIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "polls": [
    {
      "poll": {...},
      "stats": {
        "totalDistributed": "5000000000000000000",
        "distributionCount": 10,
        "uniqueRecipients": 8
      }
    }
  ],
  "comparisonDate": "2024-01-01T00:00:00.000Z"
}
```

---

## SideShift API

*(Existing endpoints for cryptocurrency conversion)*

### Get Supported Assets

```
GET /api/sideshift/supported-assets
```

### Create Shift Order

```
POST /api/sideshift/create-shift
```

### Get Shift Status

```
GET /api/sideshift/shift-status/:id
```

### Webhook Handler

```
POST /api/sideshift/webhook
```

### Get User Shifts

```
GET /api/sideshift/user/:address
```

### Get Poll Shifts

```
GET /api/sideshift/poll/:pollId
```

---

## Error Responses

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "error": "Invalid request data",
  "details": [...]
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Production deployment should add rate limiting middleware.

## CORS

The API supports CORS for the configured frontend origin. See `.env` for configuration.

## Health Check

```
GET /health
```

Returns API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```
