# Sprint 1 - Bullet 18: User Roles Inspection

## Goal

Implement the next recommended Sprint 1 endpoint by adding `GET /users/:id/roles` so admins and support flows can inspect the roles directly assigned to a user.

## Scope

- `GET /users/:id/roles`
  - Protected by JWT authentication, consistent with the rest of the `users` module.
  - Accept a user id path parameter.
  - Load the user and their direct role assignments from Prisma.
  - Return a lightweight inspection payload with the user id and assigned role entries.
  - Return `404` when the user does not exist.

## Assumptions

- This endpoint is an inspection endpoint for direct role assignments only, not effective permissions.
- The response should include role metadata useful for admin UIs: role id, code, name, and assignment timestamp.
- Sprint 1 keeps the current users-module protection model (`JwtAuthGuard`) and does not add new permission gating in this bullet.

## Technical Plan

1. Extend `UsersService` with a `findRoles(userId: string)` method that:
   - loads the user by id with nested `userRole` assignments
   - throws `NotFoundException` if the user does not exist
   - maps assignments into a stable response shape
2. Update `UsersController`:
   - add `GET /users/:id/roles`
   - place the route before `GET /users/:id` to avoid route shadowing
   - call the new service method
3. Add focused tests for:
   - successful role inspection
   - missing user returns `404`
   - controller delegates the route parameter correctly
4. Update Sprint 1 tracking in `todo.md` after verification passes.

## Execution Record

- [x] Created sprint plan doc for bullet 18.
- [x] Implemented `GET /users/:id/roles`.
- [x] Added controller and service tests for role inspection.
- [x] Ran focused verification and updated `todo.md`.
