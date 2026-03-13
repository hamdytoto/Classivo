# Sprint 1 - Bullet 20: Role User Assignment Inspection

## Goal

Implement the next recommended Sprint 1 endpoint by adding `GET /roles/:id/users` so admins and support flows can inspect which users are assigned to a specific role.

## Scope

- `GET /roles/:id/users`
  - Protected consistently with the existing `roles` module.
  - Accept a role id path parameter.
  - Load the role and its assigned users from Prisma.
  - Return a lightweight inspection payload with the role id and assigned user entries.
  - Return `404` when the role does not exist.

## Assumptions

- This endpoint is an inspection endpoint for direct role assignments only.
- The response should include useful user summary fields plus the assignment timestamp.
- Sprint 1 keeps the current roles-module protection model and does not add new permission gating in this bullet.

## Technical Plan

1. Extend `RolesService` with a `findUsersForRole(roleId: string)` method that:
   - loads the role by id with nested user assignments
   - throws `NotFoundException` if the role does not exist
   - maps assignments into a stable response shape
2. Update `RolesController`:
   - add `GET /roles/:id/users`
   - place the route before `GET /roles/:id`
   - call the new service method
3. Add focused tests for:
   - successful role-user inspection
   - missing role returns `404`
   - controller delegates the route parameter correctly
4. Update Sprint 1 tracking in `todo.md` after verification passes.

## Execution Record

- [x] Created sprint plan doc for bullet 20.
- [x] Implemented `GET /roles/:id/users`.
- [x] Added controller and service tests for role-user inspection.
- [x] Ran focused verification and updated `todo.md`.
