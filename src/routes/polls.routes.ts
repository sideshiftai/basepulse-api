/**
 * Polls API routes
 */

import { Router, Request, Response } from 'express';
import { pollsService } from '../services/polls.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const distributionModeSchema = z.object({
  mode: z.enum(['MANUAL_PULL', 'MANUAL_PUSH', 'AUTOMATED']),
});

/**
 * GET /api/polls
 * Get all polls with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const chainId = req.query.chainId ? parseInt(req.query.chainId as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const polls = await pollsService.getAll({
      chainId,
      limit,
      offset,
    });

    res.json({
      polls,
      meta: {
        limit,
        offset,
        count: polls.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get polls', { error });
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

/**
 * GET /api/polls/:id
 * Get poll details by database ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const poll = await pollsService.getById(id);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    res.json({ poll });
  } catch (error) {
    logger.error('Failed to get poll', { error });
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

/**
 * GET /api/polls/:id/full
 * Get poll with distribution logs
 */
router.get('/:id/full', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const poll = await pollsService.getWithDistributions(id);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    res.json({ poll });
  } catch (error) {
    logger.error('Failed to get poll with distributions', { error });
    res.status(500).json({ error: 'Failed to fetch poll details' });
  }
});

/**
 * GET /api/polls/chain/:chainId/:pollId
 * Get poll by chain ID and poll ID
 */
router.get('/chain/:chainId/:pollId', async (req: Request, res: Response) => {
  try {
    const chainId = parseInt(req.params.chainId);
    const pollId = BigInt(req.params.pollId);

    const poll = await pollsService.getByChainAndPollId(chainId, pollId);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    res.json({ poll });
  } catch (error) {
    logger.error('Failed to get poll by chain and poll ID', { error });
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

/**
 * PUT /api/polls/:id/distribution-mode
 * Update poll distribution mode
 */
router.put('/:id/distribution-mode', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = distributionModeSchema.parse(req.body);

    // Check if poll exists
    const poll = await pollsService.getById(id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Update distribution mode
    const updated = await pollsService.updateDistributionMode(id, data.mode);

    logger.info('Distribution mode updated', {
      pollId: id,
      mode: data.mode,
    });

    res.json({ poll: updated });
  } catch (error) {
    logger.error('Failed to update distribution mode', { error });
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.issues });
    }
    res.status(500).json({ error: 'Failed to update distribution mode' });
  }
});

/**
 * GET /api/polls/:id/distributions
 * Get distribution history for a poll
 */
router.get('/:id/distributions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if poll exists
    const poll = await pollsService.getById(id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const distributions = await pollsService.getDistributions(id);

    res.json({
      pollId: id,
      distributions,
      count: distributions.length,
    });
  } catch (error) {
    logger.error('Failed to get distributions', { error });
    res.status(500).json({ error: 'Failed to fetch distributions' });
  }
});

/**
 * GET /api/polls/:id/stats
 * Get poll statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if poll exists
    const poll = await pollsService.getById(id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const stats = await pollsService.getStats(id);

    res.json({
      pollId: id,
      stats,
    });
  } catch (error) {
    logger.error('Failed to get poll stats', { error });
    res.status(500).json({ error: 'Failed to fetch poll statistics' });
  }
});

export default router;
