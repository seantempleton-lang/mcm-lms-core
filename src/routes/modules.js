import { Router } from 'express';
import { prisma } from '../prisma.js';
import { moduleCreateSchema, modulePatchSchema, moduleCompetenciesPutSchema } from '../validators.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const modulesRouter = Router();

modulesRouter.get('/', requireAuth, async (req, res) => {
  const items = await prisma.module.findMany({
    include: { competencies: { include: { competency: true } } },
    orderBy: { title: 'asc' }
  });
  res.json(items);
});

modulesRouter.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = moduleCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const item = await prisma.module.create({ data: parsed.data });
  res.status(201).json(item);
});

modulesRouter.patch('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = modulePatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const item = await prisma.module.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(item);
});

// Replace competency mappings for a module
modulesRouter.put('/:id/competencies', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const moduleId = req.params.id;
  const parsed = moduleCompetenciesPutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const items = parsed.data.items;

  await prisma.$transaction([
    prisma.moduleCompetency.deleteMany({ where: { moduleId } }),
    prisma.moduleCompetency.createMany({
      data: items.map(i => ({ moduleId, competencyId: i.competencyId, evidenceType: i.evidenceType }))
    })
  ]);

  const updated = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { competencies: { include: { competency: true } } }
  });

  res.json(updated);
});
