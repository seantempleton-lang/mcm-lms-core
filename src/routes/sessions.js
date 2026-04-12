import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sessionCreateSchema, attendancePostSchema, assessmentsPostSchema } from '../validators.js';

export const sessionsRouter = Router();

sessionsRouter.get('/', requireAuth, async (req, res) => {
  const items = await prisma.trainingSession.findMany({
    include: {
      module: true,
      facilitator: { select: { id: true, name: true, email: true, role: true } },
      attendance: true,
      assessments: true,
    },
    orderBy: { date: 'desc' }
  });
  res.json(items);
});

sessionsRouter.post('/', requireAuth, requireRole('SUPERVISOR','ADMIN'), async (req, res) => {
  const parsed = sessionCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { moduleId, date, location, project } = parsed.data;

  const session = await prisma.trainingSession.create({
    data: {
      moduleId,
      facilitatorId: req.user.sub,
      date: new Date(date),
      location,
      project,
    }
  });

  res.status(201).json(session);
});

sessionsRouter.get('/:id', requireAuth, async (req, res) => {
  const session = await prisma.trainingSession.findUnique({
    where: { id: req.params.id },
    include: {
      module: true,
      facilitator: { select: { id: true, name: true, email: true, role: true } },
      attendance: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      assessments: { include: { user: { select: { id: true, name: true } }, competency: true } }
    }
  });
  if (!session) return res.status(404).json({ error: 'Not found' });
  res.json(session);
});

sessionsRouter.post('/:id/attendance', requireAuth, requireRole('SUPERVISOR','ADMIN'), async (req, res) => {
  const sessionId = req.params.id;
  const parsed = attendancePostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const ops = parsed.data.attendees.map(a =>
    prisma.sessionAttendance.upsert({
      where: { sessionId_userId: { sessionId, userId: a.userId } },
      update: { attended: a.attended ?? true },
      create: { sessionId, userId: a.userId, attended: a.attended ?? true }
    })
  );

  const results = await prisma.$transaction(ops);
  res.json({ updated: results.length });
});

sessionsRouter.post('/:id/assessments', requireAuth, requireRole('SUPERVISOR','ADMIN'), async (req, res) => {
  const sessionId = req.params.id;
  const parsed = assessmentsPostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const ops = parsed.data.assessments.map(a =>
    prisma.sessionAssessment.upsert({
      where: { sessionId_userId_competencyId: { sessionId, userId: a.userId, competencyId: a.competencyId } },
      update: { outcome: a.outcome, notes: a.notes },
      create: { sessionId, userId: a.userId, competencyId: a.competencyId, outcome: a.outcome, notes: a.notes }
    })
  );

  const results = await prisma.$transaction(ops);
  res.json({ updated: results.length });
});
