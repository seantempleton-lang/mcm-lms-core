ALTER TABLE "TrainingAssignment"
ADD COLUMN "assessmentScore" INTEGER,
ADD COLUMN "assessmentTotalQuestions" INTEGER,
ADD COLUMN "assessmentAttempts" INTEGER,
ADD COLUMN "assessmentDurationSeconds" INTEGER,
ADD COLUMN "assessmentLastAttemptAt" TIMESTAMP(3);
