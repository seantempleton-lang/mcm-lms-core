# Build Context: MCM LMS Core API

## Purpose

This repository is the backend API for the McMillan Drilling learning management system. It manages users, roles, competencies, training modules, facilitated sessions, learner training assignments, competency awards, matrix reporting, and controlled training resources.

The API is designed to be consumed by an LMS UI and deployed as a small Dockerized Node/Express service backed by PostgreSQL.

## Technology Stack

- Runtime: Node.js 20, ES modules.
- Web framework: Express 4.
- Database: PostgreSQL.
- ORM: Prisma 5.
- Auth: JWT bearer tokens.
- Password hashing: bcryptjs.
- Validation: Zod.
- Security/middleware: helmet, cors, morgan.
- File uploads: multer.
- Deployment shape: Docker image plus Postgres service, with Coolify-oriented configuration in the README.

## Local/Container Runtime

Important scripts from `package.json`:

- `npm run dev` starts the API with `node --watch src/index.js`.
- `npm start` starts `src/index.js`.
- `npm test` runs Node's built-in test runner.
- `npm run prisma:generate` generates Prisma client.
- `npm run prisma:migrate` deploys migrations.
- `npm run prisma:seed` seeds users, competencies, modules, and training content.
- `npm run module:import -- <file> --dry-run` validates a complete module package from disk.
- `npm run module:import -- <file>` imports a complete module package into Postgres.

Environment variables:

- `DATABASE_URL` is required for Prisma/Postgres.
- `JWT_SECRET` is required outside development. Development falls back to `dev_secret`.
- `PORT` defaults to `3000`.
- `CORS_ORIGIN` controls browser access and enables credentials when set.
- `NODE_ENV` defaults to `development`.
- `RUN_SEED=true` runs the seed script during container startup; otherwise startup only deploys migrations.
- `DOCUMENT_STORAGE` selects `local` or `s3` document storage.
- `DOCUMENTS_ROOT` controls local document storage when `DOCUMENT_STORAGE=local`.
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_FORCE_PATH_STYLE`, and `S3_PREFIX` configure Garage/S3 storage when `DOCUMENT_STORAGE=s3`.

Docker:

- `Dockerfile` uses `node:20-slim`, installs OpenSSL for Prisma, runs `npm ci --omit=dev`, generates Prisma client, exposes port `3000`, and uses `/app/docker/entrypoint.sh`.
- Container startup always deploys Prisma migrations. It only runs `prisma/seed.js` when `RUN_SEED=true`.
- `docker-compose.yml` defines a local `postgres:16-alpine` database and API service, enables `RUN_SEED=true`, and mounts `./storage/documents` into `/app/storage/documents`.
- The API healthcheck hits `GET /health`.

Coolify assumptions from `README.md`:

- Application URL: `http://lms-core.mcm`
- Exposed port: `3000`
- UI origin: `http://lms-ui.mcm`
- `JWT_SECRET` should be strong in deployed environments.
- `DATABASE_URL` should point at the Coolify Postgres connection string.
- For Garage storage, set `DOCUMENT_STORAGE=s3` and provide the Garage S3 endpoint, bucket, access key, secret key, and path-style setting.
- For local storage, set `DOCUMENT_STORAGE=local` and point `DOCUMENTS_ROOT` at a persistent mounted directory.
- `RUN_SEED` should only be enabled when intentionally seeding or reseeding.

## Auth and Roles

Authentication is JWT-based.

- Login endpoint returns a signed token.
- Protected endpoints expect `Authorization: Bearer <token>`.
- JWT payload is built from the user record and used by route middleware as `req.user`.

Roles:

- `ADMIN`: full admin access, user management, competency/module management, resource upload/delete.
- `SUPERVISOR`: can manage sessions, attendance, assessments, awards, training assignments, and matrix views.
- `LEARNER`: can view own assigned training and submit work for review.

Role checks are implemented in `src/middleware/auth.js`.

## Core Data Model

Primary Prisma models:

- `User`: username-based login, optional email, role, password hash.
- `Competency`: code/title/category/description with optional expiry.
- `Module`: training module metadata, optional stable `moduleKey`, and optional self-paced content.
- `ModuleCompetency`: maps modules to competencies and an evidence type.
- `TrainingSession`: facilitated session for a module, owned by a facilitator.
- `SessionAttendance`: attendance per session/user.
- `SessionAssessment`: per-session competency assessment outcome.
- `CompetencyAward`: awarded competency evidence for a user.
- `TrainingAssignment`: learner-specific assigned module workflow.

Important enums:

- `Role`: `ADMIN`, `SUPERVISOR`, `LEARNER`
- `ModuleMode`: `INDIVIDUAL`, `FACILITATED`, `HYBRID`
- `EvidenceType`: `COMPLETION`, `QUIZ`, `SESSION`, `SIGNOFF`
- `AssessmentOutcome`: `COMPETENT`, `NEEDS_FOLLOWUP`
- `TrainingAssignmentStatus`: `ASSIGNED`, `IN_PROGRESS`, `PENDING_REVIEW`, `COMPLETED`

