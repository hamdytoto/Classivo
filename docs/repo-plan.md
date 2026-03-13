# Repository Usage Rules for This Project

## Summary
Use a simple three-layer rule for this codebase:
- `controllers` handle HTTP only
- `services` handle business use cases
- `repositories` handle Prisma/database access

Keep repositories thin. Do not use a generic base repository as the default. Introduce repositories only where queries are non-trivial, reused, transactional, or shared across services/guards.

## Layer Rules
- Controllers:
  - read DTOs, route params, auth context, and request metadata
  - call one service method per use case
  - do not call Prisma or repositories directly
- Services:
  - own business logic, validation flow, permissions flow, orchestration, transactions, external APIs, token handling, and exception decisions
  - call repositories for persistence
  - may coordinate multiple repositories in one use case
  - should not build large Prisma queries inline
- Repositories:
  - own Prisma calls, `where` clauses, `select/include`, ordering, pagination, and persistence-focused helper queries
  - return data or `null`, not HTTP/Nest exceptions
  - should not contain email sending, token generation, DTO validation, or cross-module business rules

## When To Create a Repository
Create a repository when one or more of these are true:
- a service has more than 2-3 Prisma queries for one model/aggregate
- the same Prisma query shape or `select` is reused
- a guard/interceptor/service needs the same DB read
- transactions involve repeated persistence steps
- query complexity is distracting from business logic
- tests are becoming hard because services mock too much Prisma detail

Do not create a repository yet when:
- the module is tiny and has only one straightforward query
- the query is unlikely to be reused
- the abstraction would just rename `prisma.model.findUnique()` without improving clarity

## Project-Specific Defaults
- Start with repositories in `auth`, then `users`, then `roles`.
- Add a focused read repository for authorization checks used by `RolesGuard` and `PermissionsGuard`.
- Keep `AuthTokenService`, `AuthIdentityService`, `AuthPasswordResetService`, and `MailService` as services/helpers, not repositories.
- Keep Prisma transactions orchestrated in services when multiple repositories participate.
- Let repositories accept a Prisma transaction client or repository-scoped transaction context for transactional flows.
- Move Prisma `select` constants close to the repository that owns them.

## Recommended Repository Shapes
- `UserRepository`
  - auth login lookup
  - authenticated profile lookup
  - password update
  - school existence/user existence checks if still user-related
- `SessionRepository`
  - create/find/rotate/revoke/list sessions
- `PasswordResetOtpRepository`
  - create OTP
  - find latest active OTP by email
  - consume/delete OTP records
- `RoleRepository`
  - baseline role lookup
  - role existence checks
- `AuthorizationReadRepository`
  - get role codes for user
  - get permission codes for user

## Testing Rules
- Repository tests verify query behavior and returned shapes.
- Service tests mock repositories, not `PrismaService`.
- Guard tests mock authorization read repositories, not Prisma.
- Keep one small set of integration/e2e tests to ensure repository + Prisma wiring still works together.

## Assumptions and Defaults
- Prisma remains the ORM and source of truth.
- Repository pattern is for maintainability, not for swapping ORMs.
- Thin repositories are preferred over rich domain repositories or generic CRUD inheritance.
- The goal is cleaner boundaries and better testability, not maximum abstraction.
