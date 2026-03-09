# Classivo Backend TODO

## 0) Foundation
- [x] Define product scope for MVP only (lock Phase 1) -> see `docs/mvp-scope.md`
- [x] Decide tenancy model: single-school or multi-tenant (`schoolId` scoped) -> multi-tenant, see `docs/tenancy-decision.md`
- [x] Finalize core stack: NestJS + Prisma + PostgreSQL + Redis + BullMQ + S3 -> see `docs/stack-decision.md`
- [x] Create `.env.example` and environment variable policy -> see `.env.example` and `docs/env-policy.md`
- [x] Enable global validation pipe and standardized error format -> see `src/main.ts` and `src/common/filters/global-exception.filter.ts`
- [x] Configure Swagger/OpenAPI and tag by module -> see `src/main.ts`, `src/app.controller.ts`, `docs/swagger.md`
- [x] Add API versioning strategy (`/v1`) -> see `src/main.ts`, `src/common/config/versioning.config.ts`, `docs/api-versioning.md`
- [x] Set up structured logging (request id, actor id, school id) -> see `src/common/middleware/request-context.middleware.ts`, `src/common/interceptors/structured-logging.interceptor.ts`, `docs/structured-logging.md`
- [x] Add health check endpoint (`/health`) -> see `src/health/health.controller.ts`, `src/main.ts`, `docs/health.md`

## 1) Project Setup
- [x] Bootstrap module folders under `src/modules/*` -> created base domain folders under `src/modules`
- [x] Create `common` primitives (guards, decorators, filters, interceptors) -> see `src/common/decorators`, `src/common/guards`, `src/common/filters`, `src/common/interceptors`
- [x] Set up Prisma schema + migrations folder -> see `prisma/schema.prisma` and `prisma/migrations/`
- [x] Add seed strategy (roles, permissions, default admin) -> see `prisma/seed.js` and `docs/seed-strategy.md`
- [x] Add Redis config and connection manager -> see `src/common/config/redis.config.ts` and `src/common/redis/*`
- [x] Add BullMQ base queue module -> see `src/common/queue/*`
- [x] Add S3 client abstraction module -> see `src/common/config/storage.config.ts` and `src/common/storage/*`
- [x] Add Dockerfile + docker-compose for local dev (api, postgres, redis) -> see `Dockerfile` and `docker-compose.yml`
- [x] Add CI checks (lint, test, build) -> see `.github/workflows/ci.yml` and `package.json`

## 2) Auth + Access (Sprint 1)
- [x] Implement `users` module (create/find/update/me) -> see `src/modules/users/*`, `src/common/prisma/*`, `docs/sprint-1/bullet-1-users-module-plan.md`
- [x] Implement `roles` + `permissions` entities -> see `src/modules/roles/*`, `docs/sprint-1/bullet-2-roles-permissions-plan.md`
- [x] Implement `auth/login` (email/phone + password) -> see `src/modules/auth/*`, `docs/sprint-1/bullet-3-auth-login-plan.md`
- [x] Implement JWT access token issuance -> see `src/common/security/jwt.utils.ts`, `src/modules/auth/auth.service.ts`, `docs/sprint-1/bullet-4-jwt-access-token-plan.md`
- [x] Implement refresh token rotation/revocation -> see `src/modules/auth/*`, `prisma/schema.prisma`, `docs/sprint-1/bullet-5-refresh-token-rotation-plan.md`
- [x] Implement logout endpoint with token invalidation -> see `src/modules/auth/*`, `docs/sprint-1/bullet-6-logout-token-invalidation-plan.md`
- [ ] Implement role guard and permission guard
- [ ] Add password hashing (argon2 or bcrypt)
- [ ] Add auth rate limiting
- [ ] Seed baseline roles: SuperAdmin, SchoolAdmin, Teacher, Student, Parent, Support

## 3) Schools, Courses, Classes, Enrollments (Sprint 2)
- [ ] Implement `schools` module
- [ ] Implement `classes` module
- [ ] Implement `courses` module
- [ ] Implement `course-teacher` assignment logic
- [ ] Implement `enrollments` module
- [ ] Enforce authorization boundaries (teacher/class/school scope)
- [ ] Add list/detail endpoints with pagination and filtering