Important uniqueness constraints:

- Usernames and emails are unique.
- Competency codes are unique.
- A module can map to a competency once.
- Attendance is unique per session/user.
- Session assessment is unique per session/user/competency.
- Competency awards are unique per user/competency/session.
- Training assignments are unique per learner/module.

## Database Migrations

Migrations live under `prisma/migrations`.

Notable recent migration:

- `20260525100000_module_key` adds nullable unique `Module.moduleKey` for idempotent module imports.
- `20260525090000_module_content_body_json` changes `Module.contentBody` from text to JSONB.
- Existing `contentBody` values are converted with a defensive parser:
  - Valid stringified JSON becomes structured JSON.
  - Empty values become `NULL`.
  - Unexpected non-JSON text is preserved as a JSON string so migration does not fail mid-deploy.

Run migrations with:

- `npm run prisma:migrate`

The command requires `DATABASE_URL` to be set.

## API Surface

Public/unprotected:

- `GET /health`
- `GET /documents/:filename` serves files from the configured document backend after basename validation.

Auth:

- `POST /auth/login`
- `GET /auth/me`

Users:

- `GET /users?q=...` for supervisor/admin user lookup.

Admin:

- `GET /admin/resources`
- `DELETE /admin/resources/:filename`
- `POST /admin/modules/import?dryRun=true`
- `POST /admin/modules/import`
- `GET /admin/users?q=...`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `POST /admin/users/:id/reset-password`
- `DELETE /admin/users/:id`

Documents:

- `POST /documents/upload` for admin resource upload.
- Allowed upload extensions include common office docs, PDFs, images, and video formats.
- Upload size limit is 25 MB.

Competencies:

- `GET /competencies`
- `POST /competencies`
- `PATCH /competencies/:id`
- `POST /competencies/:id/award`

Modules:

- `GET /modules`
- `POST /modules`
- `PATCH /modules/:id`
- `PUT /modules/:id/competencies`

Module content contract:

- Imported module packages upsert modules by `module.key`, stored as `Module.moduleKey`.
- `Module.contentBody` is stored as structured JSON in Postgres/Prisma.
- Module create/update requests should send `contentBody` as a JSON object or array.
- For compatibility, the validator still accepts a JSON string and parses it before saving.
- Non-JSON strings are rejected.

Complete module package import:

- Module-building agents should write package files under `content/modules`.
- Package format and authoring guidance live in `MODULE_BUILD_CONTEXT.md`.
- The shared importer is `src/modulePackages.js`.
- The CLI entry point is `scripts/import-module.js`.
- The admin API entry point is `POST /admin/modules/import`.
- The importer validates, checks required resources, upserts competencies, upserts the module, and replaces module-competency mappings in one transaction.

Sessions:

- `GET /sessions`
- `POST /sessions`
- `GET /sessions/:id`
- `POST /sessions/:id/attendance`
- `POST /sessions/:id/assessments`
- `POST /sessions/:id/awards`

Matrix/reporting:

- `GET /matrix`
- `GET /matrix/user/:id`
- `GET /matrix/competency/:code`

Training assignments:

- `GET /training/my`
- `GET /training/my/report`
- `GET /training`
- `GET /training/report/:learnerId`
- `POST /training`
- `POST /training/:id/start`
- `POST /training/:id/submit`
- `POST /training/:id/review`

## Training Assignment Workflow

The assignment lifecycle is:

1. Supervisor/admin assigns a module to a learner with `POST /training`.
2. Learner starts it with `POST /training/:id/start`, moving it to `IN_PROGRESS`.
3. Learner submits with `POST /training/:id/submit`, moving it to `PENDING_REVIEW`.
4. Supervisor/admin reviews with `POST /training/:id/review`, moving it to `COMPLETED`.
5. Review creates competency awards for the module's mapped competencies when missing.

Assessment summary fields are stored on `TrainingAssignment`:

- score
- total questions
- attempts
- duration seconds
- last attempt timestamp

## Seed Data and Domain Content

`prisma/seed.js` is a major source of product/domain context. It seeds:

- Real initial users:
  - Sean Templeton, `ADMIN`
  - Tom Lubbe, `SUPERVISOR`
  - Greg Cossar, `LEARNER`
- Initial password for seeded users: `password123!`
- Geotechnical drilling competencies and modules.
- Manual handling/HSE module content.
- P399 Plant Risk Assessment review content.
- A large Surface priority training series from:
  - `SUR-UW-SWP.pdf`
  - `SUR-DA-SWP.pdf`
  - `SUR-DA-TP.pdf`
  - `SUR-DR-SWP.pdf`
- Generated self-directed modules use structured JSON stored in `Module.contentBody`.
- The GEN 1.1 Refuelling Diesel Engines module includes extracted document text, rendered page images, source links, and quiz questions.

Seeded module content is not just placeholder data; it carries much of the current LMS training structure and should be treated as active product content.

New module content should preferably be authored as package JSON files and imported through the module package importer instead of adding more content directly to `prisma/seed.js`.

