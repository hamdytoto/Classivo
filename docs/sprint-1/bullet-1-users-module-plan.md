# Sprint 1 - Bullet 1: Users Module (create/find/update/me)

## Goal
Implement the first Sprint 1 TODO item: `users` module endpoints for create, find, update, and current user profile retrieval.

## Scope
- `POST /users` create user
- `GET /users` find/list users with basic filters + pagination
- `GET /users/:id` find user by id
- `PATCH /users/:id` update user
- `GET /users/me` get current user profile

## Technical Plan
1. Add shared Prisma integration:
   - Create `PrismaService` and `PrismaModule` in `src/common/prisma`.
   - Import `PrismaModule` in `AppModule`.
2. Define users DTOs:
   - `CreateUserDto`
   - `UpdateUserDto`
   - `FindUsersQueryDto`
3. Implement `UsersService`:
   - Persist/fetch users through Prisma.
   - Hash passwords using `bcryptjs`.
   - Handle common Prisma errors (`P2002`, `P2025`) as API exceptions.
4. Implement `UsersController`:
   - Expose CRUD endpoints and `me`.
   - Document endpoints with Swagger decorators.
5. Add/adjust module tests for compile-level confidence.

## Execution Record
- [x] Created `docs/sprint-1/` folder and this bullet plan.
- [x] Added Prisma shared service/module.
- [x] Implemented users DTOs and endpoint/service logic.
- [x] Added `GET /users/me` using authenticated request user with `x-user-id` fallback.
- [x] Updated TODO checklist for Sprint 1 bullet 1 after implementation.
- [x] Run automated checks for this scope (`jest users`, `build`) and confirm green.

## Notes
- `GET /users/me` currently resolves user id from:
  1. `request.user.id | userId | sub` (when auth guard is present)
  2. `x-user-id` header fallback for pre-auth integration testing
- Once auth/JWT is fully implemented in later Sprint 1 bullets, the header fallback can be removed.
