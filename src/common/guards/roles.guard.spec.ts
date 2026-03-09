import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const getAllAndOverrideMock = jest.fn();
  const reflectorMock = {
    getAllAndOverride: getAllAndOverrideMock,
  } as unknown as Reflector;

  const findManyMock = jest.fn();
  const prismaMock = {
    userRole: {
      findMany: findManyMock,
    },
  } as unknown as PrismaService;

  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflectorMock, prismaMock);
  });

  it('should allow public routes', async () => {
    getAllAndOverrideMock.mockReturnValueOnce(true);

    const context = createHttpExecutionContext({});

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it('should reject missing authenticated actor', async () => {
    getAllAndOverrideMock
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['SUPER_ADMIN']);

    const context = createHttpExecutionContext({});

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('should allow requests with a required role', async () => {
    getAllAndOverrideMock
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['SUPER_ADMIN']);
    findManyMock.mockResolvedValueOnce([
      {
        role: {
          code: 'SUPER_ADMIN',
        },
      },
    ]);

    const request = {
      user: {
        id: 'user-123',
      },
    };

    const context = createHttpExecutionContext(request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({
      id: 'user-123',
      roles: ['SUPER_ADMIN'],
    });
  });

  it('should reject requests without a required role', async () => {
    getAllAndOverrideMock
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['SUPER_ADMIN']);
    findManyMock.mockResolvedValueOnce([
      {
        role: {
          code: 'TEACHER',
        },
      },
    ]);

    const context = createHttpExecutionContext({
      user: {
        id: 'user-123',
      },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

function createHttpExecutionContext(request: Record<string, unknown>) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}
