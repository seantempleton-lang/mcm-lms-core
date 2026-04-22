import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

export const matrixRouter = Router();

matrixRouter.use(requireAuth, requireRole('SUPERVISOR', 'ADMIN'));

// ── Full matrix (all users × all competencies) ──────────────────────────────
// GET /matrix
// Returns every competency and every non-ADMIN user, with their latest award
// for each competency (or null if not yet awarded).
matrixRouter.get('/', asyncHandler(async (req, res) => {
  const [competencies, users, awards] = await Promise.all([
    prisma.competency.findMany({
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    }),

    prisma.user.findMany({
      where:   { role: { not: 'ADMIN' } },
      select:  { id: true, name: true, username: true, email: true, role: true },
      orderBy: [{ name: 'asc' }],
    }),

    prisma.competencyAward.findMany({
      orderBy: { awardedAt: 'desc' },
      select: {
        userId:       true,
        competencyId: true,
        awardedAt:    true,
        evidenceType: true,
        notes:        true,
        awardedBy:    { select: { id: true, name: true } },
        session:      { select: { id: true, date: true, location: true } },
      },
    }),
  ]);

  // Build a lookup: awardsByUser[userId][competencyId] = most recent award
  // (awards are already ordered desc so first match wins)
  const awardsByUser = {};
  for (const award of awards) {
    if (!awardsByUser[award.userId]) {
      awardsByUser[award.userId] = {};
    }
    if (!awardsByUser[award.userId][award.competencyId]) {
      awardsByUser[award.userId][award.competencyId] = {
        awardedAt:    award.awardedAt,
        evidenceType: award.evidenceType,
        notes:        award.notes,
        awardedBy:    award.awardedBy,
        session:      award.session,
      };
    }
  }

  // Shape the response
  const rows = users.map(user => ({
    id:    user.id,
    name:  user.name,
    username: user.username,
    email: user.email,
    role:  user.role,
    awards: Object.fromEntries(
      competencies.map(c => [
        c.code,
        awardsByUser[user.id]?.[c.id] ?? null,
      ])
    ),
  }));

  res.json({ competencies, users: rows });
}));

// ── Single user's competency record ─────────────────────────────────────────
// GET /matrix/user/:id
// Useful for the learner dashboard and per-person views.
matrixRouter.get('/user/:id', asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Learners can only see their own record
  if (req.user.role === 'LEARNER' && req.user.sub !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const [user, competencies, awards] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, name: true, username: true, email: true, role: true },
    }),

    prisma.competency.findMany({
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    }),

    prisma.competencyAward.findMany({
      where:   { userId },
      orderBy: { awardedAt: 'desc' },
      select: {
        competencyId: true,
        awardedAt:    true,
        evidenceType: true,
        notes:        true,
        awardedBy:    { select: { id: true, name: true } },
        session:      { select: { id: true, date: true, location: true } },
      },
    }),
  ]);

  if (!user) return res.status(404).json({ error: 'User not found' });

  // Latest award per competency
  const awardMap = {};
  for (const award of awards) {
    if (!awardMap[award.competencyId]) {
      awardMap[award.competencyId] = award;
    }
  }

  const record = competencies.map(c => ({
    competency: {
      id:           c.id,
      code:         c.code,
      title:        c.title,
      category:     c.category,
      description:  c.description,
      expiryMonths: c.expiryMonths,
    },
    award:   awardMap[c.id] ?? null,
    expired: (() => {
      const a = awardMap[c.id];
      if (!a || !c.expiryMonths) return false;
      const expiry = new Date(a.awardedAt);
      expiry.setMonth(expiry.getMonth() + c.expiryMonths);
      return expiry < new Date();
    })(),
  }));

  res.json({ user, record });
}));

// ── Single competency — all users who hold it ────────────────────────────────
// GET /matrix/competency/:code
// e.g. GET /matrix/competency/DT-FUND-01
matrixRouter.get('/competency/:code', asyncHandler(async (req, res) => {
  const competency = await prisma.competency.findUnique({
    where: { code: req.params.code },
  });
  if (!competency) return res.status(404).json({ error: 'Competency not found' });

  const awards = await prisma.competencyAward.findMany({
    where:   { competencyId: competency.id },
    orderBy: { awardedAt: 'desc' },
    select: {
      awardedAt:    true,
      evidenceType: true,
      notes:        true,
      user:     { select: { id: true, name: true, username: true, email: true, role: true } },
      awardedBy:{ select: { id: true, name: true } },
      session:  { select: { id: true, date: true, location: true } },
    },
  });

  // One entry per user (latest award only)
  const seen = new Set();
  const holders = [];
  for (const a of awards) {
    if (!seen.has(a.user.id)) {
      seen.add(a.user.id);
      holders.push({
        user:         a.user,
        awardedAt:    a.awardedAt,
        evidenceType: a.evidenceType,
        notes:        a.notes,
        awardedBy:    a.awardedBy,
        session:      a.session,
        expired: (() => {
          if (!competency.expiryMonths) return false;
          const expiry = new Date(a.awardedAt);
          expiry.setMonth(expiry.getMonth() + competency.expiryMonths);
          return expiry < new Date();
        })(),
      });
    }
  }

  res.json({ competency, holders });
}));
