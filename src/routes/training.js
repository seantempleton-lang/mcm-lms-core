import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  trainingAssignmentCreateSchema,
  trainingAssignmentStartSchema,
  trainingAssignmentSubmitSchema,
  trainingAssignmentReviewSchema
} from '../validators.js';
import { asyncHandler, HttpError, mapPrismaError } from '../utils/http.js';

export const trainingRouter = Router();

trainingRouter.get('/my', requireAuth, asyncHandler(async (req, res) => {
  const items = await prisma.trainingAssignment.findMany({
    where: { learnerId: req.user.sub },
    include: {
      module: { include: { competencies: { include: { competency: true } } } },
      assignedBy: { select: { id: true, name: true, email: true } }
    },
    orderBy: [{ assignedAt: 'desc' }]
  });
  res.json(items);
}));

trainingRouter.get('/', requireAuth, requireRole('SUPERVISOR', 'ADMIN'), asyncHandler(async (req, res) => {
  const status = (req.query.status || '').toString().trim();
  const items = await prisma.trainingAssignment.findMany({
    where: status ? { status } : undefined,
    include: {
      learner: { select: { id: true, name: true, email: true, role: true } },
      module: { include: { competencies: { include: { competency: true } } } },
      assignedBy: { select: { id: true, name: true, email: true } }
    },
    orderBy: [{ status: 'asc' }, { assignedAt: 'desc' }]
  });
  res.json(items);
}));

trainingRouter.post('/', requireAuth, requireRole('SUPERVISOR', 'ADMIN'), asyncHandler(async (req, res) => {
  const parsed = trainingAssignmentCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { learnerId, moduleId } = parsed.data;

  const learner = await prisma.user.findUnique({
    where: { id: learnerId },
    select: { id: true, role: true }
  });
  if (!learner || learner.role !== 'LEARNER') {
    throw new HttpError(400, 'Training can only be assigned to learners');
  }

  try {
    const item = await prisma.trainingAssignment.upsert({
      where: { learnerId_moduleId: { learnerId, moduleId } },
      update: {
        assignedById: req.user.sub,
        status: 'ASSIGNED',
        learnerNotes: null,
        reviewNotes: null,
        assignedAt: new Date(),
        startedAt: null,
        submittedAt: null,
        reviewedAt: null,
      },
      create: {
        learnerId,
        moduleId,
        assignedById: req.user.sub,
      },
      include: {
        learner: { select: { id: true, name: true, email: true, role: true } },
        module: { include: { competencies: { include: { competency: true } } } },
        assignedBy: { select: { id: true, name: true, email: true } }
      }
    });
    res.status(201).json(item);
  } catch (error) {
    throw mapPrismaError(error, 'Failed to assign training');
  }
}));

trainingRouter.post('/:id/start', requireAuth, requireRole('LEARNER'), asyncHandler(async (req, res) => {
  const parsed = trainingAssignmentStartSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const assignment = await prisma.trainingAssignment.findUnique({
    where: { id: req.params.id }
  });
  if (!assignment || assignment.learnerId !== req.user.sub) {
    throw new HttpError(404, 'Training assignment not found');
  }
  if (assignment.status === 'COMPLETED') {
    throw new HttpError(400, 'Training assignment has already been completed');
  }

  const item = await prisma.trainingAssignment.update({
    where: { id: req.params.id },
    data: {
      status: assignment.status === 'PENDING_REVIEW' ? assignment.status : 'IN_PROGRESS',
      startedAt: assignment.startedAt || new Date(),
      learnerNotes: parsed.data.learnerNotes ?? assignment.learnerNotes
    },
    include: {
      module: { include: { competencies: { include: { competency: true } } } },
      assignedBy: { select: { id: true, name: true, email: true } }
    }
  });
  res.json(item);
}));

trainingRouter.post('/:id/submit', requireAuth, requireRole('LEARNER'), asyncHandler(async (req, res) => {
  const parsed = trainingAssignmentSubmitSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const assignment = await prisma.trainingAssignment.findUnique({
    where: { id: req.params.id }
  });
  if (!assignment || assignment.learnerId !== req.user.sub) {
    throw new HttpError(404, 'Training assignment not found');
  }
  if (assignment.status === 'COMPLETED') {
    throw new HttpError(400, 'Training assignment has already been completed');
  }

  const item = await prisma.trainingAssignment.update({
    where: { id: req.params.id },
    data: {
      status: 'PENDING_REVIEW',
      startedAt: assignment.startedAt || new Date(),
      submittedAt: new Date(),
      learnerNotes: parsed.data.learnerNotes ?? assignment.learnerNotes
    },
    include: {
      module: { include: { competencies: { include: { competency: true } } } },
      assignedBy: { select: { id: true, name: true, email: true } }
    }
  });
  res.json(item);
}));

trainingRouter.post('/:id/review', requireAuth, requireRole('SUPERVISOR', 'ADMIN'), asyncHandler(async (req, res) => {
  const parsed = trainingAssignmentReviewSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const assignment = await prisma.trainingAssignment.findUnique({
    where: { id: req.params.id },
    include: {
      module: { include: { competencies: true } },
      learner: { select: { id: true, role: true } }
    }
  });
  if (!assignment) throw new HttpError(404, 'Training assignment not found');
  if (assignment.status !== 'PENDING_REVIEW') {
    throw new HttpError(400, 'Training assignment is not waiting for review');
  }

  const competencyIds = assignment.module.competencies.map((item) => item.competencyId);
  const existingAwards = competencyIds.length
    ? await prisma.competencyAward.findMany({
        where: {
          userId: assignment.learnerId,
          competencyId: { in: competencyIds },
          evidenceType: 'COMPLETION'
        },
        select: { competencyId: true }
      })
    : [];

  const awardedCompetencyIds = new Set(existingAwards.map((item) => item.competencyId));
  const newAwards = assignment.module.competencies
    .filter((item) => !awardedCompetencyIds.has(item.competencyId))
    .map((item) => ({
      userId: assignment.learnerId,
      competencyId: item.competencyId,
      awardedById: req.user.sub,
      evidenceType: item.evidenceType === 'COMPLETION' ? 'COMPLETION' : item.evidenceType,
      notes: parsed.data.reviewNotes || assignment.learnerNotes || undefined
    }));

  try {
    await prisma.$transaction(async (tx) => {
      if (newAwards.length) {
        await tx.competencyAward.createMany({ data: newAwards });
      }
      await tx.trainingAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'COMPLETED',
          reviewNotes: parsed.data.reviewNotes,
          reviewedAt: new Date()
        }
      });
    });
  } catch (error) {
    throw mapPrismaError(error, 'Failed to review required training');
  }

  const item = await prisma.trainingAssignment.findUnique({
    where: { id: assignment.id },
    include: {
      learner: { select: { id: true, name: true, email: true, role: true } },
      module: { include: { competencies: { include: { competency: true } } } },
      assignedBy: { select: { id: true, name: true, email: true } }
    }
  });
  res.json(item);
}));
