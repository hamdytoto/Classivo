# Classivo Seed Strategy

Date approved: 2026-03-06

## Objective
Provide repeatable bootstrap data for local/staging environments.

## Seed Source
- Script: `prisma/seed.js`
- Command: `pnpm prisma:seed`

## Seeded Data
- Roles:
  - `SUPER_ADMIN`
  - `SCHOOL_ADMIN`
  - `TEACHER`
  - `STUDENT`
  - `PARENT`
  - `SUPPORT`
- Permissions for core MVP domains (`users`, `schools`, `classes`, `courses`, `lessons`, `assignments`, `submissions`, `grades`, `attendance`, `announcements`)
- Role-permission mappings
- Default admin user + `SUPER_ADMIN` role assignment

## Environment Inputs
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`
- `DEFAULT_ADMIN_FIRST_NAME`
- `DEFAULT_ADMIN_LAST_NAME`
- `SALT_ROUND`

## Idempotency
- Seed uses Prisma `upsert` for roles, permissions, role-permission links, admin user, and admin role assignment.
- Running seed multiple times is safe and updates mutable fields.

## Usage
1. Run migrations: `pnpm prisma:migrate:dev`
2. Seed data: `pnpm prisma:seed`

## Security Note
- Change `DEFAULT_ADMIN_PASSWORD` immediately outside local development.
- Keep `SALT_ROUND` aligned across app runtime and seed execution.
