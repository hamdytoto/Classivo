# Classivo MVP Scope Lock (Phase 1)

Date locked: 2026-03-06
Owner: Backend team
Status: Approved baseline for implementation

## 1) In Scope (MVP)

### Authentication and Access
- Email/password login
- JWT access token + refresh token
- Logout (refresh token revocation)
- Role-based access control for: SuperAdmin, SchoolAdmin, Teacher, Student

### Academic Core
- Schools
- Classes
- Courses
- Teacher-to-course/class assignment
- Student enrollments

### Learning Flow
- Teacher creates lessons and lesson materials
- Teacher creates assignments with deadline
- Student submits assignment (text and optional attachment)
- Teacher grades submission and leaves feedback

### Basic Assessments
- Quiz basics (create quiz, submit quiz, calculate basic score)
- Grade retrieval for student and teacher views

### Operations
- Attendance marking per class session
- Announcements per class/course/school
- In-app notifications for core events

### Platform Essentials
- Swagger docs for all MVP endpoints
- Validation + standardized error responses
- Audit logging for critical actions (auth, role changes, grading)

## 2) Out of Scope (Post-MVP)
- Parent portal and parent-student linkage UI/API depth
- Chat/discussion system
- Advanced schedule/timetable optimization
- Live classes and video streaming
- Certificate generation
- Billing/subscriptions/payments
- Advanced analytics dashboards
- AI assistant and recommendation engine
- Microservices split (remain modular monolith)

## 3) MVP Acceptance Criteria

### Auth and RBAC
- Protected endpoints reject unauthorized/forbidden access correctly
- Access and refresh token flow is stable across login/refresh/logout

### Academic Data
- SchoolAdmin can create/manage school, classes, courses
- Teacher assignment and student enrollment flows work end-to-end

### Learning and Assessment
- Teacher can publish lesson + assignment
- Student can submit assignment successfully
- Teacher can grade and feedback is visible to student
- Quiz submission returns score using defined rules

### Operations
- Attendance can be marked and queried by class
- Announcements are visible only to intended audience
- Notifications are generated for key events

### Quality Gates
- Swagger reflects shipped endpoints
- Input validation and error format are consistent
- Critical e2e tests pass for auth, enrollment, submission, grading

## 4) Scope Control Rules
- Any new feature request must be labeled `MVP` or `Post-MVP` before implementation.
- If a feature increases data model complexity across 3 or more modules, defer unless explicitly approved.
- Do not add new external infrastructure in MVP unless required for existing in-scope features.

## 5) Release Definition (MVP v1)
MVP v1 is complete when all in-scope features are implemented, tested, documented, and deployable in staging with no P1 security or data-integrity issues.
