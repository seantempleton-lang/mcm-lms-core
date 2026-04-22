import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, HttpError, mapPrismaError } from '../utils/http.js';
import { userCreateSchema, userPatchSchema } from '../validators.js';
import { generateRandomPassword, hashPassword } from '../utils/password.js';
import { generateUniqueUsername } from '../utils/usernames.js';

export const adminRouter = Router();
const documentsRoot = path.resolve(process.cwd(), 'storage', 'documents');

// All admin routes require ADMIN role
adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/resources', asyncHandler(async (req, res) => {
  let items = [];

  try {
    const entries = await fs.readdir(documentsRoot, { withFileTypes: true });
    items = await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const fullPath = path.join(documentsRoot, entry.name);
          const stat = await fs.stat(fullPath);
          return {
            filename: entry.name,
            url: `/documents/${entry.name}`,
            sizeBytes: stat.size,
            modifiedAt: stat.mtime.toISOString()
          };
        })
    );
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  items.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
  res.json(items);
}));

adminRouter.delete('/resources/:filename', asyncHandler(async (req, res) => {
  const requested = req.params.filename || '';
  const safeName = path.basename(requested);

  if (!safeName || safeName !== requested) {
    throw new HttpError(400, 'Invalid resource name');
  }

  const filePath = path.join(documentsRoot, safeName);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new HttpError(404, 'Resource not found');
    }
    throw error;
  }

  res.status(204).send();
}));

// ── List / search users ─────────────────────────────────────────────────────
// GET /admin/users?q=
adminRouter.get('/users', asyncHandler(async (req, res) => {
  const q = (req.query.q || '').toString().trim();

  const where = q ? {
    OR: [
      { name:  { contains: q, mode: 'insensitive' } },
      { username: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ],
  } : undefined;

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, username: true, email: true, role: true, createdAt: true },
    orderBy: [{ name: 'asc' }],
  });

  res.json(users);
}));

// ── Create user ─────────────────────────────────────────────────────────────
// POST /admin/users
adminRouter.post('/users', asyncHandler(async (req, res) => {
  const parsed = userCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { email, username, name, role, password } = parsed.data;
  const nextUsername = username || await generateUniqueUsername(prisma, name);
  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await prisma.user.create({
      data: { username: nextUsername, email, name, role, passwordHash },
      select: { id: true, name: true, username: true, email: true, role: true, createdAt: true },
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

  const { password, username, ...rest } = parsed.data;

  // Prevent an admin from accidentally locking themselves out
  if (rest.role && req.params.id === req.user.sub && rest.role !== 'ADMIN') {
    throw new HttpError(400, 'Cannot remove ADMIN role from your own account');
  }

  const data = { ...rest };
  if (Object.prototype.hasOwnProperty.call(rest, 'email') && rest.email === null) {
    data.email = null;
  }
  if (username) {
    data.username = username;
  } else if (rest.name) {
    data.username = await generateUniqueUsername(prisma, rest.name, req.params.id);
  }
  if (password) data.passwordHash = await hashPassword(password);

  let user;
  try {
    user = await prisma.user.update({
      where:  { id: req.params.id },
      data,
      select: { id: true, name: true, username: true, email: true, role: true, updatedAt: true },
    });
  } catch (err) {
    throw mapPrismaError(err, 'Failed to update user');
  }

  res.json(user);
}));

adminRouter.post('/users/:id/reset-password', asyncHandler(async (req, res) => {
  const nextPassword = generateRandomPassword(10);
  const passwordHash = await hashPassword(nextPassword);

  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash },
    });
  } catch (err) {
    throw mapPrismaError(err, 'Failed to reset password');
  }

  res.json({ password: nextPassword });
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
