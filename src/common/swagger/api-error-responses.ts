import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

type ErrorExample = {
  summary: string;
  code: string;
  message: string;
  path: string;
  details?: Array<{
    field?: string;
    message: string;
  }>;
};

function buildErrorSchema(includeDetails = false) {
  return {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false,
      },
      error: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            example: 'REQUEST_FAILED',
          },
          message: {
            type: 'string',
            example: 'Request failed',
          },
          ...(includeDetails
            ? {
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                        example: 'email',
                      },
                      message: {
                        type: 'string',
                        example: 'email must be an email',
                      },
                    },
                  },
                },
              }
            : {}),
        },
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-21T10:00:00.000Z',
          },
          path: {
            type: 'string',
            example: '/api/v1/auth/login',
          },
          requestId: {
            type: 'string',
            example: '1c9d9f9a-5f31-4f7f-b2df-6e34f1a5bd8a',
          },
        },
      },
    },
  };
}

function buildErrorExample(example: ErrorExample) {
  return {
    summary: example.summary,
    value: {
      success: false,
      error: {
        code: example.code,
        message: example.message,
        ...(example.details ? { details: example.details } : {}),
      },
      meta: {
        timestamp: '2026-03-21T10:00:00.000Z',
        path: example.path,
        requestId: '1c9d9f9a-5f31-4f7f-b2df-6e34f1a5bd8a',
      },
    },
  };
}

function buildExamples(examples: Record<string, ErrorExample>) {
  return Object.fromEntries(
    Object.entries(examples).map(([key, example]) => [
      key,
      buildErrorExample(example),
    ]),
  );
}

export function ApiValidationFailureResponse(path: string) {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Request validation failed',
      content: {
        'application/json': {
          schema: buildErrorSchema(true),
          examples: buildExamples({
            validationFailure: {
              summary: 'Validation failed for request input',
              code: 'VALIDATION_FAILED',
              message: 'Request validation failed',
              path,
              details: [
                {
                  field: 'email',
                  message: 'email must be an email',
                },
                {
                  field: 'password',
                  message: 'password is not strong enough',
                },
              ],
            },
          }),
        },
      },
    }),
  );
}

export function ApiUnauthorizedExamplesResponse(
  examples: Record<string, Omit<ErrorExample, 'path'>>,
  path: string,
) {
  const mappedExamples = Object.fromEntries(
    Object.entries(examples).map(([key, example]) => [
      key,
      {
        ...example,
        path,
      },
    ]),
  );

  return applyDecorators(
    ApiUnauthorizedResponse({
      description: 'Authentication or session validation failed',
      content: {
        'application/json': {
          schema: buildErrorSchema(),
          examples: buildExamples(mappedExamples),
        },
      },
    }),
  );
}

export function ApiForbiddenExamplesResponse(
  examples: Record<string, Omit<ErrorExample, 'path'>>,
  path: string,
) {
  const mappedExamples = Object.fromEntries(
    Object.entries(examples).map(([key, example]) => [
      key,
      {
        ...example,
        path,
      },
    ]),
  );

  return applyDecorators(
    ApiForbiddenResponse({
      description: 'Authorization failed',
      content: {
        'application/json': {
          schema: buildErrorSchema(),
          examples: buildExamples(mappedExamples),
        },
      },
    }),
  );
}

export function ApiAuthRequiredResponse(path: string) {
  return ApiUnauthorizedExamplesResponse(
    {
      authRequired: {
        summary: 'Missing or invalid access token',
        code: 'AUTH_REQUIRED',
        message: 'Bearer access token is required',
      },
    },
    path,
  );
}

export function ApiRoleForbiddenResponse(path: string) {
  return ApiForbiddenExamplesResponse(
    {
      insufficientRole: {
        summary: 'Authenticated user lacks the required role',
        code: 'INSUFFICIENT_ROLE',
        message: 'You do not have the required role for this resource',
      },
    },
    path,
  );
}

export function ApiPermissionForbiddenResponse(path: string) {
  return ApiForbiddenExamplesResponse(
    {
      insufficientPermissions: {
        summary: 'Authenticated user lacks the required permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have the required permissions for this resource',
      },
    },
    path,
  );
}
