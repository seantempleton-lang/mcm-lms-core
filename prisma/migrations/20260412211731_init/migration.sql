-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN','SUPERVISOR','LEARNER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ModuleMode" AS ENUM ('INDIVIDUAL','FACILITATED','HYBRID');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "EvidenceType" AS ENUM ('COMPLETION','QUIZ','SESSION','SIGNOFF');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "AssessmentOutcome" AS ENUM ('COMPETENT','NEEDS_FOLLOWUP');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'LEARNER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Competency" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "expiryMonths" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Module" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "mode" "ModuleMode" NOT NULL DEFAULT 'INDIVIDUAL',
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ModuleCompetency" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "moduleId" UUID NOT NULL,
  "competencyId" UUID NOT NULL,
  "evidenceType" "EvidenceType" NOT NULL,
  CONSTRAINT "ModuleCompetency_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE,
  CONSTRAINT "ModuleCompetency_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE,
  CONSTRAINT "ModuleCompetency_unique" UNIQUE ("moduleId", "competencyId")
);

CREATE TABLE IF NOT EXISTS "TrainingSession" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "moduleId" UUID NOT NULL,
  "facilitatorId" UUID NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "location" TEXT,
  "project" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrainingSession_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id"),
  CONSTRAINT "TrainingSession_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "User"("id")
);

CREATE TABLE IF NOT EXISTS "SessionAttendance" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "attended" BOOLEAN NOT NULL DEFAULT TRUE,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SessionAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE,
  CONSTRAINT "SessionAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "SessionAttendance_unique" UNIQUE ("sessionId", "userId")
);

CREATE TABLE IF NOT EXISTS "SessionAssessment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "competencyId" UUID NOT NULL,
  "outcome" "AssessmentOutcome" NOT NULL,
  "notes" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SessionAssessment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE,
  CONSTRAINT "SessionAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "SessionAssessment_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE,
  CONSTRAINT "SessionAssessment_unique" UNIQUE ("sessionId", "userId", "competencyId")
);

CREATE TABLE IF NOT EXISTS "CompetencyAward" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "competencyId" UUID NOT NULL,
  "awardedById" UUID NOT NULL,
  "evidenceType" "EvidenceType" NOT NULL,
  "sessionId" UUID,
  "notes" TEXT,
  "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompetencyAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "CompetencyAward_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE,
  CONSTRAINT "CompetencyAward_awardedById_fkey" FOREIGN KEY ("awardedById") REFERENCES "User"("id") ON DELETE CASCADE
);

-- updatedAt trigger helper
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_competency_updated_at BEFORE UPDATE ON "Competency" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_module_updated_at BEFORE UPDATE ON "Module" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_session_updated_at BEFORE UPDATE ON "TrainingSession" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;
