# Sprint 1 - Bullet 17/18: Forgot Password and Reset Password with Email OTP

## Goal

Implement `POST /auth/forgot-password` and `POST /auth/reset-password` as a production-usable password recovery flow based on a one-time password delivered to the user's email address.

## Scope

- `POST /auth/forgot-password`
  - Public endpoint protected by auth rate limiting.
  - Accept an email address only.
  - If the account exists and is active, generate a short-lived numeric OTP and send it by email.
  - Do not reveal whether the email exists in the system.
  - Return a generic success response.

- `POST /auth/reset-password`
  - Public endpoint protected by auth rate limiting.
  - Accept email, OTP code, and a new password.
  - Validate the OTP against the latest active reset request for that email.
  - Reject missing, expired, reused, or invalid OTP submissions.
  - Hash the new password and revoke all active sessions for the user.
  - Consume the OTP so it cannot be reused.
  - Return `204 No Content`.

## Assumptions

- Sprint 1 keeps recovery email-only even though login also supports phone. Password recovery is explicitly email-based for now.
- The OTP is a 6-digit numeric code and expires after 10 minutes unless configured otherwise.
- Only active users can receive or redeem password reset OTPs.
- The API should not leak user existence from `forgot-password`; it should always return the same response.
- Successful password reset should revoke all sessions for the user, including any currently active refresh-token sessions.
- Only the most recent unconsumed OTP needs to be valid. Older outstanding OTPs should be invalidated when a new one is issued.

## Technical Plan

1. Extend persistence:
   - Add a `PasswordResetOtp` Prisma model linked to `User`.
   - Store email, hashed OTP, expiry, consumption timestamp, and request metadata.
   - Add indexes for user and email lookups.

2. Add request DTOs:
   - `ForgotPasswordDto` with an email field.
   - `ResetPasswordDto` with email, OTP code, and new password.
   - Reuse the existing password validation standard for the new password.

3. Extend `AuthService`:
   - Inject `MailService`.
   - Add `forgotPassword(email, sessionContext?)`:
     - normalize email
     - look up active user by email
     - invalidate prior active OTPs
     - generate a random 6-digit code
     - hash and persist the OTP
     - send the email via `MailService`
     - return a generic response
   - Add `resetPassword(email, otp, newPassword)`:
     - load the latest active OTP record
     - verify not expired and compare the submitted OTP against the stored hash
     - update the user password hash
     - revoke active sessions
     - mark all outstanding OTPs for that user as consumed

4. Update `AuthController`:
   - Add `POST /auth/forgot-password`
   - Add `POST /auth/reset-password`
   - Keep both public and protected by `AuthRateLimitGuard`
   - Return generic success for forgot-password and `204` for reset-password

5. Add tests:
   - Forgot-password sends OTP email for active user
   - Forgot-password stays generic when user does not exist
   - Reset-password succeeds with valid OTP and revokes sessions
   - Reset-password rejects invalid OTP
   - Reset-password rejects expired OTP
   - Reset-password consumes OTPs after success

## Notes

- The OTP should be hashed before persistence; storing raw reset codes is not acceptable.
- Email content should clearly communicate expiry and that the code is one-time use.
- This flow is intentionally simple for Sprint 1 and can later evolve to signed reset tokens, attempt counting, lockouts, or a dedicated audit trail.
- If email delivery fails, the OTP record should not remain active; persistence and mail send should be coordinated carefully.

## Execution Record

- [x] Created sprint plan doc for forgot/reset password with email OTP.
- [x] Added Prisma model and auth/mail wiring.
- [x] Implemented forgot-password and reset-password endpoints.
- [x] Added unit tests for password recovery behavior.
- [x] Ran verification and updated `todo.md`.
