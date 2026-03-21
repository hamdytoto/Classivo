import { VersioningType } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  AuthRateLimitGuard,
  JwtAuthGuard,
  PermissionsGuard,
  RolesGuard,
} from '../guards';
import { AuthorizationReadRepository } from '../repositories/authorization-read.repository';
import { AuthService } from '../../modules/auth/auth.service';
import { AuthController } from '../../modules/auth/interface/auth.controller';
import { RolesController } from '../../modules/roles/interface/roles.controller';
import { RolesService } from '../../modules/roles/roles.service';
import { UsersController } from '../../modules/users/interface/users.controller';
import { UsersService } from '../../modules/users/users.service';

describe('Swagger error response examples', () => {
  it('should expose auth, forbidden, and validation examples in the Swagger document', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController, RolesController, UsersController],
      providers: [
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: RolesService,
          useValue: {},
        },
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: Reflector,
          useValue: {},
        },
        {
          provide: AuthorizationReadRepository,
          useValue: {
            findRoleCodesByUserId: jest.fn().mockResolvedValue([]),
            findPermissionCodesByUserId: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: RolesGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: PermissionsGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: AuthRateLimitGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    await app.init();

    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );

    const loginPath = findPath(document.paths, '/api/v1/auth/login');
    const roleAssignmentPath = findPath(
      document.paths,
      '/api/v1/roles/users/{userId}/{roleId}',
    );
    const usersPath = findPath(document.paths, '/api/v1/users');

    expect(
      getExampleErrorCode(
        document.paths,
        loginPath,
        'post',
        '401',
        'invalidCredentials',
      ),
    ).toBe('INVALID_CREDENTIALS');
    expect(
      getExampleErrorCode(
        document.paths,
        loginPath,
        'post',
        '400',
        'validationFailure',
      ),
    ).toBe('VALIDATION_FAILED');
    expect(
      getExampleErrorCode(
        document.paths,
        roleAssignmentPath,
        'post',
        '403',
        'insufficientRole',
      ),
    ).toBe('INSUFFICIENT_ROLE');
    expect(
      getExampleErrorCode(
        document.paths,
        usersPath,
        'get',
        '403',
        'insufficientPermissions',
      ),
    ).toBe('INSUFFICIENT_PERMISSIONS');

    await app.close();
  });
});

function findPath(paths: unknown, expectedPath: string): string {
  const pathMap = toRecord(paths, 'Swagger paths');
  const exactMatch = Object.keys(pathMap).find((path) => path === expectedPath);

  if (exactMatch) {
    return exactMatch;
  }

  const suffixMatch = Object.keys(pathMap).find((path) =>
    path.endsWith(expectedPath),
  );

  if (!suffixMatch) {
    throw new Error(`Path "${expectedPath}" was not found`);
  }

  return suffixMatch;
}

function getExampleErrorCode(
  paths: unknown,
  pathKey: string,
  method: 'get' | 'post',
  statusCode: '400' | '401' | '403',
  exampleKey: string,
): string {
  const pathMap = toRecord(paths, 'Swagger paths');
  const pathItem = toRecord(pathMap[pathKey], `Swagger path "${pathKey}"`);
  const operation = toRecord(
    pathItem[method],
    `Swagger operation ${method.toUpperCase()} ${pathKey}`,
  );
  const responses = toRecord(
    operation.responses,
    `Swagger responses for ${method.toUpperCase()} ${pathKey}`,
  );
  const response = toRecord(
    responses[statusCode],
    `Swagger ${statusCode} response for ${method.toUpperCase()} ${pathKey}`,
  );
  const content = toRecord(
    response.content,
    `Swagger response content for ${method.toUpperCase()} ${pathKey}`,
  );
  const jsonContent = toRecord(
    content['application/json'],
    `Swagger JSON response content for ${method.toUpperCase()} ${pathKey}`,
  );
  const examples = toRecord(
    jsonContent.examples,
    `Swagger examples for ${method.toUpperCase()} ${pathKey}`,
  );
  const example = toRecord(
    examples[exampleKey],
    `Swagger example "${exampleKey}" for ${method.toUpperCase()} ${pathKey}`,
  );
  const value = toRecord(
    example.value,
    `Swagger example value "${exampleKey}" for ${method.toUpperCase()} ${pathKey}`,
  );
  const error = toRecord(
    value.error,
    `Swagger example error "${exampleKey}" for ${method.toUpperCase()} ${pathKey}`,
  );

  if (typeof error.code !== 'string') {
    throw new Error(
      `Swagger example "${exampleKey}" for ${method.toUpperCase()} ${pathKey} is missing error.code`,
    );
  }

  return error.code;
}

function toRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    throw new Error(`${label} was not found`);
  }

  return value as Record<string, unknown>;
}
