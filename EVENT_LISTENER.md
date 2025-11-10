# BasePulse Event Listener Service

The Event Listener Service monitors blockchain events from the PollsContract smart contract and syncs data to the PostgreSQL database in real-time.

## Features

- **Real-time Event Monitoring**: Listens to all contract events using Viem's `watchContractEvent`
- **Automatic Database Sync**: Updates polls, distribution logs, and leaderboard tables
- **Checkpoint System**: Tracks the last processed block to prevent duplicate processing
- **Historical Sync**: Can backfill events from any block range
- **Error Handling**: Automatic reconnection and error recovery

## Monitored Events

1. **PollCreated** - New poll creation
   - Creates poll record in database
   - Increments creator's polls created count

2. **PollFunded** - Poll receives funding
   - Tracks funding events

3. **Voted** - User votes on a poll
   - Increments voter's total votes
   - Updates polls participated count

4. **DistributionModeSet** - Creator sets distribution mode
   - Updates poll's distribution mode (MANUAL_PULL, MANUAL_PUSH, or AUTOMATED)

5. **RewardDistributed** - Rewards distributed to recipients
   - Logs distribution to DistributionLog table
   - Updates recipient's total rewards in leaderboard

6. **RewardClaimed** - User claims rewards
   - Logs claim to DistributionLog table
   - Updates claimer's total rewards in leaderboard

7. **FundsWithdrawn** - Creator withdraws funds
   - Logs withdrawal to DistributionLog table

## Database Tables Updated

### Polls
- Stores poll metadata from blockchain
- Tracks distribution mode settings

### DistributionLog
- Complete history of all distributions, claims, and withdrawals
- Links to poll records via foreign key

### Leaderboard
- Real-time aggregated user statistics:
  - Total rewards received
  - Polls participated in
  - Total votes cast
  - Polls created

### Checkpoint
- Tracks last processed block number per chain
- Ensures no duplicate event processing

## Usage

### Start Listening to Events

```bash
npm run event-listener start
```

This starts the service and listens for new events in real-time. Press Ctrl+C to stop.

### Sync Historical Events

To backfill events from genesis:

```bash
npm run event-listener sync 0
```

To sync a specific block range:

```bash
npm run event-listener sync 1000000 2000000
```

## Environment Configuration

The service automatically selects the correct network based on `NODE_ENV`:

- **Production**: Base Mainnet (Chain ID: 8453)
- **Development**: Base Sepolia (Chain ID: 84532)

Contract addresses are configured in `src/config/contracts.ts`.

## Architecture

### EventListenerService Class

**Key Methods:**

- `startListening()` - Starts watching all contract events
- `stopListening()` - Stops all event listeners
- `syncHistoricalEvents(fromBlock, toBlock)` - Syncs past events

**Event Handlers:**

Each event has a dedicated handler method (e.g., `handlePollCreated`, `handleVoted`) that:
1. Extracts event data from blockchain logs
2. Updates relevant database tables
3. Updates checkpoint to track progress

### Checkpoint System

The checkpoint system prevents duplicate processing:

1. On startup, loads the last processed block from database
2. After processing each event, updates the checkpoint
3. On restart, resumes from the last checkpoint

### Error Handling

- Each event handler has try-catch error handling
- Connection errors trigger automatic reconnection
- Failed events are logged but don't stop the service

## Deployment

### Production Deployment

1. Set environment variables:
   ```bash
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   ```

2. Run the event listener as a background service:
   ```bash
   # Using PM2
   pm2 start npm --name "basepulse-events" -- run event-listener start

   # Using systemd (create /etc/systemd/system/basepulse-events.service)
   [Unit]
   Description=BasePulse Event Listener

   [Service]
   ExecStart=/usr/bin/npm run event-listener start
   WorkingDirectory=/path/to/basepulse-api
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

3. Monitor logs:
   ```bash
   pm2 logs basepulse-events
   # or
   journalctl -u basepulse-events -f
   ```

### Initial Sync

Before starting real-time monitoring, sync historical events:

```bash
# Get contract deployment block from Basescan
# For example, if deployed at block 5000000:
npm run event-listener sync 5000000

# Then start real-time listener
npm run event-listener start
```

## Monitoring

The service logs all events and errors to console:

```
Starting event listener on chain 84532...
Event listener started successfully
Checkpoint loaded: block 15234567
PollCreated: pollId=1, creator=0x123...
Voted: pollId=1, voter=0x456..., option=0
RewardDistributed: pollId=1, recipient=0x456..., amount=1000000000000000000
```

## Integration with Frontend

The frontend can rely on the database being up-to-date because:

1. Real-time events are processed within seconds
2. Historical sync ensures no gaps in data
3. Checkpoint system prevents duplicate processing
4. Database provides indexed queries for fast reads

Example query from frontend API:

```typescript
// Get user's voting history
const votes = await db
  .select()
  .from(leaderboard)
  .where(eq(leaderboard.address, userAddress));

// Get poll distribution logs
const distributions = await db
  .select()
  .from(distributionLogs)
  .where(eq(distributionLogs.pollId, pollId));
```

## Troubleshooting

### Events Not Processing

1. Check database connection: `npm run db:studio`
2. Verify RPC endpoint is responding
3. Check checkpoint hasn't stalled:
   ```sql
   SELECT * FROM "Checkpoint";
   ```

### Missing Historical Events

Run historical sync for the missing block range:
```bash
npm run event-listener sync <start_block> <end_block>
```

### Duplicate Events

The checkpoint system should prevent this. If it occurs:
1. Stop the event listener
2. Delete duplicate records from database
3. Reset checkpoint to before duplicates
4. Restart event listener

## Performance

- Processes ~100 events/second during historical sync
- Real-time processing has <1 second latency
- Database inserts are batched for efficiency
- Checkpoint updates are throttled to avoid excessive writes

## Future Enhancements

1. **Event Queue**: Use Bull/Redis for robust event processing
2. **Metrics Dashboard**: Track sync status and performance
3. **Alert System**: Notify on processing failures
4. **Multi-chain Support**: Extend to other networks
5. **Event Replay**: Ability to reprocess events with updated logic
