# Sprint 1 - Bullet 11: Register School

## Goal

Implement the first recommended Sprint 1 endpoint by adding `POST /auth/register-school` to bootstrap a school and its initial owner/admin account.

## Scope

- `POST /auth/register-school`
  - Public endpoint, protected by auth rate limiting.
  - Accept school identity plus owner account details.
  - Create a `School` record with a unique code.
  - Create the owner user under that school.
  - Assign the seeded `SCHOOL_ADMIN` role to that user.
  - Create an authenticated session and return access/refresh tokens.

## Assumptions

- Sprint 1 supports school-owner onboarding, not open registration for arbitrary teacher/student/parent accounts.
- The initial owner role is `SCHOOL_ADMIN`.
- Baseline roles are already seeded before this endpoint is used.
- Full school administration CRUD remains out of scope for Sprint 1.

## Technical Plan

1. Add `RegisterSchoolDto` with validation rules for:
   - `schoolName`
   - `schoolCode`
   - owner `firstName`
   - owner `lastName`
   - owner `email`
   - optional owner `phone`
   - `password`
2. Extend `AuthService` with `registerSchool`:
   - Normalize the school code.
   - Hash the owner password.
   - Load the seeded `SCHOOL_ADMIN` role.
   - Use a Prisma transaction to create school, owner user, owner role assignment, and initial refresh-token session atomically.
   - Return safe school/user data plus auth tokens.
3. Update `AuthController`:
   - Add `POST /auth/register-school`.
   - Mark it `@Public()` and `@UseGuards(AuthRateLimitGuard)`.
   - Reuse existing session context extraction for IP/user-agent capture.
4. Add controller and service tests for:
   - successful school bootstrap
   - duplicate school/user conflicts bubbling correctly
   - missing baseline role failure
5. Update Sprint 1 tracking in `todo.md` once implementation passes verification.

## Execution Record

- [x] Created sprint plan doc for bullet 11.
- [x] Implemented `POST /auth/register-school`.
- [x] Added controller/service tests for school bootstrap flow.
- [x] Run focused lint/test verification.
