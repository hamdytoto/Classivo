# Sprint 1 - Bullet 2: Roles + Permissions Entities

## Goal
Implement Sprint 1 TODO bullet 2 by turning the placeholder `roles` module into a working roles and permissions entity module.

## Scope
- Role entity endpoints:
  - `POST /roles`
  - `GET /roles`
  - `GET /roles/:id`
  - `PATCH /roles/:id`
- Permission entity endpoints:
  - `POST /roles/permissions`
  - `GET /roles/permissions`
  - `GET /roles/permissions/:id`
  - `PATCH /roles/permissions/:id`
- Relation endpoints:
  - `POST /roles/:roleId/permissions/:permissionId`
  - `DELETE /roles/:roleId/permissions/:permissionId`
  - `POST /roles/users/:userId/:roleId`
  - `DELETE /roles/users/:userId/:roleId`

## Technical Plan
1. Add DTOs for create/update roles and permissions.
2. Implement Prisma-backed `RolesService` for CRUD + relation operations.
3. Replace placeholder controller endpoints with real APIs and Swagger metadata.
4. Map Prisma errors to clean API errors (`P2002`, `P2025`, `P2003`).
5. Update unit tests to align with the new service/controller contract.

## Execution Record
- [x] Created sprint plan doc for bullet 2.
- [x] Implemented roles + permissions entity endpoints.
- [x] Implemented role-permission and user-role relation operations.
- [x] Updated tests for roles module.
- [x] Run focused checks (`jest roles`, `build`).
