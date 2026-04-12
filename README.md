# mcm-lms-core (API)

This is the LMS Core API.

## New: User lookup
- `GET /users?q=...` (SUPERVISOR/ADMIN)
Returns up to 50 users (id, name, email, role) for adding attendees to sessions.
