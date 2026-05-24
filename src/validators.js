import { z } from 'zod';
const usernameSchema = z.string().trim().min(3).max(60).regex(/^[A-Za-z0-9]+$/, 'Username must use letters and numbers only');

export const loginSchema = z.object({ username:usernameSchema, password:z.string().min(8) });
export const sessionCreateSchema = z.object({ moduleId:z.string().uuid(), date:z.string().datetime(), location:z.string().optional(), project:z.string().optional() });
export const attendancePostSchema = z.object({ attendees: z.array(z.object({ userId:z.string().uuid(), attended:z.boolean().optional() })).min(1) });
export const assessmentsPostSchema = z.object({ assessments: z.array(z.object({ userId:z.string().uuid(), competencyId:z.string().uuid(), outcome:z.enum(['COMPETENT','NEEDS_FOLLOWUP']), notes:z.string().optional() })).min(1) });
export const sessionAwardsPostSchema = z.object({ awards: z.array(z.object({ userId:z.string().uuid(), competencyId:z.string().uuid(), notes:z.string().optional() })).min(1) });
export const competencyCreateSchema = z.object({ code:z.string().min(3), title:z.string().min(3), category:z.string().min(2), description:z.string().optional(), expiryMonths:z.number().int().positive().optional() });
export const competencyPatchSchema = competencyCreateSchema.partial();
const documentUrlSchema = z.union([
  z.string().url(),
  z.string().startsWith('/documents/')
]);
const moduleKeySchema = z.string().trim().min(3).max(120).regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Module key must start with a letter or number and use only letters, numbers, dots, underscores, or hyphens');
const jsonContentBodySchema = z.union([
  z.record(z.unknown()),
  z.array(z.unknown()),
  z.string().transform((value, ctx) => {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      // Report a validation issue below.
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'contentBody must be a JSON object, array, or a string containing JSON object/array data',
    });
    return z.NEVER;
  })
]);
export const moduleCreateSchema = z.object({
  moduleKey:moduleKeySchema.optional(),
  title:z.string().min(3),
  mode:z.enum(['INDIVIDUAL','FACILITATED','HYBRID']).optional(),
  category:z.string().min(2).optional(),
  description:z.string().optional(),
  learningObjectives:z.string().max(4000).optional(),
  estimatedMinutes:z.number().int().positive().max(1440).optional(),
  contentUrl:documentUrlSchema.optional(),
  contentBody:jsonContentBodySchema.optional()
});
export const modulePatchSchema = moduleCreateSchema.partial();
export const moduleCompetenciesPutSchema = z.object({ items: z.array(z.object({ competencyId:z.string().uuid(), evidenceType:z.enum(['COMPLETION','QUIZ','SESSION','SIGNOFF']) })) });
export const awardSchema = z.object({ userId:z.string().uuid(), evidenceType:z.enum(['COMPLETION','QUIZ','SESSION','SIGNOFF']), sessionId:z.string().uuid().optional(), notes:z.string().optional() });
export const userCreateSchema = z.object({
  username: usernameSchema.optional(),
  email:    z.string().email().optional(),
  name:     z.string().min(2),
  role:     z.enum(['ADMIN', 'SUPERVISOR', 'LEARNER']),
  password: z.string().min(8),
});

export const userPatchSchema = z.object({
  name:     z.string().min(2).optional(),
  username: usernameSchema.optional(),
  email:    z.string().email().optional().nullable(),
  role:     z.enum(['ADMIN', 'SUPERVISOR', 'LEARNER']).optional(),
  password: z.string().min(8).optional(),
});

export const trainingAssignmentCreateSchema = z.object({
  learnerId: z.string().uuid(),
  moduleId: z.string().uuid(),
});

export const trainingAssignmentStartSchema = z.object({
  learnerNotes: z.string().trim().max(2000).optional(),
});

const assessmentSummarySchema = z.object({
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(0),
  attempts: z.number().int().min(1),
  durationSeconds: z.number().int().min(0)
});

export const trainingAssignmentSubmitSchema = z.object({
  learnerNotes: z.string().trim().max(2000).optional(),
  assessmentSummary: assessmentSummarySchema.optional(),
});

export const trainingAssignmentReviewSchema = z.object({
  reviewNotes: z.string().trim().max(2000).optional(),
});
