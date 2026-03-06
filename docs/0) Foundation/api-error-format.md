# Classivo API Error Format

Date approved: 2026-03-06

## Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "message": "email must be an email" }
    ]
  },
  "meta": {
    "timestamp": "2026-03-06T08:00:00.000Z",
    "path": "/api/v1/auth/login",
    "requestId": "f5f8c4d2-..."
  }
}
```

## Notes
- `details` is optional and mainly used for validation errors.
- `requestId` is taken from `x-request-id` header when provided; otherwise generated.
- Unknown/unhandled errors return `INTERNAL_SERVER_ERROR` with safe message.
