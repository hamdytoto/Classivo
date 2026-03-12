# Classivo Backend Plan (NestJS)

## 1) Delivery Strategy: Build in Phases

Do not build all features at once. Deliver in three phases.

### Phase 1: Core MVP
- Auth and user management
- Schools, classes, courses
- Teacher assignments
- Student enrollment
- Lessons and materials
- Homework/assignments
- Submissions
- Quiz/exam basics
- Grades
- Announcements
- Notifications

### Phase 2: Operational Features
- Attendance
- Timetable/schedule
- Discussion/comments/chat
- Parent accounts
- Reports
- Search
- File storage
- Audit logs

### Phase 3: Advanced Features
- Live classes
- Real-time classroom updates
- Certificates
- Billing/subscriptions
- Analytics dashboard
- AI assistant
- Recommendation engine
- Microservices for scale

## 2) Recommended Architecture

Start with a **modular monolith**:
- One NestJS backend
- Clear modules by business domain
- One main database
- Background jobs for heavy tasks

Rationale:
- Faster to build and test
- Simpler operations in v1
- Easier team coordination
- Can later split heavy domains into microservices when required

## 3) High-Level Domain Modules

- auth
- users
- roles-permissions
- schools
- teachers
- students
- parents
- courses
- classes
- enrollments
- lessons
- materials
- assignments
- submissions
- quizzes
- questions
- exams
- grades
- attendance
- schedule
- announcements
- notifications
- chat
- reports
- files
- payments
- audit

## 4) Main User Roles and Access Control

Roles from day one:
- Super Admin
- School Admin
- Teacher
- Student
- Parent
- Support/Moderator

Access model:
- Use RBAC + permission checks (not only role labels)
- Protect routes using JWT auth guards + role/permission guards

Examples:
- Teacher can create lessons/assignments only for assigned classes
- Student can access only enrolled courses
- Parent can access only linked student data
- School admin manages teachers, classes, schedules

## 5) Core Database Entity Plan

### Identity and Access
- User
- Role
- Permission
- UserRole
- Session/RefreshToken
- AuditLog

### Academic Structure
- School
- AcademicYear
- Term/Semester
- GradeLevel
- ClassRoom
- Subject
- Course
- CourseTeacher
- Enrollment

### Learning Content and Assessment
- Lesson
- LessonSection
- Material
- Attachment
- Topic
- Assessment
- Assignment
- Submission
- Quiz
- QuizQuestion
- ChoiceOption
- Exam
- Grade
- Feedback

### Operations
- AttendanceRecord
- ScheduleEntry
- Announcement
- Notification
- Conversation
- Message

### Business
- SubscriptionPlan
- Invoice
- Payment
- Coupon

### Parent Linkage
- ParentStudentRelation

## 6) Suggested NestJS Project Structure

```text
src/
  main.ts
  app.module.ts

  common/
    decorators/
    dto/
    enums/
    exceptions/
    filters/
    guards/
    interceptors/
    pipes/
    utils/

  config/
    configuration.ts
    validation.ts

  database/
    migrations/
    seeders/

  modules/
    auth/
    users/
    roles/
    schools/
    courses/
    classes/
    enrollments/
    lessons/
    assignments/
    quizzes/
    exams/
    grades/
    attendance/
    schedule/
    announcements/
    notifications/
    files/
    chat/
    reports/
    payments/
```

Module internals:

```text
courses/
  courses.module.ts
  courses.controller.ts
  courses.service.ts
  dto/
  entities/
  repositories/
```

## 7) Recommended Backend Stack

- Framework: NestJS
- Language: TypeScript
- HTTP adapter: Fastify (or Express if preferred)
- ORM: Prisma (recommended) or TypeORM
- Database: PostgreSQL
- Cache/queue backend: Redis
- Background jobs: BullMQ
- File storage: S3-compatible object storage
- Auth: JWT access + refresh token
- Validation: class-validator + class-transformer
- API docs: Swagger/OpenAPI
- Realtime: WebSockets gateway
- Testing: Jest
- Containerization: Docker

Preferred combination for Classivo:
- PostgreSQL + Prisma + Redis + BullMQ + S3

## 8) Authentication and Security Plan

### Auth flow
- Email/phone login
- Hash passwords with bcrypt or argon2
- Issue JWT access token
- Use refresh token rotation/revocation
- Logout invalidates active refresh token
- Optional OTP for admins
- Optional Google/Microsoft SSO later

### Security controls
- Hashed passwords only
- Role and permission guards
- Rate limiting
- Helmet headers
- Strict CORS
- Request payload validation
- File type/size validation
- Audit trails
- IP/device session history for admins

## 9) API Design Plan (REST First)

Base groups:
- `/auth`
- `/users`
- `/schools`
- `/teachers`
- `/students`
- `/parents`
- `/courses`
- `/classes`
- `/lessons`
- `/assignments`
- `/submissions`
- `/quizzes`
- `/exams`
- `/grades`
- `/attendance`
- `/schedule`
- `/announcements`
- `/notifications`
- `/files`
- `/reports`