## 4) Lessons, Materials, Files (Sprint 3)
- [ ] Implement `lessons` module
- [ ] Implement `materials` support for lesson sections/topics
- [ ] Implement `files` upload metadata model
- [ ] Add S3 upload flow + signed URL generation
- [ ] Add file validation (size/type)
- [ ] Restrict file access by role + course membership

## 5) Assignments, Submissions, Grades (Sprint 4)
- [ ] Implement `assignments` module (create/publish/deadline)
- [ ] Implement `submissions` module (text/files/status)
- [ ] Implement grading basics in `grades` module
- [ ] Add feedback model and teacher comments
- [ ] Add late-submission rules and status transitions
- [ ] Add endpoints for teacher grading workflow

## 6) Quizzes and Exams (Sprint 5)
- [ ] Implement `quizzes` module
- [ ] Implement question and choice models
- [ ] Implement quiz submission and auto-evaluation basics
- [ ] Implement `exams` module structure
- [ ] Add exam result calculation rules
- [ ] Add student result retrieval endpoints

## 7) Attendance, Schedule, Announcements (Sprint 6)
- [ ] Implement `attendance` module
- [ ] Add class attendance marking endpoint
- [ ] Add attendance summary query endpoints
- [ ] Implement `schedule` module
- [ ] Implement `announcements` module
- [ ] Scope schedule and announcements by class/course/school

## 8) Notifications + Realtime (Sprint 7)
- [ ] Implement `notifications` module (in-app)
- [ ] Add email queue + worker (BullMQ)
- [ ] Create websocket gateway for real-time notifications
- [ ] Add delivery status tracking
- [ ] Add notification preferences (optional MVP+)

## 9) Reports + Audit + Hardening (Sprint 8)
- [ ] Implement `reports` module (student progress, attendance, completion)
- [ ] Move heavy reports to background jobs
- [ ] Add caching for frequent report queries
- [ ] Implement `audit` log model and middleware hooks
- [ ] Add critical event audit trails (auth, role change, grading)
- [ ] Run performance profiling on top endpoints
- [ ] Add missing integration tests for critical flows

## 10) Cross-Cutting Security Checklist
- [ ] Helmet enabled
- [ ] CORS allowlist configured
- [ ] DTO validation for all write endpoints
- [ ] Input sanitization for user-generated content
- [ ] File malware scanning pipeline (or queue placeholder)
- [ ] Admin session/IP/device tracking
- [ ] Secrets management for all environments

## 11) Testing Checklist
- [ ] Unit tests for services with core business logic
- [ ] E2E tests for auth flow (login/refresh/logout)
- [ ] E2E tests for enrollment boundaries
- [ ] E2E tests for assignment submission + grading
- [ ] E2E tests for attendance APIs
- [ ] E2E tests for role/permission denial cases
- [ ] Minimum coverage threshold set in CI

## 12) Deployment Checklist
- [ ] Production-ready env templates
- [ ] DB migration pipeline in CI/CD
- [ ] Backup and restore playbook for PostgreSQL
- [ ] Redis persistence/availability strategy
- [ ] Object storage bucket policy + lifecycle rules
- [ ] Monitoring and alerting (errors, latency, queue depth)
- [ ] Staging environment parity with production

## 13) Phase 2 Backlog (After MVP)
- [ ] Parent accounts and parent-student linkage
- [ ] Chat/discussion module
- [ ] Search across courses, lessons, assignments
- [ ] Advanced file handling (previews, transcoding)
- [ ] Expanded reporting suite
- [ ] Extended audit tooling and admin console

## 14) Phase 3 Backlog (Advanced)
- [ ] Live classes integration
- [ ] Real-time classroom collaboration updates
- [ ] Certificates generation service
- [ ] Billing/subscriptions/payments module
- [ ] Analytics dashboards and cohort analysis
- [ ] AI assistant features
- [ ] Recommendation engine
- [ ] Domain extraction to microservices where needed
