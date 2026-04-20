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

function buildLearnerReport(assignments, awards) {
  const summary = {
    assigned: assignments.length,
    inProgress: assignments.filter((item) => item.status === 'IN_PROGRESS').length,
    pendingReview: assignments.filter((item) => item.status === 'PENDING_REVIEW').length,
    completed: assignments.filter((item) => item.status === 'COMPLETED').length,
    competenciesAwarded: awards.length,
  };

  return {
    summary,
    completedAssignments: assignments
      .filter((item) => item.status === 'COMPLETED')
      .map((item) => ({
        id: item.id,
        moduleTitle: item.module.title,
        reviewedAt: item.reviewedAt,
        reviewNotes: item.reviewNotes,
        competencies: item.module.competencies.map((mapping) => ({
          id: mapping.competency.id,
          code: mapping.competency.code,
          title: mapping.competency.title,
        })),
      })),
    recentAwards: awards.slice(0, 10),
  };
}

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

trainingRouter.get('/my/report', requireAuth, asyncHandler(async (req, res) => {
  const [assignments, awards] = await Promise.all([
    prisma.trainingAssignment.findMany({
      where: { learnerId: req.user.sub },
      include: {
        module: { include: { competencies: { include: { competency: true } } } },
      },
      orderBy: [{ assignedAt: 'desc' }]
    }),
    prisma.competencyAward.findMany({
      where: { userId: req.user.sub },
      include: {
        competency: { select: { id: true, code: true, title: true, category: true } },
        awardedBy: { select: { id: true, name: true } }
      },
      orderBy: [{ awardedAt: 'desc' }]
    })
  ]);

  res.json(buildLearnerReport(assignments, awards));
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

trainingRouter.get('/report/:learnerId', requireAuth, requireRole('SUPERVISOR', 'ADMIN'), asyncHandler(async (req, res) => {
  const learnerId = req.params.learnerId;
  const [learner, assignments, awards] = await Promise.all([
    prisma.user.findUnique({
      where: { id: learnerId },
      select: { id: true, name: true, email: true, role: true }
    }),
    prisma.trainingAssignment.findMany({
      where: { learnerId },
      include: {
        module: { include: { competencies: { include: { competency: true } } } },
        assignedBy: { select: { id: true, name: true } }
      },
      orderBy: [{ assignedAt: 'desc' }]
    }),
    prisma.competencyAward.findMany({
      where: { userId: learnerId },
      include: {
        competency: { select: { id: true, code: true, title: true, category: true } },
        awardedBy: { select: { id: true, name: true } }
      },
      orderBy: [{ awardedAt: 'desc' }]
    })
  ]);

  if (!learner || learner.role !== 'LEARNER') {
    throw new HttpError(404, 'Learner not found');
  }

  res.json({
    learner,
    ...buildLearnerReport(assignments, awards),
  });
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
