/**
 * Creator Quests API routes
 * Handles CRUD for creator-defined quests
 */

import { Router, Request, Response } from 'express';
import { creatorQuestsService } from '../services/creator-quests.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/creator-quests
 * Get all available quests (optionally with participant progress)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { participant } = req.query;
    const quests = await creatorQuestsService.getAvailableQuests(participant as string | undefined);
    res.json({ quests });
  } catch (error) {
    logger.error('Failed to get available quests', { error });
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

/**
 * GET /api/creator-quests/creator/:address
 * Get all quests by a creator
 */
router.get('/creator/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const quests = await creatorQuestsService.getQuestsByCreator(address);
    res.json({ quests });
  } catch (error) {
    logger.error('Failed to get creator quests', { error });
    res.status(500).json({ error: 'Failed to fetch creator quests' });
  }
});

/**
 * GET /api/creator-quests/participant/:address
 * Get participant's quests with progress
 */
router.get('/participant/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const quests = await creatorQuestsService.getParticipantQuests(address);
    res.json({ quests });
  } catch (error) {
    logger.error('Failed to get participant quests', { error });
    res.status(500).json({ error: 'Failed to fetch participant quests' });
  }
});

/**
 * GET /api/creator-quests/:id
 * Get quest by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quest = await creatorQuestsService.getQuestById(id);

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    res.json({ quest });
  } catch (error) {
    logger.error('Failed to get quest', { error });
    res.status(500).json({ error: 'Failed to fetch quest' });
  }
});

/**
 * GET /api/creator-quests/:id/participants
 * Get quest participants
 */
router.get('/:id/participants', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { completed } = req.query;

    const participants = await creatorQuestsService.getQuestParticipants(id, {
      completed: completed === 'true' ? true : completed === 'false' ? false : undefined,
    });

    res.json({ participants });
  } catch (error) {
    logger.error('Failed to get quest participants', { error });
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

/**
 * POST /api/creator-quests
 * Create a new quest
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      creatorAddress,
      name,
      description,
      questType,
      requirements,
      pointsReward,
      maxCompletions,
      pollScope,
      specificPollIds,
      seasonId,
      startTime,
      endTime,
    } = req.body;

    if (!creatorAddress || !name || !description || !questType || !requirements || !pointsReward) {
      return res.status(400).json({
        error: 'Missing required fields: creatorAddress, name, description, questType, requirements, pointsReward',
      });
    }

    const quest = await creatorQuestsService.createQuest({
      creatorAddress,
      name,
      description,
      questType,
      requirements,
      pointsReward,
      maxCompletions,
      pollScope,
      specificPollIds,
      seasonId,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    });

    res.status(201).json({ quest });
  } catch (error) {
    logger.error('Failed to create quest', { error });
    res.status(500).json({ error: 'Failed to create quest' });
  }
});

/**
 * PUT /api/creator-quests/:id
 * Update a quest
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { creatorAddress, ...updates } = req.body;

    if (!creatorAddress) {
      return res.status(400).json({ error: 'creatorAddress is required for authorization' });
    }

    // Convert date strings if present
    if (updates.startTime) {
      updates.startTime = new Date(updates.startTime);
    }
    if (updates.endTime) {
      updates.endTime = new Date(updates.endTime);
    }

    const quest = await creatorQuestsService.updateQuest(id, creatorAddress, updates);

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found or not authorized' });
    }

    res.json({ quest });
  } catch (error) {
    logger.error('Failed to update quest', { error });
    res.status(500).json({ error: 'Failed to update quest' });
  }
});

/**
 * DELETE /api/creator-quests/:id
 * Delete a quest (only if no completions)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { creatorAddress } = req.body;

    if (!creatorAddress) {
      return res.status(400).json({ error: 'creatorAddress is required for authorization' });
    }

    await creatorQuestsService.deleteQuest(id, creatorAddress);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to delete quest', { error });
    res.status(400).json({ error: error.message || 'Failed to delete quest' });
  }
});

/**
 * POST /api/creator-quests/:id/progress
 * Update participant progress on a quest
 */
router.post('/:id/progress', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { participantAddress, progress, increment } = req.body;

    if (!participantAddress) {
      return res.status(400).json({ error: 'participantAddress is required' });
    }

    let result;
    if (increment) {
      result = await creatorQuestsService.incrementProgress(id, participantAddress);
    } else if (progress !== undefined) {
      result = await creatorQuestsService.updateProgress(id, participantAddress, progress);
    } else {
      return res.status(400).json({ error: 'Either progress or increment=true is required' });
    }

    res.json(result);
  } catch (error: any) {
    logger.error('Failed to update quest progress', { error });
    res.status(400).json({ error: error.message || 'Failed to update progress' });
  }
});

/**
 * POST /api/creator-quests/:id/deactivate
 * Deactivate a quest
 */
router.post('/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { creatorAddress } = req.body;

    if (!creatorAddress) {
      return res.status(400).json({ error: 'creatorAddress is required for authorization' });
    }

    const quest = await creatorQuestsService.deactivateQuest(id, creatorAddress);

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found or not authorized' });
    }

    res.json({ quest });
  } catch (error) {
    logger.error('Failed to deactivate quest', { error });
    res.status(500).json({ error: 'Failed to deactivate quest' });
  }
});

export default router;
