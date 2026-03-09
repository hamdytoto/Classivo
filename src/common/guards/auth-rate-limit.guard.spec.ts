import {
  HttpException,
  HttpStatus,
  type ExecutionContext,
} from '@nestjs/common';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';

describe('AuthRateLimitGuard', () => {
  const originalAuthRateLimitTtl = process.env.AUTH_RATE_LIMIT_TTL;
  const originalAuthRateLimitMax = process.env.AUTH_RATE_LIMIT_MAX;

  let guard: AuthRateLimitGuard;

  beforeEach(() => {
    process.env.AUTH_RATE_LIMIT_TTL = '60';
    process.env.AUTH_RATE_LIMIT_MAX = '2';
    guard = new AuthRateLimitGuard();
  });

  afterEach(() => {
    process.env.AUTH_RATE_LIMIT_TTL = originalAuthRateLimitTtl;
    process.env.AUTH_RATE_LIMIT_MAX = originalAuthRateLimitMax;
  });

  it('should allow requests under the configured limit', () => {
    const context = createHttpExecutionContext({
      method: 'POST',
      route: { path: '/auth/login' },
      ip: '127.0.0.1',
      headers: {},
    });

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject requests over the configured limit', () => {
    const context = createHttpExecutionContext({
      method: 'POST',
      route: { path: '/auth/login' },
      ip: '127.0.0.1',
      headers: {},
    });

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
    try {
      guard.canActivate(context);
      fail('Expected rate limit exception');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });

  it('should isolate counters per route', () => {
    const loginContext = createHttpExecutionContext({
      method: 'POST',
      route: { path: '/auth/login' },
      ip: '127.0.0.1',
      headers: {},
    });
    const refreshContext = createHttpExecutionContext({
      method: 'POST',
      route: { path: '/auth/refresh' },
      ip: '127.0.0.1',
      headers: {},
    });

    expect(guard.canActivate(loginContext)).toBe(true);
    expect(guard.canActivate(loginContext)).toBe(true);
    expect(guard.canActivate(refreshContext)).toBe(true);
  });
});

function createHttpExecutionContext(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}
