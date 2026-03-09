# Sprint 1 - Bullet 10: Seed Baseline Roles

## Goal
Implement Sprint 1 TODO bullet 10 by making the baseline role seed explicit, reusable, and reliably executable through Prisma seeding.

## Scope
- Ensure the six baseline MVP roles are seeded:
  - `SUPER_ADMIN`
  - `SCHOOL_ADMIN`
  - `TEACHER`
  - `STUDENT`
  - `PARENT`
  - `SUPPORT`
- Keep role-permission mappings tied to the same seed source.
- Make the Prisma seed entrypoint explicit in project configuration.
- Update seed documentation to reflect the finalized baseline role seeding contract.

## Technical Plan
1. Extract baseline seed data from `prisma/seed.js`:
   - Move role and permission definitions into a dedicated seed-data module.
   - Reuse the exported definitions from the main seed script.
2. Finalize seed execution wiring:
   - Add an explicit Prisma `seed` command entry in `package.json`.
   - Keep the script idempotent through Prisma `upsert`.
3. Update docs and verification:
   - Document the baseline roles and related env inputs.
   - Run a lightweight verification against the seed-data module and project build.

## Notes
- The baseline roles were already present in the seed script; this bullet makes that implementation durable and clearly part of the project contract.
- This work stays scoped to seed data and does not change runtime authorization behavior.

## Execution Record
- [x] Identified the next unchecked Sprint 1 bullet from `todo.md`.
- [x] Reviewed existing seed script, seed docs, and package seed wiring.
- [x] Added bullet 10 sprint plan doc under `docs/sprint-1`.
- [x] Extracted the baseline role and permission seed manifest into `prisma/seed-data.js`.
- [x] Wired Prisma seed execution explicitly through `package.json`.
- [x] Updated seed documentation and completion tracking for the baseline-role seed contract.
