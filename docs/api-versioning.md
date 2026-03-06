# Classivo API Versioning

Date approved: 2026-03-06

## Strategy
- Versioning type: URI
- Global prefix: `api`
- Default API version: `v1`

## Route Shape
- All versioned endpoints use: `/api/v1/...`
- Example: `/api/v1/auth/login`

## Configuration
- `API_PREFIX` (default: `api`)
- `API_VERSION` (default: `v1`; also accepts `1`)

## Rules
- New controllers must be compatible with URI versioning.
- Breaking changes require a new major API version path (for example `v2`).
- Non-breaking additions stay in current version.