## Document Storage

Document resources are accessed through `src/utils/storage.js`.

Supported backends:

- `DOCUMENT_STORAGE=local`: files live under `DOCUMENTS_ROOT`, defaulting to `storage/documents`.
- `DOCUMENT_STORAGE=s3`: files live in an S3-compatible bucket, intended for Garage in Coolify.

Garage/S3 environment:

- `S3_ENDPOINT`: Garage S3 API endpoint.
- `S3_BUCKET`: bucket name.
- `S3_ACCESS_KEY_ID`: Garage access key.
- `S3_SECRET_ACCESS_KEY`: Garage secret key.
- `S3_REGION`: defaults to `garage`.
- `S3_FORCE_PATH_STYLE`: defaults to `true`.
- `S3_PREFIX`: optional object key prefix, default example is `documents`.

Current checked-in resources include:

- `sur-uw-swp.pdf`
- `sur-uw-gen-1-1-page-1.png`
- `sur-uw-gen-1-1-page-2.png`

Routes reference resources by URLs such as:

- `/documents/sur-uw-swp.pdf`
- `/documents/sur-uw-gen-1-1-page-1.png`

Filename handling:

- Downloads reject path traversal by comparing the requested name to `path.basename`.
- Uploads sanitize filenames to lowercase dash-separated names and avoid collisions with numeric suffixes.
- Uploads, downloads, admin listing, admin deletion, and module package resource checks all use the same storage adapter.

## Frontend Contract Notes

The API is intended for a separate LMS UI.

Key frontend expectations:

- Store and send JWT bearer tokens after login.
- Use username/password login, not email/password login.
- Module content may include `contentBody` as structured JSON. The UI can render self-paced module decks/quizzes from it without parsing stringified JSON.
- Older UI code that still sends stringified JSON should continue to work during transition, but new code should send native JSON.
- `contentUrl` can point at `/documents/...` resources.
- Supervisor/admin screens need training assignment review flows.
- Learner screens need assignment start/submit flows and report views.
- Matrix views should consume `/matrix`, `/matrix/user/:id`, and `/matrix/competency/:code`.

## Validation and Error Handling

- Request validation is centralized in `src/validators.js` using Zod.
- `moduleCreateSchema` accepts structured `contentBody` JSON and transforms legacy JSON strings into objects/arrays.
- Common Prisma errors are mapped through `mapPrismaError` in `src/utils/http.js`.
- Most route handlers use `asyncHandler`.
- The global Express error handler returns `{ error: message }`.

## Test Coverage

`npm test` currently covers:

- Username generation and uniqueness helper behavior.
- Password generation, hashing, and verification helpers.
- Module `contentBody` validation for structured JSON, legacy JSON strings, and invalid strings.
- Module package validation, dry-run import behavior, and mocked transactional import behavior.
- Document filename validation.

The test suite is intentionally small and fast; route-level coverage still needs either an isolated test database or a mocked Prisma boundary.

## Current Caveats

- Automated test coverage is still small and does not yet exercise routes or database workflows.
- Seed data contains real named users and a shared initial password. Container startup now skips seeding unless `RUN_SEED=true`, but intentional production seeding still needs care.
- The seed file is large and content-heavy; future edits should avoid accidental broad rewrites.
- Document upload storage supports local filesystem and Garage/S3, but production still depends on the correct Coolify storage credentials and bucket configuration.
- CORS is effectively disabled unless `CORS_ORIGIN` is set.
- Development JWT fallback now logs a startup warning when used; production still requires `JWT_SECRET`.

## Caveat Triage Plan

Completed easy wins:

- Add a working `npm test` command using Node's built-in test runner.
- Add focused utility tests for usernames and passwords.
- Make container startup seeding opt-in with `RUN_SEED=true`.
- Keep local Docker Compose convenient by enabling `RUN_SEED=true` there.
- Make document storage configurable with `DOCUMENTS_ROOT`.
- Add Garage/S3-compatible document storage for uploads, downloads, listing, deletion, and module resource validation.
- Mount `./storage/documents` into the local Compose API container.
- Log a development warning when the JWT fallback secret is being used.
- Document the new deployment flags in `README.md`, `.env.example`, and this file.
- Convert `Module.contentBody` from stringified JSON to a Prisma `Json` field, with migration support for existing values and validator compatibility for legacy JSON-string requests.
- Add the agent-friendly module package import architecture, including `Module.moduleKey`, shared validation/import service, CLI importer, admin import endpoint, package tests, and `MODULE_BUILD_CONTEXT.md`.

Recommended next pieces:

- Add route-level tests with an isolated test database or mocked Prisma client.
- Gradually move large seeded module content into reviewed package files under `content/modules`.
- Decide whether production should ever run seed data, and if so create a separate production-safe seed path with generated initial credentials.
- Decide the production storage mount path for Coolify and ensure it is backed by persistent storage.
- Decide whether the API should allow a default local CORS origin in development or continue requiring explicit `CORS_ORIGIN`.
