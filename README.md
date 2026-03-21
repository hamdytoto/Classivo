# Classivo Backend

Classivo is a school management backend built with NestJS, Prisma, PostgreSQL, and Redis. This repository currently focuses on the platform foundation for authentication, role-based access control, user administration, and service integrations needed to grow into a multi-module education platform.

## Overview

The backend provides:

- JWT-based authentication with refresh-token rotation and session management
- Role and permission management with global guards
- User management APIs with pagination, filtering, and profile inspection
- Password change and password reset via OTP
- Swagger API documentation with bearer-auth support
- Prisma-powered PostgreSQL persistence
- Redis-backed queue infrastructure with BullMQ
- S3-compatible storage utilities
- Brevo mail integration
- Structured request logging, validation, and centralized error handling

## Current Implementation

The most complete parts of the platform today are:

- `auth`: login, refresh, logout, logout-all, revoke session, current-user profile, password change, forgot/reset password, and school registration bootstrap
- `users`: create, list, inspect, update, inspect roles, and inspect effective permissions
- `roles`: create/list/update roles and permissions, assign permissions to roles, assign roles to users, and inspect users for a role
- `mail`: test email endpoint backed by Brevo
- `health`: public health probe endpoint

The repository also includes scaffolded education-domain modules such as `schools`, `courses`, `classes`, `enrollments`, `lessons`, `assignments`, `quizzes`, `exams`, `grades`, `attendance`, `schedule`, `announcements`, `notifications`, `files`, `chat`, `reports`, and `payments`. At the moment, most of these expose status endpoints and serve as extension points for upcoming work.

## Tech Stack

- NestJS 11
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- Swagger / OpenAPI
- Brevo transactional email
- AWS S3 compatible object storage
- Jest for unit and e2e testing

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create your environment file

```bash
cp .env.example .env
```

Review the values in `.env` before starting the app. The important groups are:

- Application: `PORT`, `API_PREFIX`, `API_VERSION`, `SWAGGER_PATH`
- Database: `DATABASE_URL`
- Redis: `REDIS_URL`
- Auth: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, token TTL values
- Storage: `S3_*`
- Mail: `BREVO_API_KEY`, `MAIL_FROM`
- Seed defaults: `DEFAULT_ADMIN_*`

For local bootstrapping, placeholder values are enough for most integrations. Real email delivery requires a valid Brevo API key, and any storage flows require access to an S3-compatible service.

### 3. Start infrastructure

For local development with the app running on your machine:

```bash
docker compose up -d postgres redis
```

### 4. Prepare the database

```bash
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm prisma:seed
```

### 5. Run the API

```bash
pnpm start:dev
```

The application will start with:

- API base URL: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/health`

## Docker

The recommended development workflow is to run PostgreSQL and Redis in Docker, then run the NestJS app locally with `pnpm start:dev`.

If you want to start the production-style API container as well:

```bash
docker compose up --build
```

Before relying on the containerized API for a fresh environment, make sure Prisma migrations and seed data have already been applied from a development environment.

For a hot-reload development container:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## Seeded Access

The seed script creates baseline roles, permissions, and a default super admin user.

Default values from `.env.example`:

- Email: `admin@classivo.local`
- Password: `ChangeMe123!`
- Role: `SUPER_ADMIN`

Baseline roles:

- `SUPER_ADMIN`
- `SCHOOL_ADMIN`
- `TEACHER`
- `STUDENT`
- `PARENT`
- `SUPPORT`

## API Notes

- Versioning uses URI versioning, so `API_VERSION=v1` becomes `/api/v1`
- Swagger is enabled and configured to persist bearer tokens in the UI
- The `health` endpoint is version-neutral and publicly accessible
- Authentication and authorization are enforced globally with JWT, role, and permission guards
- Auth-sensitive endpoints include dedicated rate limiting

## Available Scripts

```bash
pnpm build
pnpm start
pnpm start:dev
pnpm start:debug
pnpm start:prod

pnpm prisma:generate
pnpm prisma:format
pnpm prisma:migrate:dev
pnpm prisma:migrate:deploy
pnpm prisma:seed
pnpm prisma:studio

pnpm lint
pnpm lint:check

pnpm test
pnpm test:watch
pnpm test:cov
pnpm test:e2e
pnpm ci:check
```

## Project Structure

```text
src/
  common/        Shared infrastructure, guards, config, filters, storage, redis, queue
  health/        Public health probe
  modules/
    auth/        Authentication and session lifecycle
    users/       User management and user inspection APIs
    roles/       Role, permission, and assignment management
prisma/
  schema.prisma  Database schema
  seed.js        Seed script for roles, permissions, and default admin
test/
  *.e2e-spec.ts  End-to-end tests
```

## Project Status

This backend has a strong platform foundation and a real authorization layer already in place. The repository is beyond a starter template, but it is still in active development, with many school-domain modules scaffolded and ready for deeper implementation.

If you are onboarding to the project, the best place to start is:

- `src/modules/auth`
- `src/modules/users`
- `src/modules/roles`
- `prisma/schema.prisma`

## License

This project is currently `UNLICENSED`.
