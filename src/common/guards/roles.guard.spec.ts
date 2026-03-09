import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflectorMock = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const prismaMock = {
    userRole: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflectorMock, prismaMock);
  });

  it('should allow public routes', async () => {
    (reflectorMock.getAllAndOverride as jest.Mock).mockReturnValueOnce(true);

    const context = createHttpExecutionContext({});

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prismaMock.userRole.findMany).not.toHaveBeenCalled();
  });

  it('should reject missing authenticated actor', async () => {
    (reflectorMock.getAllAndOverride as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['SUPER_ADMIN']);

    const context = createHttpExecutionContext({});

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('should allow requests with a required role', async () => {
    (reflectorMock.getAllAndOverride as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['SUPER_ADMIN']);
    (prismaMock.userRole.findMany as jest.Mock).mockResolvedValueOnce([
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
    (reflectorMock.getAllAndOverride as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['SUPER_ADMIN']);
    (prismaMock.userRole.findMany as jest.Mock).mockResolvedValueOnce([
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
