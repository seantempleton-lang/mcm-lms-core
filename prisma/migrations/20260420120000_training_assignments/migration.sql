CREATE TYPE "TrainingAssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED');

CREATE TABLE "TrainingAssignment" (
  "id" UUID NOT NULL,
  "learnerId" UUID NOT NULL,
  "moduleId" UUID NOT NULL,
  "assignedById" UUID NOT NULL,
  "status" "TrainingAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
  "learnerNotes" TEXT,
  "reviewNotes" TEXT,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrainingAssignment_learnerId_moduleId_key" ON "TrainingAssignment"("learnerId", "moduleId");

ALTER TABLE "TrainingAssignment"
  ADD CONSTRAINT "TrainingAssignment_learnerId_fkey"
  FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrainingAssignment"
  ADD CONSTRAINT "TrainingAssignment_moduleId_fkey"
  FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrainingAssignment"
  ADD CONSTRAINT "TrainingAssignment_assignedById_fkey"
  FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
