import { Router } from 'express';
import { prisma } from '../prisma.js';
import { competencyCreateSchema, competencyPatchSchema, awardSchema } from '../validators.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const competenciesRouter = Router();

competenciesRouter.get('/', requireAuth, async (req, res) => {
  const items = await prisma.competency.findMany({ orderBy: [{ category: 'asc' }, { code: 'asc' }] });
  res.json(items);
});

competenciesRouter.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = competencyCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const item = await prisma.competency.create({ data: parsed.data });
  res.status(201).json(item);
});

competenciesRouter.patch('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = competencyPatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const item = await prisma.competency.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(item);
});

// Award a competency to a user (SUPERVISOR/ADMIN)
competenciesRouter.post('/:id/award', requireAuth, requireRole('SUPERVISOR','ADMIN'), async (req, res) => {
  const competencyId = req.params.id;
  const parsed = awardSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { userId, evidenceType, sessionId, notes } = parsed.data;

  const award = await prisma.competencyAward.create({
    data: {
      userId,
      competencyId,
      awardedById: req.user.sub,
      evidenceType,
      sessionId,
      notes,
    }
  });

  res.status(201).json(award);
});
