# Sprint 1 - Bullet 14: Revoke Specific Session

## Goal

Implement the next recommended Sprint 1 endpoint by adding `DELETE /auth/sessions/:sessionId` so an authenticated user can revoke a specific device session.

## Scope

- `DELETE /auth/sessions/:sessionId`
  - Protected by JWT authentication.
  - Resolve the caller from the authenticated access token subject.
  - Load the targeted session from Prisma.
  - Revoke it only if it belongs to the current user.
  - Return `204 No Content`.

## Assumptions

- Users may revoke their current session or another active device session.
- If the session does not exist or belongs to another user, the API should not leak ownership details.
- Revoking an already-revoked session should be idempotent.

## Technical Plan

1. Extend `AuthService` with targeted session revocation logic that:
   - accepts the session id and authenticated user id
   - loads the session by id
   - rejects missing or foreign-owned sessions with a not-found response
   - revokes the session if it is still active
2. Update `AuthController`:
   - add `DELETE /auth/sessions/:sessionId`
   - protect it with `JwtAuthGuard`
   - return `204`
3. Add controller and service tests for:
   - successful session revocation
   - missing authenticated actor in the request
   - missing or foreign-owned session
   - already revoked session
4. Update Sprint 1 tracking in `todo.md` after verification passes.

## Execution Record

- [x] Created sprint plan doc for bullet 14.
- [x] Implemented `DELETE /auth/sessions/:sessionId`.
- [x] Added controller/service tests for targeted session revocation.
- [x] Run focused verification and updated `todo.md`.
