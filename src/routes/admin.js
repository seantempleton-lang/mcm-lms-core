import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, HttpError, mapPrismaError } from '../utils/http.js';
import { userCreateSchema, userPatchSchema } from '../validators.js';
import { hashPassword } from '../utils/password.js';

export const adminRouter = Router();

// All admin routes require ADMIN role
adminRouter.use(requireAuth, requireRole('ADMIN'));

// ── List / search users ─────────────────────────────────────────────────────
// GET /admin/users?q=
adminRouter.get('/users', asyncHandler(async (req, res) => {
  const q = (req.query.q || '').toString().trim();

  const where = q ? {
    OR: [
      { name:  { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ],
  } : undefined;

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: [{ name: 'asc' }],
  });

  res.json(users);
}));

// ── Create user ─────────────────────────────────────────────────────────────
// POST /admin/users
adminRouter.post('/users', asyncHandler(async (req, res) => {
  const parsed = userCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { email, name, role, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await prisma.user.create({
      data: { email, name, role, passwordHash },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  } catch (err) {
    throw mapPrismaError(err, 'Failed to create user');
  }

  res.status(201).json(user);
}));

// ── Update user ─────────────────────────────────────────────────────────────
// PATCH /admin/users/:id
adminRouter.patch('/users/:id', asyncHandler(async (req, res) => {
  const parsed = userPatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { password, ...rest } = parsed.data;

  // Prevent an admin from accidentally locking themselves out
  if (rest.role && req.params.id === req.user.sub && rest.role !== 'ADMIN') {
    throw new HttpError(400, 'Cannot remove ADMIN role from your own account');
  }

  const data = { ...rest };
  if (password) data.passwordHash = await hashPassword(password);

  let user;
  try {
    user = await prisma.user.update({
      where:  { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, updatedAt: true },
    });
  } catch (err) {
    throw mapPrismaError(err, 'Failed to update user');
  }

  res.json(user);
}));

// ── Delete user ─────────────────────────────────────────────────────────────
// DELETE /admin/users/:id
adminRouter.delete('/users/:id', asyncHandler(async (req, res) => {
  // Prevent self-deletion
  if (req.params.id === req.user.sub) {
    throw new HttpError(400, 'Cannot delete your own account');
  }

  try {
    await prisma.user.delete({ where: { id: req.params.id } });
  } catch (err) {
    throw mapPrismaError(err, 'Failed to delete user');
  }

  res.status(204).send();
}));