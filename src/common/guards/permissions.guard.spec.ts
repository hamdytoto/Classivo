import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationReadRepository } from '../repositories/authorization-read.repository';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  const getAllAndOverrideMock = jest.fn();
  const reflectorMock = {
    getAllAndOverride: getAllAndOverrideMock,
  } as unknown as Reflector;

  const findPermissionCodesByUserIdMock = jest.fn();
  const findRoleCodesByUserIdMock = jest.fn();
  const authorizationReadRepositoryMock = {
    findRoleCodesByUserId: findRoleCodesByUserIdMock,
    findPermissionCodesByUserId: findPermissionCodesByUserIdMock,
  } as unknown as AuthorizationReadRepository;

  let guard: PermissionsGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new PermissionsGuard(
      reflectorMock,
      authorizationReadRepositoryMock,
    );
  });

  it('should allow public routes', async () => {
    getAllAndOverrideMock.mockReturnValueOnce(true);

    const context = createHttpExecutionContext({});

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(findPermissionCodesByUserIdMock).not.toHaveBeenCalled();
    expect(findRoleCodesByUserIdMock).not.toHaveBeenCalled();
  });

  it('should reject missing authenticated actor', async () => {
    getAllAndOverrideMock
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['roles.read']);

    const context = createHttpExecutionContext({});

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('should allow requests with all required permissions', async () => {
    getAllAndOverrideMock
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['roles.read', 'users.read']);
    findRoleCodesByUserIdMock.mockResolvedValueOnce(['SUPER_ADMIN']);
    findPermissionCodesByUserIdMock.mockResolvedValueOnce([
      'roles.read',
      'users.read',
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
      permissions: ['roles.read', 'users.read'],
    });
  });

  it('should reject requests without all required permissions', async () => {
    getAllAndOverrideMock
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['roles.read', 'users.write']);
    findRoleCodesByUserIdMock.mockResolvedValueOnce(['TEACHER']);
    findPermissionCodesByUserIdMock.mockResolvedValueOnce(['roles.read']);

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
