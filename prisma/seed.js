import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';

const prisma = new PrismaClient();

async function upsertUser(email, name, role, password) {
  const passwordHash = await hashPassword(password);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash },
    create: { email, name, role, passwordHash }
  });
}

async function main() {

  // ── Real users ──────────────────────────────────────────────
  await upsertUser('stempleton@drilling.co.nz', 'Sean Templeton', 'ADMIN',      'password123!');
  await upsertUser('tlubbe@drilling.co.nz',     'Tom Lubbe',      'SUPERVISOR', 'password123!');
  await upsertUser('gcossar@drilling.co.nz',    'Greg Cossar',    'LEARNER',    'password123!');

  // ── Default test accounts (remove when no longer needed) ────
  await upsertUser('admin@example.com',      'Admin User',      'ADMIN',      'ChangeMe123!');
  await upsertUser('supervisor@example.com', 'Supervisor User', 'SUPERVISOR', 'ChangeMe123!');
  await upsertUser('learner@example.com',    'Learner User',    'LEARNER',    'ChangeMe123!');

  // ── Competencies ────────────────────────────────────────────
  await prisma.competency.upsert({
    where:  { code: 'DT-FUND-01' },
    update: {},
    create: { code: 'DT-FUND-01', title: 'Dual Tube (DT) Drilling – Fundamentals', category: 'Geotech / DT' }
  });

  console.log('Seed complete.');
}

main()
  .then(()  => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });