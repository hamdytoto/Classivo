import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../constants/auth.constants';
import { AuthorizationReadRepository } from '../repositories/authorization-read.repository';
import type { AuthenticatedActor } from '../types/request-context.type';

type RequestWithUser = Request & {
  user?: AuthenticatedActor;
};

@Injectable()
export class RolesGuard implements CanActivate {
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

    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const actor = request.user;
    const actorId = actor?.id ?? actor?.userId ?? actor?.sub;

    if (!actorId) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message: 'Authenticated user is required for role-protected routes',
      });
    }

    const userRoles =
      await this.authorizationReadRepository.findRoleCodesByUserId(actorId);
    request.user = {
      ...actor,
      roles: userRoles,
    };

    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_ROLE',
        message: 'You do not have the required role for this resource',
      });
    }

    return true;
  }
}
