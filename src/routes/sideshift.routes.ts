/**
 * Sideshift API routes
 */

import { Router, Request, Response } from 'express';
import { sideshiftService } from '../services/sideshift.service';
import { blockchainService } from '../services/blockchain.service';
import { shiftsService } from '../services/shifts.service';
import { preferencesService } from '../services/preferences.service';
import { createShiftSchema, webhookPayloadSchema } from '../utils/validators';
import { webhookAuth } from '../middleware/webhook-auth';
import { logger } from '../utils/logger';
import { Address } from 'viem';
import { apiLimiter, strictLimiter, webhookLimiter } from '../middleware/rate-limit';
import { getNetworkForChain } from '../config/chains';
import { getDefaultDestinationCoin } from '../utils/currency-utils';

const router = Router();

/**
 * GET /api/sideshift/supported-assets
 * Get list of supported cryptocurrencies
 */
router.get('/supported-assets', apiLimiter, async (req: Request, res: Response) => {
  try {
    const assets = await sideshiftService.getCoins();

    res.json({
      assets: assets.map((asset) => ({
        coin: asset.coin,
        name: asset.name,
        networks: asset.networks,
      })),
      lastUpdated: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get supported assets', { error });
    res.status(500).json({ error: 'Failed to fetch supported assets' });
  }
});

/**
 * POST /api/sideshift/create-shift
 * Create a new shift order
 */
router.post('/create-shift', strictLimiter, async (req: Request, res: Response) => {
  try {
    // Validate request
    const data = createShiftSchema.parse(req.body);

    // Validate poll exists (using chainId if provided, otherwise env default)
    const pollExists = await blockchainService.validatePoll(data.pollId, data.chainId);
    if (!pollExists) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // For claim_reward, verify poll has ended and has funds
    if (data.purpose === 'claim_reward') {
      const { canClaim, reason } = await blockchainService.canClaimRewards(data.pollId);
      if (!canClaim) {
        return res.status(400).json({ error: reason });
      }
    }

    // Determine shift type (fixed if amount provided, variable otherwise)
    const shiftType = data.sourceAmount ? 'fixed' : 'variable';

    // Determine source and destination coins and networks based on purpose
    let sourceCoin = data.sourceCoin;
    let destCoin = data.destCoin;
    let sourceNetwork = data.sourceNetwork;
    let destNetwork = data.destNetwork;

    if (data.purpose === 'fund_poll') {
      // FUNDING: User deposits any token -> Convert to USDC/ETH on poll's chain

      // Get the chain where the poll is deployed (use provided chainId or env default)
      const pollChainId = blockchainService.getPollChain(data.pollId, data.chainId);
      const pollNetwork = getNetworkForChain(pollChainId);

      // Destination network is always the poll's chain
      destNetwork = pollNetwork;

      // Destination coin: USDC for stablecoins, ETH for others
      if (!destCoin) {
        destCoin = getDefaultDestinationCoin(sourceCoin);
      }

      logger.info('Fund poll shift configuration', {
        pollId: data.pollId,
        pollChain: pollChainId,
        pollNetwork,
        sourceCoin,
        destCoin,
        destNetwork,
      });
    } else if (data.purpose === 'claim_reward') {
      // CLAIMING: Poll rewards (ETH on poll chain) -> Convert to user's preferred token/network

      // Get the chain where the poll is deployed (source of rewards, use provided chainId or env default)
      const pollChainId = blockchainService.getPollChain(data.pollId, data.chainId);
      const pollNetwork = getNetworkForChain(pollChainId);

      // Source is always the poll's rewards (ETH on poll's chain)
      sourceCoin = 'ETH';
      sourceNetwork = pollNetwork;

      // Destination coin from user preferences or request
      if (!destCoin) {
        const preferences = await preferencesService.get(data.userAddress as Address);
        destCoin = preferences?.preferredToken || 'USDC';
      }

      logger.info('Claim reward shift configuration', {
        pollId: data.pollId,
        pollChain: pollChainId,
        pollNetwork,
        sourceCoin,
        destCoin,
        preferredToken: destCoin,
      });
    }

    // Get recommended networks if still not provided
    if (!sourceNetwork || !destNetwork) {
      const networks = await sideshiftService.getRecommendedNetworks(
        sourceCoin,
        destCoin
      );
      sourceNetwork = sourceNetwork || networks.defaultDepositNetwork;
      destNetwork = destNetwork || networks.defaultSettleNetwork;
    }

    // Create Sideshift order
    const sideshiftOrder = await sideshiftService.createShift(shiftType, {
      settleAddress: data.userAddress, // User receives funds
      depositCoin: sourceCoin,
      settleCoin: destCoin,
      depositNetwork: sourceNetwork,
      settleNetwork: destNetwork,
      ...(shiftType === 'fixed' && data.sourceAmount
        ? { depositAmount: data.sourceAmount }
        : {}),
      ...(data.refundAddress ? { refundAddress: data.refundAddress } : {}),
    });

    // Store shift in database
    const storedShift = await shiftsService.create({
      sideshiftOrderId: sideshiftOrder.id,
      pollId: data.pollId,
      userAddress: data.userAddress as Address,
      purpose: data.purpose,
      sourceAsset: sourceCoin,
      destAsset: destCoin,
      sourceNetwork: sourceNetwork,
      destNetwork: destNetwork,
      sourceAmount: data.sourceAmount,
      depositAddress: sideshiftOrder.depositAddress,
      settleAddress: sideshiftOrder.settleAddress,
      shiftType: sideshiftOrder.type,
      status: sideshiftOrder.status,
      expiresAt: new Date(sideshiftOrder.expiresAt),
    });

    logger.info('Shift created', {
      shiftId: storedShift.id,
      orderId: sideshiftOrder.id,
      pollId: data.pollId,
      purpose: data.purpose,
    });

    res.status(201).json({
      shift: storedShift,
      sideshift: {
        orderId: sideshiftOrder.id,
        depositAddress: sideshiftOrder.depositAddress,
        depositCoin: sideshiftOrder.depositCoin,
        depositNetwork: sideshiftOrder.depositNetwork,
        depositMin: sideshiftOrder.depositMin,
        depositMax: sideshiftOrder.depositMax,
        expiresAt: sideshiftOrder.expiresAt,
      },
    });
  } catch (error) {
    logger.error('Failed to create shift', { error });
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/sideshift/shift-status/:id
 * Get shift status
 */
router.get('/shift-status/:id', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get from our database
    const storedShift = await shiftsService.getById(id);
    if (!storedShift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Get latest status from Sideshift
    const sideshiftData = await sideshiftService.getShift(storedShift.sideshiftOrderId);

    // Update our database if status changed
    if (sideshiftData.status !== storedShift.status) {
      await shiftsService.update(id, {
        status: sideshiftData.status,
      });
    }

    res.json({
      shift: storedShift,
      sideshiftData,
    });
  } catch (error) {
    logger.error('Failed to get shift status', { error });
    res.status(500).json({ error: 'Failed to get shift status' });
  }
});

/**
 * POST /api/sideshift/webhook
 * Webhook endpoint for Sideshift callbacks
 */
router.post('/webhook', webhookLimiter, webhookAuth, async (req: Request, res: Response) => {
  try {
    const payload = webhookPayloadSchema.parse(req.body);

    logger.info('Webhook received', {
      orderId: payload.orderId,
      status: payload.status,
    });

    // Find shift in our database
    const shift = await shiftsService.getBySideshiftOrderId(payload.orderId);
    if (!shift) {
      logger.warn('Webhook for unknown shift', { orderId: payload.orderId });
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Update shift status
    await shiftsService.update(shift.id, {
      status: payload.status,
      depositTxHash: payload.depositHash as `0x${string}` | undefined,
      settleTxHash: payload.settleHash as `0x${string}` | undefined,
      ...(payload.status === 'settled' ? { completedAt: new Date() } : {}),
    });

    // Handle settled shifts
    if (payload.status === 'settled') {
      logger.info('Shift completed', {
        shiftId: shift.id,
        purpose: shift.purpose,
        pollId: shift.pollId,
      });

      // For claim_reward purpose, automatically withdraw funds from contract
      if (shift.purpose === 'claim_reward') {
        try {
          const { blockchainService } = await import('../services/blockchain.service');

          logger.info('Initiating automated reward withdrawal', {
            pollId: shift.pollId,
            recipient: shift.userAddress,
          });

          // Withdraw ETH (address(0)) - in the future, this could be extended to support multiple tokens
          const tokensToWithdraw = ['0x0000000000000000000000000000000000000000' as Address];

          const txHash = await blockchainService.withdrawFunds(
            shift.pollId,
            shift.userAddress as Address,
            tokensToWithdraw
          );

          logger.info('Automated withdrawal successful', {
            pollId: shift.pollId,
            recipient: shift.userAddress,
            txHash,
            tokens: tokensToWithdraw,
          });

          // Update shift with withdrawal transaction hash
          await shiftsService.update(shift.id, {
            contractTxHash: txHash,
          });
        } catch (error) {
          logger.error('Automated withdrawal failed', {
            error,
            pollId: shift.pollId,
            userAddress: shift.userAddress,
            suggestion: 'User will need to manually claim rewards',
          });
          // Don't fail the webhook - shift is still settled
          // User can manually claim if automated withdrawal fails
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Webhook processing failed', { error });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /api/sideshift/user/:address
 * Get all shifts for a user
 */
router.get('/user/:address', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const shifts = await shiftsService.getByUserAddress(address as Address);
    res.json({ shifts });
  } catch (error) {
    logger.error('Failed to get user shifts', { error });
    res.status(500).json({ error: 'Failed to get user shifts' });
  }
});

/**
 * GET /api/sideshift/poll/:pollId
 * Get all shifts for a poll
 */
router.get('/poll/:pollId', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { pollId } = req.params;
    const shifts = await shiftsService.getByPollId(pollId);
    res.json({ shifts });
  } catch (error) {
    logger.error('Failed to get poll shifts', { error });
    res.status(500).json({ error: 'Failed to get poll shifts' });
  }
});

/**
 * POST /api/sideshift/shift/:shiftId/link-funding
 * Link a funding transaction to a shift
 */
router.post('/shift/:shiftId/link-funding', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { shiftId } = req.params;
    const { fundingTxHash } = req.body;

    if (!fundingTxHash) {
      return res.status(400).json({ error: 'fundingTxHash is required' });
    }

    // Get shift to verify it exists
    const shift = await shiftsService.getById(shiftId);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Update shift with funding tx hash
    const updated = await shiftsService.update(shiftId, {
      fundingTxHash: fundingTxHash as `0x${string}`,
    });

    logger.info('Funding transaction linked to shift', {
      shiftId,
      fundingTxHash,
      pollId: shift.pollId,
    });

    res.json({
      success: true,
      shift: updated,
    });
  } catch (error) {
    logger.error('Failed to link funding transaction', { error });
    res.status(500).json({ error: 'Failed to link funding transaction' });
  }
});

export default router;
