# Classivo API Docs (Swagger)

Date approved: 2026-03-06

## Endpoint
- Default docs UI path: `/docs`\n- API base path in docs: `/api/v1`
- Configurable by env var: `SWAGGER_PATH`

## Setup Notes
- Swagger is initialized in `src/main.ts`.
- Endpoints are grouped by module tags using `@ApiTags(...)` in controllers.
- Bearer auth scheme is preconfigured for protected endpoints.

## Conventions
- Every controller must define one tag matching its module name.
- Public endpoints should include clear summaries via `@ApiOperation`.
- DTOs must be used for request/response contracts so docs remain accurate.
