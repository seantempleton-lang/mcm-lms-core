import test from 'node:test';
import assert from 'node:assert/strict';
import { importModulePackage, validateModulePackage } from '../src/modulePackages.js';

function buildPackage(overrides = {}) {
  return {
    module: {
      key: 'SUR-UW-SWP-GEN-1-1',
      title: 'GEN 1.1 - Refuelling Diesel Engines',
      mode: 'INDIVIDUAL',
      category: 'SURFACE',
      description: 'Self-directed review module.',
      learningObjectives: [
        'Identify when the procedure applies.',
        'Confirm understanding through a short quiz.',
      ],
      estimatedMinutes: 15,
      contentUrl: '/documents/sur-uw-swp.pdf',
      contentBody: {
        title: 'GEN 1.1 - Refuelling Diesel Engines',
        slides: [{ id: 'hero', type: 'hero', title: 'Refuel safely' }],
        quiz: [{ id: 'q1', question: 'When should the engine be shut down?', options: ['Before refuelling'], correctIndex: 0 }],
      },
    },
    competencies: [
      {
        code: 'SUR-UW-SWP-GEN-1-1',
        title: 'GEN 1.1 - Refuelling Diesel Engines',
        category: 'Surface Utility Worker',
        description: 'Self-directed competency.',
      },
    ],
    mappings: [
      {
        competencyCode: 'SUR-UW-SWP-GEN-1-1',
        evidenceType: 'QUIZ',
      },
    ],
    resources: [
      {
        url: '/documents/sur-uw-swp.pdf',
      },
    ],
    ...overrides,
  };
}

test('validateModulePackage accepts a complete package and builds an import plan', async () => {
  const result = await validateModulePackage(buildPackage(), { checkResources: false });

  assert.equal(result.ok, true);
  assert.equal(result.plan.moduleKey, 'SUR-UW-SWP-GEN-1-1');
  assert.deepEqual(result.plan.competencies, ['SUR-UW-SWP-GEN-1-1']);
});

test('validateModulePackage rejects duplicate module competency mappings', async () => {
  const result = await validateModulePackage(buildPackage({
    mappings: [
      { competencyCode: 'SUR-UW-SWP-GEN-1-1', evidenceType: 'QUIZ' },
      { competencyCode: 'SUR-UW-SWP-GEN-1-1', evidenceType: 'SIGNOFF' },
    ],
  }), { checkResources: false });

  assert.equal(result.ok, false);
});

test('validateModulePackage rejects document URLs with encoded path separators', async () => {
  const result = await validateModulePackage(buildPackage({
    module: {
      ...buildPackage().module,
      contentUrl: '/documents/..%2Fsecret.pdf',
    },
  }), { checkResources: false });

  assert.equal(result.ok, false);
});

test('importModulePackage dry-run validates without touching prisma', async () => {
  const prisma = {
    $transaction: () => {
      throw new Error('transaction should not run in dry-run mode');
    },
  };

  const result = await importModulePackage({
    prisma,
    input: buildPackage(),
    dryRun: true,
    checkResources: false,
  });

  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
});

test('importModulePackage upserts module package records in one transaction', async () => {
  const calls = [];
  const tx = {
    competency: {
      upsert: async (args) => {
        calls.push(['competency.upsert', args.where.code]);
        return { id: 'competency-id', ...args.create };
      },
    },
    module: {
      upsert: async (args) => {
        calls.push(['module.upsert', args.where.moduleKey]);
        return { id: 'module-id', ...args.create };
      },
      findUnique: async () => ({
        id: 'module-id',
        moduleKey: 'SUR-UW-SWP-GEN-1-1',
        competencies: [],
      }),
    },
    moduleCompetency: {
      deleteMany: async (args) => {
        calls.push(['moduleCompetency.deleteMany', args.where.moduleId]);
        return { count: 0 };
      },
      createMany: async (args) => {
        calls.push(['moduleCompetency.createMany', args.data.length]);
        return { count: args.data.length };
      },
    },
  };
  const prisma = {
    $transaction: async (callback) => callback(tx),
  };

  const result = await importModulePackage({
    prisma,
    input: buildPackage(),
    checkResources: false,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [
    ['competency.upsert', 'SUR-UW-SWP-GEN-1-1'],
    ['module.upsert', 'SUR-UW-SWP-GEN-1-1'],
    ['moduleCompetency.deleteMany', 'module-id'],
    ['moduleCompetency.createMany', 1],
  ]);
});
