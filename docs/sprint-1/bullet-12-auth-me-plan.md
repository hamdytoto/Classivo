# Sprint 1 - Bullet 12: Auth Me

## Goal

Implement the next recommended Sprint 1 endpoint by adding `GET /auth/me` to return the authenticated actor with roles and effective permissions resolved from the current database state.

## Scope

- `GET /auth/me`
  - Protected by JWT authentication.
  - Resolve the caller from the authenticated access token subject.
  - Load the current user record from Prisma.
  - Resolve assigned role codes and effective permission codes through role assignments.
  - Return a safe auth profile payload without password or session secrets.

## Assumptions

- Sprint 1 should expose an auth-focused self-profile endpoint in addition to the existing `users/me` profile route.
- Role and permission resolution should come from the database so revoked assignments are reflected immediately.
- Duplicate permissions inherited through multiple roles should be returned once.

## Technical Plan

1. Extend `AuthService` with a profile lookup method that:
   - accepts the authenticated user id
   - loads the user plus nested role/permission relations
   - throws a not-found response if the user no longer exists
   - flattens roles and permissions into string arrays
2. Update `AuthController`:
   - add `GET /auth/me`
   - protect it with `JwtAuthGuard`
   - reuse the existing actor extraction pattern used by logout
3. Add controller and service tests for:
   - successful authenticated profile lookup
   - missing authenticated actor in the request
   - missing user in the database
4. Update Sprint 1 tracking in `todo.md` after verification passes.

## Execution Record

- [x] Created sprint plan doc for bullet 12.
- [x] Implemented `GET /auth/me`.
- [x] Added controller/service tests for auth profile lookup.
- [x] Run focused verification and updated `todo.md`.
