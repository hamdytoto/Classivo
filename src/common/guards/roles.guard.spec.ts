import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationReadRepository } from '../repositories/authorization-read.repository';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const getAllAndOverrideMock = jest.fn();
  const reflectorMock = {
    getAllAndOverride: getAllAndOverrideMock,
  } as unknown as Reflector;

  const findRoleCodesByUserIdMock = jest.fn();
  const authorizationReadRepositoryMock = {
    findRoleCodesByUserId: findRoleCodesByUserIdMock,
  } as unknown as AuthorizationReadRepository;

  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflectorMock, authorizationReadRepositoryMock);
  });

  it('should allow public routes', async () => {
    getAllAndOverrideMock.mockReturnValueOnce(true);

    const context = createHttpExecutionContext({});

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(findRoleCodesByUserIdMock).not.toHaveBeenCalled();
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
    findRoleCodesByUserIdMock.mockResolvedValueOnce(['SUPER_ADMIN']);

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
    findRoleCodesByUserIdMock.mockResolvedValueOnce(['TEACHER']);

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
