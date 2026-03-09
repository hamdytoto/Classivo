# Sprint 1 - Bullet 9: Auth Rate Limiting

## Goal
Implement Sprint 1 TODO bullet 9 by adding targeted rate limiting to authentication endpoints to reduce brute-force and token abuse risk.

## Scope
- Add request throttling for `POST /auth/login`, `POST /auth/refresh`, and `POST /auth/logout`.
- Key limits by client IP and route so different auth actions do not share the same counter.
- Use environment-driven auth rate-limit settings with fallback to existing global rate-limit values.
- Return a consistent `429 Too Many Requests` error contract when the limit is exceeded.
- Add focused tests for allow/deny behavior.

## Technical Plan
1. Add an auth rate-limit config helper:
   - Read `AUTH_RATE_LIMIT_TTL` and `AUTH_RATE_LIMIT_MAX`.
   - Fall back to `RATE_LIMIT_TTL` and `RATE_LIMIT_MAX` when auth-specific values are absent.
2. Implement a focused auth guard:
   - Resolve a stable client key from request IP or forwarding headers.
   - Keep counters per route and client.
   - Reject requests after the configured limit is exceeded.
3. Apply the guard only to auth endpoints that mutate or issue credentials:
   - `login`
   - `refresh`
   - `logout`
4. Add focused unit tests:
   - Requests under the limit are allowed.
   - Requests over the limit are rejected with a `429`.
   - Different routes use isolated counters.

## Notes
- This bullet is intentionally scoped to auth endpoints rather than global application throttling.
- The guard can be upgraded to Redis-backed distributed counters later if horizontal scaling becomes necessary.
- Status endpoints should remain unthrottled to avoid adding friction to simple health checks.

## Execution Record
- [x] Identified the next unchecked Sprint 1 bullet from `todo.md`.
- [x] Reviewed current auth controller, bootstrap, and existing rate-limit env settings.
- [x] Added bullet 9 sprint plan doc under `docs/sprint-1`.
- [x] Added auth-specific rate-limit config with fallback to the existing global rate-limit env values.
- [x] Implemented `AuthRateLimitGuard` and applied it to `login`, `refresh`, and `logout`.
- [x] Added focused guard tests and updated auth controller test wiring.
- [x] Ran focused verification checks (`auth-rate-limit.guard.spec.ts`, `auth.controller.spec.ts`, `pnpm.cmd build`).
