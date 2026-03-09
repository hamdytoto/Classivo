# Sprint 1 - Bullet 8: Password Hashing

## Goal
Implement Sprint 1 TODO bullet 8 by standardizing password hashing across the backend using bcrypt so passwords are never stored or compared in plain text.

## Scope
- Keep bcrypt as the chosen password hashing algorithm for Sprint 1.
- Centralize password hashing and comparison in `src/common/security/hash.utils.ts`.
- Use the shared helper for user creation, user password updates, login verification, and seed data.
- Make hashing configuration explicit through environment variables.
- Add focused tests for hashing behavior and service integration.

## Technical Plan
1. Finalize the shared hash utility:
   - Keep bcrypt-based hashing in one place.
   - Prefer async hashing/comparison helpers over sync calls.
   - Read salt rounds from env with a safe default.
2. Apply the helper consistently:
   - `UsersService.create` should hash incoming passwords through the shared helper.
   - `UsersService.update` should hash password updates through the same helper.
   - `AuthService.login` should verify passwords through the shared compare helper.
   - `prisma/seed.js` should use the same round configuration for the default admin.
3. Add config and tests:
   - Document `SALT_ROUND` in `.env.example`.
   - Add or update unit tests to verify password hashing and comparison behavior.

## Notes
- The project already uses `bcryptjs`; this bullet should consolidate and harden that implementation rather than introduce a second hashing approach.
- Keeping hashing async avoids blocking the event loop during user creation, password updates, and login checks.
- A future hardening pass can switch to `argon2` if operational requirements justify it, but that is outside this Sprint 1 bullet.

## Execution Record
- [x] Identified the next unchecked Sprint 1 bullet from `todo.md`.
- [x] Reviewed current hashing usage across auth, users, and seed flows.
- [x] Added bullet 8 sprint plan doc under `docs/sprint-1`.
- [x] Standardized shared bcrypt hashing and comparison in `src/common/security/hash.utils.ts`.
- [x] Updated auth and users services to use async shared password hashing/comparison.
- [x] Added `SALT_ROUND` to `.env.example` and aligned seed hashing config with the same setting.
- [x] Added focused tests and ran verification checks.
