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

export const CurrentUserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();

    const actor = request.user;

    const actorId = actor?.id ?? actor?.userId ?? actor?.sub;

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
