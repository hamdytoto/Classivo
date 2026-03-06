import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type {
  ApiErrorDetail,
  ApiErrorResponse,
} from '../types/api-error-response.type';
import type { RequestContext } from '../types/request-context.type';

type ErrorBody = {
  code?: string;
  message?: string | string[];
  details?: ApiErrorDetail[];
  error?: string;
};

type RequestWithContext = Request & {
  context?: RequestContext;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithContext>();

    const isHttpException = exception instanceof HttpException;
    const status: HttpStatus = isHttpException
      ? (exception.getStatus() as HttpStatus)
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const requestId =
      request.context?.requestId ??
      this.getHeaderValue(request.headers['x-request-id']) ??
      randomUUID();
    const path = request.originalUrl ?? request.url ?? '/';

    const errorPayload = this.buildErrorPayload(exception, status);
    const body: ApiErrorResponse = {
      success: false,
      error: errorPayload,
      meta: {
        timestamp: new Date().toISOString(),
        path,
        requestId,
      },
    };

    response.status(status).json(body);
  }

  private buildErrorPayload(
    exception: unknown,
    status: HttpStatus,
  ): ApiErrorResponse['error'] {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const parsed = this.parseHttpExceptionResponse(response, status);
      return parsed;
    }

    return {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    };
  }

  private parseHttpExceptionResponse(
    response: string | object,
    status: HttpStatus,
  ): ApiErrorResponse['error'] {
    if (typeof response === 'string') {
      return {
        code: this.defaultCode(status),
        message: response,
      };
    }

    const body = response as ErrorBody;
    const message = this.resolveMessage(body, status);

    return {
      code: body.code ?? this.defaultCode(status),
      message,
      details: body.details,
    };
  }

  private resolveMessage(body: ErrorBody, status: HttpStatus): string {
    if (Array.isArray(body.message)) {
      return body.message.join('; ');
    }

    if (typeof body.message === 'string' && body.message.length > 0) {
      return body.message;
    }

    if (typeof body.error === 'string' && body.error.length > 0) {
      return body.error;
    }

    return status === HttpStatus.BAD_REQUEST
      ? 'Request validation failed'
      : 'Request failed';
  }

  private defaultCode(status: HttpStatus): string {
    if (status === HttpStatus.BAD_REQUEST) {
      return 'BAD_REQUEST';
    }

    if (status === HttpStatus.UNAUTHORIZED) {
      return 'UNAUTHORIZED';
    }

    if (status === HttpStatus.FORBIDDEN) {
      return 'FORBIDDEN';
    }

    if (status === HttpStatus.NOT_FOUND) {
      return 'NOT_FOUND';
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'INTERNAL_SERVER_ERROR';
    }

    return 'REQUEST_FAILED';
  }

  private getHeaderValue(value: string | string[] | undefined): string | null {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    if (Array.isArray(value) && value[0]) {
      return value[0];
    }

    return null;
  }
}
