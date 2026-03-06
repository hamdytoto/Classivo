# Classivo Health Endpoint

Date approved: 2026-03-06

## Endpoint
- `GET /health`

## Purpose
- Lightweight public probe for uptime/liveness checks.
- Excluded from API prefix and versioning routes.

## Response
```json
{
  "status": "ok",
  "service": "classivo-backend",
  "timestamp": "2026-03-06T10:00:00.000Z",
  "uptimeSeconds": 123
}
```

## Notes
- Suitable for load balancer and orchestrator health checks.
- Deeper dependency checks (DB/Redis) can be added later with readiness probes.
