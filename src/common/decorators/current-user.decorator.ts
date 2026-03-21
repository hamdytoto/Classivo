import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedActor } from '../types/request-context.type';

type AuthRequest = Request & {
  user?: AuthenticatedActor;
};

function resolveAuthenticatedActorId(
  actor?: AuthenticatedActor,
): string | undefined {
  return actor?.id ?? actor?.userId ?? actor?.sub;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedActor => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    const actor = request.user;

    if (!actor) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message:
          'Authenticated user is required. Provide a valid access token.',
      });
    }

    return actor;
  },
);

export const CurrentUserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();

    const actor = request.user;
    const actorId = resolveAuthenticatedActorId(actor);

    if (!actorId) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message:
          'Authenticated user is required. Provide a valid access token.',
      });
    }

    return actorId;
  },
);
