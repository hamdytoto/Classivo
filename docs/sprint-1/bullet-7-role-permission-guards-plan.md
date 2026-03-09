# Sprint 1 - Bullet 7: Role Guard and Permission Guard

## Goal
Implement Sprint 1 TODO bullet 7 by making role- and permission-based route protection enforceable through Nest guards backed by the current Prisma role assignment model.

## Scope
- Finalize `RolesGuard` and `PermissionsGuard` so they can enforce metadata from `@Roles(...)` and `@Permissions(...)`.
- Resolve the authenticated actor from `request.user` populated by `JwtAuthGuard`.
- Load effective roles and permissions from the database instead of depending only on JWT claims.
- Return explicit auth and authorization errors for missing actor context or denied access.
- Add focused unit tests for allow/deny behavior and public-route bypass.

## Technical Plan
1. Keep `JwtAuthGuard` responsible for authentication only:
   - Require a valid access token and attach the actor identity to `request.user`.
   - Do not couple role/permission loading into JWT verification.
2. Upgrade `RolesGuard`:
   - Read required role metadata from `ROLES_KEY`.
   - Reject requests that reach the guard without an authenticated actor.
   - Query Prisma for the caller's assigned role codes and allow when any required role matches.
3. Upgrade `PermissionsGuard`:
   - Read required permission metadata from `PERMISSIONS_KEY`.
   - Resolve effective permissions through the caller's assigned roles and `RolePermission` mappings.
   - Require all declared permissions by default.
4. Wire the guards for reuse:
   - Register and export `RolesGuard` and `PermissionsGuard` from a shared auth-access provider path.
   - Keep the decorators in `src/common/decorators` as the public API for route metadata.
5. Add focused tests:
   - Public route bypass.
   - Missing actor rejection.
   - Role allow/deny behavior.
   - Permission allow/deny behavior.

## Notes
- Access tokens currently do not include role and permission claims at issuance time, so guard decisions must not rely on JWT payload arrays alone.
- Querying Prisma inside the guards keeps authorization aligned with current assignments without forcing token refresh after every role change.
- Applying the guards to specific controllers can be done incrementally after the enforcement primitives are stable.

## Execution Record
- [x] Identified the next unchecked Sprint 1 bullet from `todo.md`.
- [x] Reviewed current guard, decorator, and roles module code.
- [x] Added bullet 7 sprint plan doc under `docs/sprint-1`.
- [x] Upgraded `RolesGuard` to resolve assigned role codes from Prisma and return explicit auth/forbidden errors.
- [x] Upgraded `PermissionsGuard` to resolve effective permissions from Prisma role assignments and return explicit auth/forbidden errors.
- [x] Exported the access-control guards from `AuthModule` for reuse across feature modules.
- [x] Added focused guard unit tests and ran verification checks.
