# Sprint 1 - Bullet 3: Auth Login (email/phone + password)

## Goal
Implement Sprint 1 TODO bullet 3 by replacing the auth placeholder login endpoint with a working credentials login flow using email or phone plus password.

## Scope
- `POST /auth/login`
  - Accept either `email` or `phone` with `password`.
  - Validate credentials against persisted users.
  - Update `lastLoginAt` on successful authentication.
  - Return authenticated user payload (without password hash).

## Technical Plan
1. Add auth login DTO with validation rules for email/phone/password.
2. Implement Prisma-backed `AuthService.login`:
   - Validate identifier inputs (exactly one of email/phone).
   - Load user by identifier.
   - Verify password hash.
   - Reject invalid credentials with `UnauthorizedException`.
   - Update `lastLoginAt` and return safe user fields.
3. Update `AuthController` to use DTO and Swagger docs.
4. Import `PrismaModule` in `AuthModule`.
5. Add/refresh auth module unit tests for happy-path and failure cases.

## Execution Record
- [x] Created sprint plan doc for bullet 3.
- [x] Implemented auth login endpoint with email/phone + password validation.
- [x] Added auth tests for credential validation and successful login behavior.
- [x] Run focused build check (`pnpm.cmd build`).
- [ ] Run focused Jest checks (`pnpm.cmd test -- auth`) - blocked in current sandbox by `spawn EPERM`.
