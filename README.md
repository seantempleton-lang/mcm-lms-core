# mcm-lms-core (API)

This is the LMS Core API.

## Coolify deployment

Use these application settings in Coolify:

- Application URL: `http://lms-core.mcm`
- Exposed port: `3000`
- `CORS_ORIGIN=http://lms-ui.mcm`
- Set a strong `JWT_SECRET`
- Set `DATABASE_URL` to your Coolify Postgres connection string
- Set `DOCUMENTS_ROOT` to a persistent mounted directory if admins will upload resources
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

For a human-readable walkthrough of how to author modules, extract source PDFs, structure slide content, and validate imports, see `MODULE_CREATION_GUIDE.md`.
