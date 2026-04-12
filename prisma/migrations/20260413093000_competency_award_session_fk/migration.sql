DELETE FROM "CompetencyAward" award
WHERE award."sessionId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "TrainingSession" session
    WHERE session."id" = award."sessionId"
  );

ALTER TABLE "CompetencyAward"
ADD CONSTRAINT "CompetencyAward_sessionId_fkey"
FOREIGN KEY ("sessionId")
REFERENCES "TrainingSession"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