Example endpoints:
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /users/me`
- `POST /courses`
- `GET /courses`
- `GET /courses/:id`
- `PATCH /courses/:id`
- `POST /courses/:id/enrollments`
- `GET /students/:id/courses`
- `POST /assignments`
- `GET /assignments/:id`
- `POST /assignments/:id/submit`
- `GET /classes/:id/assignments`
- `POST /attendance/mark`
- `GET /attendance/class/:classId`
- `POST /quizzes`
- `POST /quizzes/:id/submit`
- `GET /grades/student/:studentId`

## 10) Business Logic Boundaries

Keep ownership clear:
- courses: course metadata and lifecycle
- enrollments: registration and membership rules
- assignments: task authoring and deadlines
- submissions: learner responses/files
- grades: grading rules and scores
- notifications: delivery only (no academic core ownership)

## 11) Async and Realtime Strategy

Use queues/jobs for:
- Email sending
- Push notifications
- Report generation
- Certificate generation
- Video processing
- Scheduled reminders
- Grade export
- Audit event processing

Use WebSockets for:
- Chat
- Live classroom state updates
- Real-time notifications
- Quiz countdown/exam session state

## 12) File and Content Handling

Requirements:
- PDFs, videos, attachments, profile images, recordings, answer sheets

Approach:
- Save file metadata in PostgreSQL
- Store binary data in object storage
- Deliver via signed URLs
- Enforce MIME/type/size checks and anti-malware scanning
- Apply access checks using role + course/class membership
- Do not store large binaries inside PostgreSQL

## 13) Reporting and Analytics Plan

Start with:
- Student progress
- Attendance summaries
- Teacher workload
- Assignment completion rates
- Course engagement
- Exam performance

Later:
- Weak-topic analysis
- Cohort comparisons
- At-risk student detection

Performance approach:
- Generate heavy reports asynchronously
- Cache frequently requested summaries

## 14) Multi-School (SaaS) Decision

Choose early:

### Option A: Single School
- Simpler implementation
- Easier permissions and billing
- Best for one institution

### Option B: Multi-Tenant SaaS
- Supports many schools
- Requires strict tenant isolation
- Every query scoped by `schoolId`/`tenantId`
- Better long-term business scalability

Recommendation:
- If Classivo targets many schools, design multi-tenancy from day one.

## 15) Development Roadmap (Sprints)

### Sprint 1
- Project bootstrap
- Env/config setup
- Database setup
- Auth module
- Users module
- Roles/permissions
- Swagger
- Logging and validation

Refined Sprint 1 objective:
- Finish a production-usable identity and access layer before starting academic modules
- Treat Sprint 1 as the trust boundary for the whole system: authentication, session lifecycle, role/permission administration, and user self-service

Recommended Sprint 1 endpoint additions:
- `POST /auth/register-school`
- `GET /auth/me`
- `GET /auth/sessions`
- `DELETE /auth/sessions/:sessionId`
- `POST /auth/logout-all`
- `POST /auth/change-password`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /users/:id/roles`
- `GET /users/:id/permissions`
- `GET /roles/:id/users`

Recommended Sprint 1 engineering enhancements:
- Add atomic school bootstrap flow for `register-school`:
  create school, create owner account, assign initial admin role, and seed school defaults in one transaction
- Enforce uniqueness for school identity fields such as name slug/subdomain and owner identity fields
- Decide whether `register-school` is public SaaS onboarding or restricted to platform operators
- Apply role/permission guards to admin-only routes in `users` and `roles`
- Add audit logging for authentication and access-management actions
- Add session/device visibility and revocation support
- Enforce account status checks during login and refresh
- Add pagination/filtering standards for list endpoints
- Add e2e coverage for auth lifecycle and authorization denial cases

Out of scope for Sprint 1:
- Schools CRUD after initial `register-school` bootstrap
- Lessons, files, assignments
- Attendance, announcements, notifications

### Sprint 2
- Schools/classes/courses
- Teacher/student management
- Enrollments

### Sprint 3
- Lessons/materials/files

### Sprint 4
- Assignments/submissions
- Basic grading

### Sprint 5
- Quizzes/exams
- Result calculation

### Sprint 6
- Attendance
- Timetable/schedule
- Announcements

### Sprint 7
- Notifications
- Email jobs
- WebSocket gateway

### Sprint 8
- Reports
- Audit logs
- Performance optimization
- Tests
- Deployment

## 16) Non-Functional Requirements

- API versioning
- Centralized error handling
- Structured logging
- Monitoring and alerting
- Test coverage goals
- DB backup and restore plan
- Migration strategy
- Seed scripts
- Staging environment
- CI/CD pipeline
- Secrets management

## 17) Recommended MVP Scope for Classivo

Build this first:
- Login/register
- Role and permission system
- School/class/course setup
- Teacher lesson creation
- Teacher assignment creation
- Student assignment submission
- Teacher grading
- Attendance
- Announcements
- Notifications
- Basic reports

## 18) Team and Execution Guidance

Ideal small team:
- 1 backend lead
- 1-2 backend developers (NestJS)
- 1 frontend developer
- 1 UI/UX designer
- 1 QA tester
- 1 product owner

If solo:
- Reduce scope aggressively
- Focus on MVP outcomes only

## 19) Final Recommendation for Classivo

### Phase 1 stack
- NestJS
- PostgreSQL
- Prisma
- Redis
- BullMQ
- S3-compatible storage
- JWT auth
- Swagger
- Docker

### Architecture baseline
- Modular monolith
- Domain-based modules
- REST API
- Background jobs
- WebSockets only where justified

### First major milestone
- Auth
- Users/Roles
- Courses/Classes
- Lessons
- Assignments/Submissions
- Grades
- Attendance
- Announcements

This milestone is the safest high-impact path to a strong production-ready education backend.
