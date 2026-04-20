import { z } from 'zod';
export const loginSchema = z.object({ email:z.string().email(), password:z.string().min(8) });
export const sessionCreateSchema = z.object({ moduleId:z.string().uuid(), date:z.string().datetime(), location:z.string().optional(), project:z.string().optional() });
export const attendancePostSchema = z.object({ attendees: z.array(z.object({ userId:z.string().uuid(), attended:z.boolean().optional() })).min(1) });
export const assessmentsPostSchema = z.object({ assessments: z.array(z.object({ userId:z.string().uuid(), competencyId:z.string().uuid(), outcome:z.enum(['COMPETENT','NEEDS_FOLLOWUP']), notes:z.string().optional() })).min(1) });
export const sessionAwardsPostSchema = z.object({ awards: z.array(z.object({ userId:z.string().uuid(), competencyId:z.string().uuid(), notes:z.string().optional() })).min(1) });
export const competencyCreateSchema = z.object({ code:z.string().min(3), title:z.string().min(3), category:z.string().min(2), description:z.string().optional(), expiryMonths:z.number().int().positive().optional() });
export const competencyPatchSchema = competencyCreateSchema.partial();
export const moduleCreateSchema = z.object({
  title:z.string().min(3),
  mode:z.enum(['INDIVIDUAL','FACILITATED','HYBRID']).optional(),
  description:z.string().optional(),
  learningObjectives:z.string().max(4000).optional(),
  estimatedMinutes:z.number().int().positive().max(1440).optional(),
  contentUrl:z.string().url().optional(),
  contentBody:z.string().max(20000).optional()
});
export const modulePatchSchema = moduleCreateSchema.partial();
export const moduleCompetenciesPutSchema = z.object({ items: z.array(z.object({ competencyId:z.string().uuid(), evidenceType:z.enum(['COMPLETION','QUIZ','SESSION','SIGNOFF']) })).min(1) });
export const awardSchema = z.object({ userId:z.string().uuid(), evidenceType:z.enum(['COMPLETION','QUIZ','SESSION','SIGNOFF']), sessionId:z.string().uuid().optional(), notes:z.string().optional() });
export const userCreateSchema = z.object({
  email:    z.string().email(),
  name:     z.string().min(2),
  role:     z.enum(['ADMIN', 'SUPERVISOR', 'LEARNER']),
  password: z.string().min(8),
});

export const userPatchSchema = z.object({
  name:     z.string().min(2).optional(),
  email:    z.string().email().optional(),
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

export const trainingAssignmentSubmitSchema = z.object({
  learnerNotes: z.string().trim().max(2000).optional(),
});

export const trainingAssignmentReviewSchema = z.object({
  reviewNotes: z.string().trim().max(2000).optional(),
});
