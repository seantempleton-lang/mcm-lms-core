ALTER TABLE "Module"
  ADD COLUMN "moduleKey" TEXT;

CREATE UNIQUE INDEX "Module_moduleKey_key" ON "Module"("moduleKey");
