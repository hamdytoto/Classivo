# Sprint 1 - Bullet 5: Refresh Token Rotation and Revocation

## Goal
Implement Sprint 1 TODO bullet 5 by adding refresh token rotation backed by the existing `Session` model and enforcing token revocation on reuse or logout.

## Scope
- Extend login to issue both an access token and a refresh token.
- Store refresh-token session records in the database with expiry and revocation metadata.
- Add `POST /auth/refresh` to rotate refresh tokens and issue a new access token pair.
- Revoke the previous session token during rotation and reject expired or revoked refresh tokens.
- Avoid storing raw refresh tokens in the database; persist a hash/fingerprint instead.

## Technical Plan
1. Update auth token utilities in `src/common/security`:
   - Add refresh-token config helper using `JWT_REFRESH_SECRET` and `JWT_REFRESH_TTL`.
   - Reuse shared TTL parsing for both access and refresh flows.
2. Adjust persistence for session-backed refresh tokens:
   - Update Prisma `Session` storage to keep a hashed refresh token value instead of the raw token.
   - Preserve `expiresAt`, `revokedAt`, `ipAddress`, and `userAgent` for session lifecycle tracking.
3. Extend `AuthService.login` to:
   - Create a new session row for the authenticated user.
   - Issue an access token plus a refresh token linked to that session.
   - Return refresh-token metadata in the auth response contract.
4. Add `AuthService.refresh` and `POST /auth/refresh` to:
   - Verify the incoming refresh token with `JwtService`.
   - Load the matching active session, reject revoked/expired sessions, and revoke on token mismatch or replay.
   - Rotate the session to a new refresh token and issue a fresh access token pair.
5. Update auth tests to cover:
   - Login issuing both token types.
   - Successful refresh rotation.
   - Rejection for expired, revoked, unknown, or replayed refresh tokens.

## Notes
- Rotation should use a session identifier claim such as `sid` or `sessionId` inside the refresh token to avoid database lookups by raw token value.
- `Session.refreshToken` currently stores a raw value in the schema; implementation should migrate this to a hashed value before enabling refresh issuance.
- Logout and explicit token invalidation are the next bullet, so this work should keep revocation logic reusable instead of coupling it only to refresh.

## Execution Record
- [x] Identified next Sprint 1 bullet from `todo.md`.
- [x] Reviewed current auth flow, env config, and Prisma `Session` model.
- [x] Added bullet 5 sprint plan doc.
- [x] Implement refresh token rotation and revocation.
- [x] Add auth refresh endpoint and tests.
- [x] Run focused checks for auth refresh flow.
