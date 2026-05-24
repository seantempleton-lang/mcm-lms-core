import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import { documentsRoot } from './utils/storage.js';

const moduleKeySchema = z.string()
  .trim()
  .min(3)
  .max(120)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Module key must start with a letter or number and use only letters, numbers, dots, underscores, or hyphens');

const jsonContentSchema = z.union([
  z.record(z.unknown()),
  z.array(z.unknown()),
]);

const learningObjectivesSchema = z.union([
  z.string().max(4000),
  z.array(z.string().trim().min(1)).min(1).max(40).transform((items) => items.join('\n')),
]);

const documentUrlSchema = z.string()
  .trim()
  .regex(/^\/documents\/[^/\\]+$/, 'Document URLs must use /documents/<filename>')
  .refine((url) => {
    try {
      const filename = decodeURIComponent(url.replace(/^\/documents\//, ''));
      return filename && path.basename(filename) === filename;
    } catch {
      return false;
    }
  }, 'Document URL filename must not contain path separators');

const resourceSchema = z.object({
  filename: z.string().trim().min(1).max(160).optional(),
  url: documentUrlSchema,
  required: z.boolean().optional().default(true),
});

const competencySchema = z.object({
  code: z.string().trim().min(3).max(80),
  title: z.string().trim().min(3).max(240),
  category: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  expiryMonths: z.number().int().positive().optional(),
});

const mappingSchema = z.object({
  competencyCode: z.string().trim().min(3).max(80),
  evidenceType: z.enum(['COMPLETION', 'QUIZ', 'SESSION', 'SIGNOFF']),
});

export const modulePackageSchema = z.object({
  module: z.object({
    key: moduleKeySchema,
    title: z.string().trim().min(3).max(240),
    mode: z.enum(['INDIVIDUAL', 'FACILITATED', 'HYBRID']).optional().default('INDIVIDUAL'),
    category: z.string().trim().min(2).max(120).optional().default('GEOTECH'),
    description: z.string().trim().max(2000).optional(),
    learningObjectives: learningObjectivesSchema.optional(),
    estimatedMinutes: z.number().int().positive().max(1440).optional(),
    contentUrl: documentUrlSchema.optional(),
    contentBody: jsonContentSchema,
  }),
  competencies: z.array(competencySchema).min(1).max(50),
  mappings: z.array(mappingSchema).min(1).max(50),
  resources: z.array(resourceSchema).optional().default([]),
  metadata: z.record(z.unknown()).optional(),
}).superRefine((pkg, ctx) => {
  const competencyCodes = new Set();
  for (const [index, competency] of pkg.competencies.entries()) {
    if (competencyCodes.has(competency.code)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['competencies', index, 'code'],
        message: `Duplicate competency code: ${competency.code}`,
      });
    }
    competencyCodes.add(competency.code);
  }

  const mappedCodes = new Set();
  for (const [index, mapping] of pkg.mappings.entries()) {
    if (!competencyCodes.has(mapping.competencyCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mappings', index, 'competencyCode'],
        message: `Mapped competency is not defined in package: ${mapping.competencyCode}`,
      });
    }

    if (mappedCodes.has(mapping.competencyCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mappings', index],
        message: `Duplicate competency mapping: ${mapping.competencyCode}`,
      });
    }
    mappedCodes.add(mapping.competencyCode);
  }
});

function filenameFromDocumentUrl(url) {
  return decodeURIComponent(url.replace(/^\/documents\//, ''));
}

function buildResourceChecks(pkg) {
  const requiredUrls = new Set(
    pkg.resources
      .filter((resource) => resource.required)
      .map((resource) => resource.url)
  );

  if (pkg.module.contentUrl?.startsWith('/documents/')) {
    requiredUrls.add(pkg.module.contentUrl);
  }

  return Array.from(requiredUrls).map((url) => {
    const filename = filenameFromDocumentUrl(url);
    return {
      url,
      filename,
      path: path.join(documentsRoot, filename),
    };
  });
}

async function findMissingResources(pkg) {
  const checks = buildResourceChecks(pkg);
  const results = await Promise.all(checks.map(async (resource) => {
    try {
      await fs.access(resource.path);
      return null;
    } catch (error) {
      if (error?.code === 'ENOENT') return resource;
      throw error;
    }
  }));

  return results.filter(Boolean);
}

function buildModuleData(module) {
  return {
    moduleKey: module.key,
    title: module.title,
    mode: module.mode,
    category: module.category,
    description: module.description,
    learningObjectives: module.learningObjectives,
    estimatedMinutes: module.estimatedMinutes,
    contentUrl: module.contentUrl,
    contentBody: module.contentBody,
  };
}

export async function validateModulePackage(input, options = {}) {
  const parsed = modulePackageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.flatten(),
    };
  }

  const pkg = parsed.data;
  const missingResources = options.checkResources === false
    ? []
    : await findMissingResources(pkg);

  return {
    ok: missingResources.length === 0,
    package: pkg,
    missingResources,
    plan: {
      moduleKey: pkg.module.key,
      moduleTitle: pkg.module.title,
      competencies: pkg.competencies.map((competency) => competency.code),
      mappings: pkg.mappings,
      resources: pkg.resources.map((resource) => resource.url),
    },
  };
}

export async function importModulePackage({ prisma, input, dryRun = false, checkResources = true }) {
  const validation = await validateModulePackage(input, { checkResources });
  if (!validation.ok) {
    return {
      ok: false,
      dryRun,
      error: validation.error,
      missingResources: validation.missingResources || [],
      plan: validation.plan,
    };
  }

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      plan: validation.plan,
    };
  }

  const pkg = validation.package;
  const moduleData = buildModuleData(pkg.module);

  const result = await prisma.$transaction(async (tx) => {
    const competencies = [];

    for (const competency of pkg.competencies) {
      const item = await tx.competency.upsert({
        where: { code: competency.code },
        update: competency,
        create: competency,
      });
      competencies.push(item);
    }

    const competencyByCode = new Map(competencies.map((competency) => [competency.code, competency]));
    const missingMappedCompetencies = pkg.mappings
      .filter((mapping) => !competencyByCode.has(mapping.competencyCode))
      .map((mapping) => mapping.competencyCode);

    if (missingMappedCompetencies.length) {
      throw new Error(`Mapped competencies are missing from package: ${missingMappedCompetencies.join(', ')}`);
    }

    const module = await tx.module.upsert({
      where: { moduleKey: pkg.module.key },
      update: moduleData,
      create: moduleData,
    });

    await tx.moduleCompetency.deleteMany({ where: { moduleId: module.id } });
    await tx.moduleCompetency.createMany({
      data: pkg.mappings.map((mapping) => ({
        moduleId: module.id,
        competencyId: competencyByCode.get(mapping.competencyCode).id,
        evidenceType: mapping.evidenceType,
      })),
    });

    const updated = await tx.module.findUnique({
      where: { id: module.id },
      include: {
        competencies: { include: { competency: true } },
      },
    });

    return {
      module: updated,
      competencies,
      mappingsCreated: pkg.mappings.length,
    };
  });

  return {
    ok: true,
    dryRun: false,
    plan: validation.plan,
    result,
  };
}
