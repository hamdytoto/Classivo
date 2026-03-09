import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { getAuthRateLimitConfig } from '../config/rate-limit.config';

type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

type RequestWithIp = Request & {
  ip?: string;
};

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly store = new Map<string, RateLimitEntry>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithIp>();
    const clientKey = this.resolveClientKey(request);
    const routeKey = this.resolveRouteKey(request);
    const key = `${routeKey}:${clientKey}`;
    const config = getAuthRateLimitConfig();
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.expiresAt <= now) {
      this.store.set(key, {
        count: 1,
        expiresAt: now + config.ttlSeconds * 1000,
      });
      return true;
    }

    if (entry.count >= config.maxRequests) {
      throw new HttpException(
        {
          code: 'AUTH_RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication requests. Please try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count += 1;
    this.store.set(key, entry);
    return true;
  }

  private resolveRouteKey(request: Request): string {
    const method = request.method ?? 'UNKNOWN';
    const routeRecord =
      typeof request.route === 'object' && request.route !== null
        ? (request.route as Record<string, unknown>)
        : undefined;
    const routePath =
      typeof routeRecord?.path === 'string' ? routeRecord.path : undefined;
    const path =
      routePath ?? request.originalUrl ?? request.url ?? 'unknown-route';

    return `${method}:${path}`;
  }

  private resolveClientKey(request: RequestWithIp): string {
    const forwardedForHeader = request.headers['x-forwarded-for'];
    const forwardedFor = Array.isArray(forwardedForHeader)
      ? forwardedForHeader[0]
      : forwardedForHeader;

    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      return forwardedFor.split(',')[0]?.trim() || forwardedFor;
    }

    if (typeof request.ip === 'string' && request.ip.length > 0) {
      return request.ip;
    }

    return 'unknown-client';
  }
}
