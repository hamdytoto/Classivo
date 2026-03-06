# Classivo Environment Variable Policy

Date approved: 2026-03-06
Owner: Backend team

## Purpose
Define naming, lifecycle, and security rules for environment variables used by Classivo backend.

## File Rules
- `.env.example` is committed and contains non-secret placeholders only.
- `.env`, `.env.local`, and environment-specific local files are never committed.
- Production secrets are injected by deployment platform, not stored in repo.

## Naming Rules
- Use upper snake case for all variables.
- Prefix by concern when useful (`JWT_*`, `S3_*`).
- Do not overload one variable for multiple meanings.

## Required Variables by Environment

### Local development
- `NODE_ENV`, `PORT`, `API_PREFIX`, `API_VERSION`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `CORS_ORIGINS`, `RATE_LIMIT_TTL`, `RATE_LIMIT_MAX`, `LOG_LEVEL`

### Test
- Same as local, but isolated values and separate database/redis instances.

### Staging/Production
- All required variables from local/test
- Strong secrets generated outside source control
- Environment-specific origins and rate limits

## Secret Handling Rules
- Never hardcode secrets in code or docs.
- Rotate JWT and storage credentials on schedule or incident.
- Restrict secret visibility to least privilege.
- Avoid logging raw secrets in any environment.

## Validation Rules
- App must fail fast at boot if required variables are missing.
- Validate type/format for key values (port, ttl, URLs, booleans).
- Keep a single configuration validation source.

## Change Management
- Any new variable must be added to `.env.example` and documented here.
- Any variable removal must include migration notes.
- PRs introducing env changes must include deployment impact notes.
