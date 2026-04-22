ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

WITH generated AS (
  SELECT
    id,
    COALESCE(
      NULLIF(regexp_replace(COALESCE("name", ''), '[^A-Za-z0-9]+', '', 'g'), ''),
      NULLIF(split_part(COALESCE("email", ''), '@', 1), ''),
      'User'
    ) AS base
  FROM "User"
),
ranked AS (
  SELECT
    id,
    base,
    ROW_NUMBER() OVER (PARTITION BY base ORDER BY id) AS seq
  FROM generated
)
UPDATE "User" AS u
SET "username" = CASE
  WHEN ranked.seq = 1 THEN ranked.base
  ELSE ranked.base || ranked.seq::text
END
FROM ranked
WHERE u.id = ranked.id;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
