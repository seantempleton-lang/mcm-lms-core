import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

export const usersRouter = Router();

// User lookup for adding attendees to sessions.
// Supports optional querystring: ?q=searchText
usersRouter.get('/', requireAuth, requireRole('SUPERVISOR','ADMIN'), asyncHandler(async (req,res)=>{
  const q = (req.query.q || '').toString().trim();

  const where = q ? {
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } }
    ]
  } : undefined;

  const users = await prisma.user.findMany({
    where,
    select: { id:true, name:true, email:true, role:true },
    orderBy: [{ name: 'asc' }],
    take: 50
  });

  res.json(users);
}));
