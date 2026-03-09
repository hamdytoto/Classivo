# Sprint 1 - Bullet 6: Logout Endpoint with Token Invalidation

## Goal
Implement Sprint 1 TODO bullet 6 by adding a logout endpoint that invalidates the caller's active refresh-token session so it cannot be used again for token refresh.

## Scope
- Add an authenticated logout flow under `POST /auth/logout`.
- Accept the refresh token to identify which session must be revoked.
- Mark the matching `Session` record as revoked instead of deleting it.
- Reject logout attempts for missing, invalid, expired, or already revoked refresh tokens with a consistent auth error contract.
- Reuse the same revocation rules already introduced for refresh token rotation.

## Technical Plan
1. Add a logout request DTO in `src/modules/auth/dto`:
   - Accept `refreshToken` as a required string payload.
   - Keep the request contract aligned with `POST /auth/refresh` for session-targeted token operations.
2. Extend `AuthService` with `logout(refreshToken: string)`:
   - Reuse refresh-token verification to extract the `sid` session claim.
   - Load the matching `Session` row and verify it belongs to the token subject.
   - Revoke the session by setting `revokedAt` when the session is active.
3. Harden invalidation behavior:
   - Treat token mismatch, unknown session, or subject/session mismatch as unauthorized.
   - Treat already revoked sessions as idempotent success or a documented auth error, and choose one behavior explicitly before implementation.
   - Revoke expired sessions as part of cleanup when they are encountered.
4. Add `POST /auth/logout` in `AuthController`:
   - Wire the new DTO to the auth service.
   - Decide whether the route is protected by access JWT, refresh token payload only, or both; prefer access JWT plus refresh token body for explicit caller identity.
5. Add focused tests for the logout flow:
   - Successful logout revokes the session and blocks later refresh attempts.
   - Invalid, expired, unknown, and already revoked refresh tokens follow the expected error behavior.
   - Logout only revokes the targeted session and leaves other user sessions active.

## Notes
- The current auth design stores one hashed refresh token per `Session`, so logout should invalidate by session id rather than by raw token lookup.
- This bullet should reuse `verifyRefreshToken` and `revokeSession` where possible to avoid duplicating revocation logic.
- If `POST /auth/logout` is protected by an access token, the implementation should confirm the access-token subject matches the refresh-token subject before revoking the session.
- Returning `204 No Content` is the cleanest API contract if the endpoint does not need to return token metadata.

## Execution Record
- [x] Identified the next unchecked Sprint 1 bullet from `todo.md`.
- [x] Reviewed the existing Sprint 1 plan docs for naming and structure.
- [x] Reviewed the current auth controller, service, DTOs, and Prisma `Session` model.
- [x] Added bullet 6 sprint plan doc under `docs/sprint-1`.
- [x] Added `POST /auth/logout` with JWT access-guard protection and session invalidation.
- [x] Added logout DTO and service logic for subject-checked refresh-session revocation.
- [x] Added focused auth unit tests for logout and revoked-session behavior.
- [x] Ran focused checks (`pnpm.cmd build`, auth service spec, auth controller spec).
