# mcm-lms-core (API)

This is the LMS Core API.

## Coolify deployment

Use these application settings in Coolify:

- Application URL: `http://lms-core.mcm`
- Exposed port: `3000`
- `CORS_ORIGIN=http://lms-ui.mcm`
- Set a strong `JWT_SECRET`
- Set `DATABASE_URL` to your Coolify Postgres connection string
- For local app storage, set `DOCUMENT_STORAGE=local` and `DOCUMENTS_ROOT` to a persistent mounted directory
- For Garage/S3 storage, set `DOCUMENT_STORAGE=s3`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and usually `S3_FORCE_PATH_STYLE=true`
- Set `RUN_SEED=true` only when intentionally seeding the environment

This API is configured to accept browser requests from `http://lms-ui.mcm`.

## API

### User lookup
- `GET /users?q=...` (SUPERVISOR/ADMIN)
Returns up to 50 users (`id`, `name`, `email`, `role`) for adding attendees to sessions.

### Module package import
- `POST /admin/modules/import?dryRun=true` validates a complete module package without writing to the database.
- `POST /admin/modules/import` imports a complete module package as an ADMIN.
- `npm run module:import -- content/modules/example.module.json --dry-run` validates a package from disk.

See `MODULE_BUILD_CONTEXT.md` for the module package format used by module-building agents.
