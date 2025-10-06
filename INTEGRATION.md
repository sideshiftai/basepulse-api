# Frontend Integration Guide

Step-by-step guide to integrate BasePulse API with your frontend (basepulse-app).

## Step 1: Environment Variables

Add to `basepulse-app/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Step 2: Create API Client

Create `basepulse-app/lib/api/sideshift-client.ts`:

```typescript
import axios from 'axios';
import { Address } from 'viem';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CreateShiftParams {
  pollId: string;
  userAddress: Address;
  purpose: 'fund_poll' | 'claim_reward';
  sourceCoin: string;
  destCoin: string;
  sourceNetwork?: string;
  destNetwork?: string;
  sourceAmount?: string;
  refundAddress?: Address;
}

export const sideshiftAPI = {
  async getSupportedAssets() {
    const { data } = await axios.get(`${API_URL}/api/sideshift/supported-assets`);
    return data;
  },

  async createShift(params: CreateShiftParams) {
    const { data } = await axios.post(`${API_URL}/api/sideshift/create-shift`, params);
    return data;
  },

  async getShiftStatus(shiftId: string) {
    const { data } = await axios.get(`${API_URL}/api/sideshift/shift-status/${shiftId}`);
    return data;
  },

  async getUserShifts(address: Address) {
    const { data } = await axios.get(`${API_URL}/api/sideshift/user/${address}`);
    return data;
  },

  async getPollShifts(pollId: string) {
    const { data } = await axios.get(`${API_URL}/api/sideshift/poll/${pollId}`);
    return data;
  },
};
```

## Step 3: Create React Hook

Create `basepulse-app/hooks/use-sideshift.ts`:

```typescript
import { useState, useEffect } from 'react';
import { sideshiftAPI, CreateShiftParams } from '@/lib/api/sideshift-client';
import { useToast } from '@/hooks/use-toast';

export function useSideshift() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createShift = async (params: CreateShiftParams) => {
    setLoading(true);
    try {
      const result = await sideshiftAPI.createShift(params);
      toast({
        title: 'Shift Created',
        description: `Send ${result.sideshift.depositCoin} to the deposit address`,
      });
      return result;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { createShift, loading };
}

export function useSupportedAssets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sideshiftAPI.getSupportedAssets()
      .then((data) => setAssets(data.assets))
      .finally(() => setLoading(false));
  }, []);

  return { assets, loading };
}
```

## Step 4: Create UI Components

### Currency Selector Component

Create `basepulse-app/components/sideshift/currency-selector.tsx`:

```typescript
'use client';

import { useSupportedAssets } from '@/hooks/use-sideshift';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function CurrencySelector({ value, onChange, label }: CurrencySelectorProps) {
  const { assets, loading } = useSupportedAssets();

  if (loading) return <div>Loading currencies...</div>;

  return (
    <div>
      {label && <label className="text-sm font-medium">{label}</label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {assets.map((asset) => (
            <SelectItem key={asset.coin} value={asset.coin}>
              {asset.name} ({asset.coin})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

### Fund Poll Component

Create `basepulse-app/components/sideshift/fund-poll-dialog.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSideshift } from '@/hooks/use-sideshift';
import { CurrencySelector } from './currency-selector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FundPollDialogProps {
  pollId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FundPollDialog({ pollId, open, onOpenChange }: FundPollDialogProps) {
  const { address } = useAccount();
  const { createShift, loading } = useSideshift();
  const [currency, setCurrency] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [depositAddress, setDepositAddress] = useState('');

  const handleFund = async () => {
    if (!address) return;

    const result = await createShift({
      pollId,
      userAddress: address,
      purpose: 'fund_poll',
      sourceCoin: currency,
      destCoin: 'ETH', // Or whatever token your poll contract uses
      sourceAmount: amount,
    });

    setDepositAddress(result.sideshift.depositAddress);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fund Poll with Crypto</DialogTitle>
        </DialogHeader>

        {!depositAddress ? (
          <div className="space-y-4">
            <CurrencySelector
              label="Select Currency"
              value={currency}
              onChange={setCurrency}
            />

            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.001"
              />
            </div>

            <Button onClick={handleFund} disabled={loading || !amount}>
              {loading ? 'Creating...' : 'Get Deposit Address'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send {amount} {currency} to:
            </p>
            <code className="block p-4 bg-muted rounded-lg break-all">
              {depositAddress}
            </code>
            <p className="text-xs text-muted-foreground">
              Once confirmed, funds will be converted to ETH and sent to the poll.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### Claim Rewards Component

Create `basepulse-app/components/sideshift/claim-rewards-dialog.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSideshift } from '@/hooks/use-sideshift';
import { CurrencySelector } from './currency-selector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ClaimRewardsDialogProps {
  pollId: string;
  rewardAmount: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClaimRewardsDialog({
  pollId,
  rewardAmount,
  open,
  onOpenChange,
}: ClaimRewardsDialogProps) {
  const { address } = useAccount();
  const { createShift, loading } = useSideshift();
  const [currency, setCurrency] = useState('USDT');
  const [status, setStatus] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!address) return;

    const result = await createShift({
      pollId,
      userAddress: address,
      purpose: 'claim_reward',
      sourceCoin: 'ETH',
      destCoin: currency,
    });

    setStatus('processing');
    // Poll for status or setup webhook listener
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim Rewards</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Claim your reward of {rewardAmount} ETH in any cryptocurrency
          </p>

          <CurrencySelector
            label="Receive in"
            value={currency}
            onChange={setCurrency}
          />

          <Button onClick={handleClaim} disabled={loading} className="w-full">
            {loading ? 'Processing...' : `Claim in ${currency}`}
          </Button>

          {status && (
            <p className="text-sm text-center text-muted-foreground">
              Status: {status}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Step 5: Integrate Into Existing Pages

### Update Poll Card

Modify `basepulse-app/components/poll-card.tsx`:

```typescript
import { FundPollDialog } from './sideshift/fund-poll-dialog';
import { useState } from 'react';

// Inside component:
const [fundDialogOpen, setFundDialogOpen] = useState(false);

// Add button:
<Button onClick={() => setFundDialogOpen(true)}>
  Fund with Crypto
</Button>

<FundPollDialog
  pollId={poll.id}
  open={fundDialogOpen}
  onOpenChange={setFundDialogOpen}
/>
```

### Update Poll Detail Page

Add claim rewards functionality to poll detail pages.

## Step 6: Install Missing Dependencies

```bash
cd basepulse-app
npm install axios
```

## Step 7: Update CORS in API

If deploying to different domain, update `basepulse-api/.env`:

```bash
FRONTEND_URL=https://your-frontend-domain.com
```

## Testing

1. Start backend: `cd basepulse-api && npm run dev`
2. Start frontend: `cd basepulse-app && npm run dev`
3. Test funding flow
4. Test claiming flow

## Production Checklist

- [ ] Update API URL in frontend env
- [ ] Deploy backend API
- [ ] Update CORS settings
- [ ] Set up database
- [ ] Configure webhooks
- [ ] Test end-to-end flow
- [ ] Monitor for errors
