import { Router } from 'express';
import { prisma } from '../prisma.js';
import { competencyCreateSchema, competencyPatchSchema, awardSchema } from '../validators.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, HttpError, mapPrismaError } from '../utils/http.js';

export const competenciesRouter = Router();

competenciesRouter.get('/', requireAuth, asyncHandler(async (req, res) => {
  const items = await prisma.competency.findMany({ orderBy: [{ category: 'asc' }, { code: 'asc' }] });
  res.json(items);
}));

competenciesRouter.post('/', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const parsed = competencyCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  let item;
  try {
    item = await prisma.competency.create({ data: parsed.data });
  } catch (error) {
    throw mapPrismaError(error, 'Failed to create competency');
  }

  res.status(201).json(item);
}));

competenciesRouter.patch('/:id', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const parsed = competencyPatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  let item;
  try {
    item = await prisma.competency.update({ where: { id: req.params.id }, data: parsed.data });
  } catch (error) {
    throw mapPrismaError(error, 'Failed to update competency');
  }

  res.json(item);
}));

// Award a competency to a user (SUPERVISOR/ADMIN)
competenciesRouter.post('/:id/award', requireAuth, requireRole('SUPERVISOR','ADMIN'), asyncHandler(async (req, res) => {
  const competencyId = req.params.id;
  const parsed = awardSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { userId, evidenceType, sessionId, notes } = parsed.data;

  if (sessionId) {
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });

    if (!session) {
      throw new HttpError(404, 'Training session not found');
    }
  }

  let award;
  try {
    award = await prisma.competencyAward.create({
      data: {
        userId,
        competencyId,
        awardedById: req.user.sub,
        evidenceType,
        sessionId,
        notes,
      }
    });
  } catch (error) {
    if (error.code === 'P2003') {
      throw new HttpError(404, 'Related record not found');
    }

    throw mapPrismaError(error, 'Failed to create competency award');
  }

  res.status(201).json(award);
}));
