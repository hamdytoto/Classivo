import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { RequestContext } from '../types/request-context.type';

type RequestWithContext = Request & {
  context?: RequestContext;
};

const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const request = req as RequestWithContext;
    const schoolHeaderKey = process.env.TENANT_HEADER_KEY ?? 'x-school-id';
    const requestId = this.readHeader(req, REQUEST_ID_HEADER) ?? randomUUID();
    const schoolId = this.readHeader(req, schoolHeaderKey);

    request.context = {
      requestId,
      schoolId,
    };

    res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  }

  private readHeader(req: Request, key: string): string | null {
    const value = req.headers[key.toLowerCase()];

    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    if (Array.isArray(value) && value[0]) {
      return value[0];
    }

    return null;
  }
}
