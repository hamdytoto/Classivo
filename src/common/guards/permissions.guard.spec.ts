import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  const reflectorMock = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const prismaMock = {
    userRole: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  let guard: PermissionsGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new PermissionsGuard(reflectorMock, prismaMock);
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
      .mockReturnValueOnce(['roles.read']);

    const context = createHttpExecutionContext({});

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('should allow requests with all required permissions', async () => {
    (reflectorMock.getAllAndOverride as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['roles.read', 'users.read']);
    (prismaMock.userRole.findMany as jest.Mock).mockResolvedValueOnce([
      {
        role: {
          permissions: [
            { permission: { code: 'roles.read' } },
            { permission: { code: 'users.read' } },
          ],
        },
      },
      {
        role: {
          permissions: [{ permission: { code: 'roles.read' } }],
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
      permissions: ['roles.read', 'users.read'],
    });
  });

  it('should reject requests without all required permissions', async () => {
    (reflectorMock.getAllAndOverride as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['roles.read', 'users.write']);
    (prismaMock.userRole.findMany as jest.Mock).mockResolvedValueOnce([
      {
        role: {
          permissions: [{ permission: { code: 'roles.read' } }],
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
