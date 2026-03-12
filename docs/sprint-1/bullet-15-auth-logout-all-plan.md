# Sprint 1 - Bullet 15: Logout All Sessions

## Goal

Implement the next recommended Sprint 1 endpoint by adding `POST /auth/logout-all` so an authenticated user can revoke all active sessions except the current one, or optionally all sessions including the current one.

## Scope

- `POST /auth/logout-all`
  - Protected by JWT authentication.
  - Resolve the caller from the authenticated access token subject.
  - Accept an optional `includeCurrent` boolean flag in the request body (default: false).
  - If `includeCurrent` is false: revoke all non-current sessions, preserve the current session so the user stays logged in.
  - If `includeCurrent` is true: revoke all sessions including the current one, requiring fresh login.
  - Return the count of revoked sessions in the response.

## Assumptions

- The current session is identified by matching the session id encoded in the access token's `sid` claim.
- "Active" means `revokedAt` is `null`.
- All sessions belong to the authenticated user; cross-user access is not a concern due to JWT protection.
- The API should always succeed even if no sessions exist to revoke (idempotent).

## Technical Plan

1. Add a logout-all request DTO in `src/modules/auth/dto`:
   - Accept an optional `includeCurrent` boolean (default: false).
   - Keep the request contract simple and focused.

2. Extend `AuthService` with `logoutAll(userId: string, excludeSessionId?: string)`:
   - Accept the authenticated user id and optionally the current session id to exclude.
   - Query all active sessions for the user.
   - If `excludeSessionId` is provided, exclude that session from revocation.
   - Update all matched sessions, setting `revokedAt = now()`.
   - Return the count of revoked sessions.

3. Update `AuthController`:
   - Add `POST /auth/logout-all` endpoint.
   - Protect it with `JwtAuthGuard`.
   - Extract the authenticated user id and current session id from the access token (sid claim).
   - Parse the optional `includeCurrent` flag from the request body.
   - Call the service with the appropriate `excludeSessionId` (null if includeCurrent is true, current session id if false).
   - Return a response with the revoked session count.

4. Add focused tests for:
   - Logout all excluding current session: all other sessions are revoked, current session remains active.
   - Logout all including current session: all sessions are revoked, including the current one.
   - Empty session list: operation succeeds with count = 0.
   - Subsequent token refresh is blocked for revoked sessions.
   - Missing authenticated actor returns 401.

## Notes

- The `sid` claim must be present in the access token JWT payload for this endpoint to work correctly.
- Consider the user experience: after logout-all with `includeCurrent = true`, the user's current JWT will become invalid on the next refresh.
- This endpoint complements `DELETE /auth/sessions/:sessionId` by offering bulk revocation.
- Returning `{ revokedCount: number }` is clear and actionable.

## Execution Record

- [x] Created sprint plan doc for bullet 15.
- [x] Added logout-all DTO and updated AuthService.
- [x] Implemented `POST /auth/logout-all` in AuthController.
- [x] Added unit tests for logout-all behavior.
- [x] Run focused verification and update `todo.md`.
