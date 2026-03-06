# Classivo Structured Logging

Date approved: 2026-03-06

## Required Fields
Every HTTP log event must include:
- `requestId`
- `actorId` (nullable before auth middleware)
- `schoolId` (nullable for non-tenant/system routes)

## Events
- `http_request_completed`
- `http_request_failed`

## Current Implementation
- Request context middleware sets `requestId` and `schoolId` from headers.
- Global interceptor logs structured JSON with method, path, status, and duration.
- Global exception filter reuses request context `requestId` for error responses.

## Header Conventions
- Request ID header: `x-request-id`
- Tenant header: configured via `TENANT_HEADER_KEY` (default `x-school-id`)

## Notes
- `actorId` is extracted from `req.user` (`id`/`userId`/`sub`) when auth is active.
- Do not log secrets, tokens, or raw credentials.
