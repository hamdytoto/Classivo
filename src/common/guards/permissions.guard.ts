import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY, PERMISSIONS_KEY } from '../constants/auth.constants';
import { AuthorizationReadRepository } from '../repositories/authorization-read.repository';
import type { AuthenticatedActor } from '../types/request-context.type';

type RequestWithUser = Request & {
  user?: AuthenticatedActor;
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationReadRepository: AuthorizationReadRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const actor = request.user;
    const actorId = actor?.id ?? actor?.userId ?? actor?.sub;

    if (!actorId) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message:
          'Authenticated user is required for permission-protected routes',
      });
    }

    const userPermissions =
      await this.authorizationReadRepository.findPermissionCodesByUserId(
        actorId,
      );

    request.user = {
      ...actor,
      permissions: userPermissions,
    };

    const hasRequiredPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasRequiredPermissions) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have the required permissions for this resource',
      });
    }

    return true;
  }
}
