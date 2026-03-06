# Classivo Tenancy Decision

Date decided: 2026-03-06
Decision owner: Backend team
Status: Approved

## Decision
Classivo will use a **multi-tenant (school-scoped)** backend model from day one.

## Why this decision
- Product direction targets multiple schools, not a single institution.
- Retrofitting tenancy later is high-risk and expensive.
- Early tenant boundaries improve data safety and permission clarity.

## Implementation Rules
- Every school-owned domain entity must include `schoolId`.
- Every authenticated request must resolve active tenant context.
- Repository/service queries must always scope by `schoolId`.
- Cross-tenant reads/writes are forbidden by default.
- SuperAdmin may access multi-tenant views explicitly; all other roles are tenant-scoped.

## Data Model Impact (MVP)
Add or enforce `schoolId` on at least:
- users (if user belongs to one tenant account) or user-tenant link table
- classes
- courses
- enrollments
- lessons
- assignments
- submissions
- grades
- attendance records
- announcements
- notifications

## API and Auth Impact
- JWT payload should include tenant claims (`schoolId` or tenant mapping reference).
- Guards/interceptors should verify tenant scope before handler logic.
- Public/admin endpoints with cross-tenant access must be explicitly declared.

## Operational Guardrails
- Add tests for tenant isolation on critical endpoints.
- Add logging fields: `requestId`, `actorId`, `schoolId`.
- Seed scripts must create tenant-scoped baseline data.

## Non-Goals for MVP
- No per-tenant custom schema/database split in MVP.
- Use single PostgreSQL database with strict row-level app-level scoping.

## Revisit Trigger
Revisit this architecture only when scale/compliance requires database-level tenant isolation.
