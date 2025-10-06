/**
 * Sideshift API routes
 */

import { Router, Request, Response } from 'express';
import { sideshiftService } from '../services/sideshift.service';
import { blockchainService } from '../services/blockchain.service';
import { storage } from '../db/memory-storage';
import { createShiftSchema, webhookPayloadSchema } from '../utils/validators';
import { webhookAuth } from '../middleware/webhook-auth';
import { logger } from '../utils/logger';
import { Address } from 'viem';

const router = Router();

/**
 * GET /api/sideshift/supported-assets
 * Get list of supported cryptocurrencies
 */
router.get('/supported-assets', async (req: Request, res: Response) => {
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
router.post('/create-shift', async (req: Request, res: Response) => {
  try {
    // Validate request
    const data = createShiftSchema.parse(req.body);

    // Validate poll exists
    const pollExists = await blockchainService.validatePoll(data.pollId);
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

    // Get recommended networks if not provided
    let sourceNetwork = data.sourceNetwork;
    let destNetwork = data.destNetwork;

    if (!sourceNetwork || !destNetwork) {
      const networks = await sideshiftService.getRecommendedNetworks(
        data.sourceCoin,
        data.destCoin
      );
      sourceNetwork = sourceNetwork || networks.defaultDepositNetwork;
      destNetwork = destNetwork || networks.defaultSettleNetwork;
    }

    // Create Sideshift order
    const sideshiftOrder = await sideshiftService.createShift(shiftType, {
      settleAddress: data.userAddress, // User receives funds
      depositCoin: data.sourceCoin,
      settleCoin: data.destCoin,
      depositNetwork: sourceNetwork,
      settleNetwork: destNetwork,
      ...(shiftType === 'fixed' && data.sourceAmount
        ? { depositAmount: data.sourceAmount }
        : {}),
      ...(data.refundAddress ? { refundAddress: data.refundAddress } : {}),
    });

    // Store shift in database
    const storedShift = await storage.create({
      sideshiftOrderId: sideshiftOrder.id,
      pollId: data.pollId,
      userAddress: data.userAddress as Address,
      purpose: data.purpose,
      sourceAsset: data.sourceCoin,
      destAsset: data.destCoin,
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
router.get('/shift-status/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get from our database
    const storedShift = await storage.getById(id);
    if (!storedShift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Get latest status from Sideshift
    const sideshiftData = await sideshiftService.getShift(storedShift.sideshiftOrderId);

    // Update our database if status changed
    if (sideshiftData.status !== storedShift.status) {
      await storage.update(id, {
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
router.post('/webhook', webhookAuth, async (req: Request, res: Response) => {
  try {
    const payload = webhookPayloadSchema.parse(req.body);

    logger.info('Webhook received', {
      orderId: payload.orderId,
      status: payload.status,
    });

    // Find shift in our database
    const shift = await storage.getBySideshiftOrderId(payload.orderId);
    if (!shift) {
      logger.warn('Webhook for unknown shift', { orderId: payload.orderId });
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Update shift status
    await storage.update(shift.id, {
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

      // TODO: For claim_reward purpose, call contract.withdrawFunds() here
      // This would require a backend wallet with gas funds
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
router.get('/user/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const shifts = await storage.getByUserAddress(address as Address);
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
router.get('/poll/:pollId', async (req: Request, res: Response) => {
  try {
    const { pollId } = req.params;
    const shifts = await storage.getByPollId(pollId);
    res.json({ shifts });
  } catch (error) {
    logger.error('Failed to get poll shifts', { error });
    res.status(500).json({ error: 'Failed to get poll shifts' });
  }
});

export default router;
