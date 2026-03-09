type RateLimitConfig = {
  ttlSeconds: number;
  maxRequests: number;
};

const DEFAULT_RATE_LIMIT_TTL_SECONDS = 60;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100;

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}

export function getRateLimitConfig(): RateLimitConfig {
  return {
    ttlSeconds: parsePositiveInteger(
      process.env.RATE_LIMIT_TTL,
      DEFAULT_RATE_LIMIT_TTL_SECONDS,
    ),
    maxRequests: parsePositiveInteger(
      process.env.RATE_LIMIT_MAX,
      DEFAULT_RATE_LIMIT_MAX_REQUESTS,
    ),
  };
}

export function getAuthRateLimitConfig(): RateLimitConfig {
  const fallback = getRateLimitConfig();

  return {
    ttlSeconds: parsePositiveInteger(
      process.env.AUTH_RATE_LIMIT_TTL,
      fallback.ttlSeconds,
    ),
    maxRequests: parsePositiveInteger(
      process.env.AUTH_RATE_LIMIT_MAX,
      fallback.maxRequests,
    ),
  };
}
