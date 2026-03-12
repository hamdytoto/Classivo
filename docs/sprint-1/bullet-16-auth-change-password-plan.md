# Sprint 1 - Bullet 16: Change Password

## Goal

Implement the next recommended Sprint 1 endpoint by adding `POST /auth/change-password` so an authenticated user can rotate their password with their current password as verification.

## Scope

- `POST /auth/change-password`
  - Protected by JWT authentication.
  - Resolve the caller from the authenticated access token subject.
  - Accept the current (old) password and new password in the request body.
  - Verify the old password matches the user's stored hash.
  - Hash the new password and update the user record.
  - Invalidate all active sessions after successful password change (force re-login on all devices).
  - Return `204 No Content`.

## Assumptions

- Users may only change their own password; no admin override for this endpoint.
- Password verification is required (old password) to prevent accidental changes or session hijacking.
- Changing password revokes all active sessions to enforce fresh authentication across all devices.
- Password validation rules are the same as registration (minimum length, complexity, etc.) if any exist.
- The operation is idempotent in behavior: if the API is called twice with the same new password, the second call should succeed and revoke sessions again (no error).

## Technical Plan

1. Add a change-password request DTO in `src/modules/auth/dto`:
   - Accept `currentPassword` as a required string.
   - Accept `newPassword` as a required string.
   - Apply the same password validation as login/registration DTOs.

2. Extend `AuthService` with `changePassword(userId: string, currentPassword: string, newPassword: string)`:
   - Load the user's account by user id.
   - Verify the current password against the stored hash.
   - Hash the new password.
   - Update the user record with the new password hash (atomically).
   - Revoke all active sessions for the user (except the one calling this endpoint, or revoke all).
   - Return void or a success response.

3. Update `AuthController`:
   - Add `POST /auth/change-password` endpoint.
   - Protect it with `JwtAuthGuard`.
   - Extract the authenticated user id from the access token.
   - Call the service with the required parameters.
   - Return `204 No Content`.

4. Add focused tests for:
   - Successful password change revokes all sessions.
   - Invalid current password is rejected.
   - Missing or invalid authenticated actor returns 401.
   - New password validation failures are rejected (if validation exists).
   - Password change is idempotent (calling twice with same new password succeeds both times).
   - Refresh attempts with old JWT after password change are blocked.

## Notes

- Consider whether to revoke all sessions including the current one, or preserve the current session. Revoking all is more secure but may require the user to re-login immediately.
- The password change operation should be atomic: update password and revoke sessions in one transaction if possible.
- Audit logging should record password changes as a sensitive event.
- This endpoint complements forgot-password and reset-password flows for full password management.

## Execution Record

- [ ] Created sprint plan doc for bullet 16.
- [ ] Added change-password DTO and updated AuthService.
- [ ] Implemented `POST /auth/change-password` in AuthController.
- [ ] Added unit tests for change-password behavior.
- [ ] Run focused verification and update `todo.md`.
