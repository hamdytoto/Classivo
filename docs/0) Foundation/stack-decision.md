# Classivo Core Stack Decision

Date decided: 2026-03-06
Decision owner: Backend team
Status: Approved

## Finalized Core Stack (MVP)
- Framework: NestJS
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Cache/Queue backend: Redis
- Background jobs: BullMQ
- Object storage: S3-compatible storage

## Supporting Runtime/Platform
- API style: REST
- Auth: JWT access token + refresh token
- API docs: Swagger/OpenAPI
- Validation: class-validator + class-transformer
- Containerization: Docker
- Testing: Jest

## Why this stack
- Fast delivery for modular monolith MVP.
- Strong TypeScript developer experience with Prisma.
- Reliable async processing via Redis + BullMQ.
- Production-standard file handling with S3 signed URLs.

## Explicit MVP Constraints
- No microservices in MVP.
- No GraphQL in MVP.
- No additional databases beyond PostgreSQL.
- No vendor lock-in features that block S3-compatible providers.

## Version and Upgrade Policy
- Pin major versions for all core dependencies.
- Allow minor/patch updates after CI passes.
- Revisit major upgrades only during planned maintenance windows.

## Required Environment Variables (minimum)
- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL`
- `JWT_REFRESH_TTL`
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

## Follow-up Implementation Notes
- Keep persistence abstractions simple; avoid premature repository complexity.
- Add queue names/constants centrally to avoid drift.
- Keep file metadata in PostgreSQL and binaries in object storage only.
