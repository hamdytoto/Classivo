# Sprint 1 - Bullet 19: User Effective Permissions Inspection

## Goal

Implement the next recommended Sprint 1 endpoint by adding `GET /users/:id/permissions` so admins and support flows can inspect a user's effective permissions as resolved through assigned roles.

## Scope

- `GET /users/:id/permissions`
  - Protected by JWT authentication, consistent with the rest of the `users` module.
  - Accept a user id path parameter.
  - Load the user and resolve unique permissions inherited through role assignments.
  - Return a lightweight inspection payload with the user id and effective permission entries.
  - Return `404` when the user does not exist.

## Assumptions

- This endpoint returns effective permissions, not direct assignments, because permissions are modeled through roles in the current schema.
- Duplicate permissions inherited from multiple roles should be returned once.
- Each permission entry should include the roles that grant it to make inspection useful for admin/debugging scenarios.
- Sprint 1 keeps the current users-module protection model (`JwtAuthGuard`) and does not add new permission gating in this bullet.

## Technical Plan

1. Extend `UsersService` with a `findPermissions(userId: string)` method that:
   - loads the user by id with nested role and permission relations
   - throws `NotFoundException` if the user does not exist
   - flattens permissions into unique entries grouped by granting roles
2. Update `UsersController`:
   - add `GET /users/:id/permissions`
   - place the route before `GET /users/:id`
   - call the new service method
3. Add focused tests for:
   - successful effective-permission inspection
   - duplicate permissions are de-duplicated and grouped by roles
   - missing user returns `404`
   - controller delegates the route parameter correctly
4. Update Sprint 1 tracking in `todo.md` after verification passes.

## Execution Record

- [x] Created sprint plan doc for bullet 19.
- [x] Implemented `GET /users/:id/permissions`.
- [x] Added controller and service tests for permission inspection.
- [x] Ran focused verification and updated `todo.md`.
