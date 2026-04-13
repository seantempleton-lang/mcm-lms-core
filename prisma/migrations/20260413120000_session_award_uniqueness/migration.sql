CREATE UNIQUE INDEX "CompetencyAward_userId_competencyId_sessionId_key"
ON "CompetencyAward"("userId", "competencyId", "sessionId");
