import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../constants/auth.constants';
import { getJwtAccessTokenConfig } from '../security/jwt.utils';
import type { AuthenticatedActor } from '../types/request-context.type';

type JwtAccessPayload = {
  sub: string;
  schoolId?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string;
  roles?: string[];
  permissions?: string[];
};

type RequestWithUser = Request & {
  user?: AuthenticatedActor;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message: 'Bearer access token is required',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret: getJwtAccessTokenConfig().secret,
      });

      request.user = {
        id: payload.sub,
        userId: payload.sub,
        sub: payload.sub,
        schoolId: payload.schoolId ?? null,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        status: payload.status,
        roles: Array.isArray(payload.roles) ? payload.roles : [],
        permissions: Array.isArray(payload.permissions)
          ? payload.permissions
          : [],
      };

      return true;
    } catch (error) {
      throw this.mapJwtError(error);
    }
  }

  private extractBearerToken(request: Request): string | null {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException({
        code: 'INVALID_AUTH_HEADER',
        message: 'Authorization header must use the Bearer scheme',
      });
    }

    return token;
  }

  private mapJwtError(error: unknown): UnauthorizedException {
    if (error instanceof UnauthorizedException) {
      return error;
    }

    if (
      error instanceof Error &&
      error.name === 'TokenExpiredError'
    ) {
      return new UnauthorizedException({
        code: 'ACCESS_TOKEN_EXPIRED',
        message: 'Access token has expired',
      });
    }

    return new UnauthorizedException({
      code: 'INVALID_ACCESS_TOKEN',
      message: 'Access token is invalid',
    });
  }
}
