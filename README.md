# mcm-lms-core (API)

This is the LMS Core API.

## Coolify deployment

Use these application settings in Coolify:

- Application URL: `http://lms-core.mcm`
- Exposed port: `3000`
- `CORS_ORIGIN=http://lms-ui.mcm`
- Set a strong `JWT_SECRET`
- Set `DATABASE_URL` to your Coolify Postgres connection string

This API is configured to accept browser requests from `http://lms-ui.mcm`.

## API

### User lookup
- `GET /users?q=...` (SUPERVISOR/ADMIN)
Returns up to 50 users (`id`, `name`, `email`, `role`) for adding attendees to sessions.
