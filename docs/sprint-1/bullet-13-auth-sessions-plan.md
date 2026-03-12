# Sprint 1 - Bullet 13: Auth Sessions

## Goal

Implement the next recommended Sprint 1 endpoint by adding `GET /auth/sessions` to list the active refresh-token sessions for the authenticated user.

## Scope

- `GET /auth/sessions`
  - Protected by JWT authentication.
  - Resolve the caller from the authenticated access token subject.
  - Load the caller's non-revoked sessions from Prisma.
  - Return safe session metadata only, without refresh-token hashes.

## Assumptions

- Sprint 1 session listing should show active sessions only, meaning `revokedAt` is `null`.
- Session metadata is currently limited to id, IP, user agent, expiry, and timestamps.
- Ordering should prioritize the newest session activity first to make current devices easier to inspect.

## Technical Plan

1. Extend `AuthSessionService` or `AuthService` with a session-list lookup that:
   - accepts the authenticated user id
   - queries active sessions for that user
   - orders them by newest update or creation timestamp
   - selects only safe fields
2. Update `AuthController`:
   - add `GET /auth/sessions`
   - protect it with `JwtAuthGuard`
   - reuse the existing actor extraction pattern
3. Add controller and service tests for:
   - successful active-session listing
   - missing authenticated actor in the request
   - empty session list behavior
4. Update Sprint 1 tracking in `todo.md` after verification passes.

## Execution Record

- [x] Created sprint plan doc for bullet 13.
- [x] Implemented `GET /auth/sessions`.
- [x] Added controller/service tests for session listing.
- [x] Run focused verification and updated `todo.md`.
