import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';

const prisma = new PrismaClient();

async function upsertUser(email, name, role) {
  const passwordHash = await hashPassword('ChangeMe123!');
  return prisma.user.upsert({
    where: { email },
    update: { name, role },
    create: { email, name, role, passwordHash }
  });
}

async function main() {
  await upsertUser('admin@example.com', 'Admin User', 'ADMIN');
  await upsertUser('supervisor@example.com', 'Supervisor User', 'SUPERVISOR');
  await upsertUser('learner@example.com', 'Learner User', 'LEARNER');

  // Example competencies (replace with your catalogue later)
  await prisma.competency.upsert({
    where: { code: 'DT-FUND-01' },
    update: {},
    create: { code: 'DT-FUND-01', title: 'Dual Tube (DT) Drilling – Fundamentals', category: 'Geotech / DT' }
  });

  await prisma.module.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000001', title: 'DT Fundamentals (Shell)', mode: 'FACILITATED' }
  }).catch(()=>{});

  console.log('Seed complete. Default passwords: ChangeMe123!');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
