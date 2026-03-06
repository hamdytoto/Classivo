import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';
import type {
  AuthenticatedActor,
  RequestContext,
} from '../types/request-context.type';

type RequestWithContextAndActor = Request & {
  context?: RequestContext;
  user?: AuthenticatedActor;
};

@Injectable()
export class StructuredLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const startedAt = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithContextAndActor>();
    const response = http.getResponse<Response>();

    const requestId = request.context?.requestId ?? null;
    const schoolId =
      request.user?.schoolId ?? request.context?.schoolId ?? null;
    const actorId = this.extractActorId(request.user);
    const method = request.method;
    const path = request.originalUrl ?? request.url;

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            JSON.stringify({
              event: 'http_request_completed',
              timestamp: new Date().toISOString(),
              requestId,
              actorId,
              schoolId,
              method,
              path,
              statusCode: response.statusCode,
              durationMs: Date.now() - startedAt,
            }),
          );
        },
        error: (error: unknown) => {
          this.logger.error(
            JSON.stringify({
              event: 'http_request_failed',
              timestamp: new Date().toISOString(),
              requestId,
              actorId,
              schoolId,
              method,
              path,
              statusCode: response.statusCode,
              durationMs: Date.now() - startedAt,
              errorName: error instanceof Error ? error.name : 'UnknownError',
              errorMessage:
                error instanceof Error ? error.message : 'Unknown error',
            }),
          );
        },
      }),
    );
  }

  private extractActorId(actor: AuthenticatedActor | undefined): string | null {
    if (!actor) {
      return null;
    }

    return actor.id ?? actor.userId ?? actor.sub ?? null;
  }
}
