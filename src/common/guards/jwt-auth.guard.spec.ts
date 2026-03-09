import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const verifyAsyncMock = jest.fn();
  const jwtServiceMock = {
    verifyAsync: verifyAsyncMock,
  } as unknown as JwtService;

  const getAllAndOverrideMock = jest.fn();
  const reflectorMock = {
    getAllAndOverride: getAllAndOverrideMock,
  } as unknown as Reflector;

  let guard: JwtAuthGuard;

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_ACCESS_TTL = '15m';
    jest.clearAllMocks();
    guard = new JwtAuthGuard(jwtServiceMock, reflectorMock);
  });

  it('should allow public routes without token verification', async () => {
    getAllAndOverrideMock.mockReturnValueOnce(true);

    const context = createHttpExecutionContext({});

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyAsyncMock).not.toHaveBeenCalled();
  });

  it('should attach the verified actor to request.user', async () => {
    getAllAndOverrideMock.mockReturnValueOnce(false);
    verifyAsyncMock.mockResolvedValueOnce({
      sub: 'user-123',
      schoolId: 'school-123',
      email: 'john@classivo.dev',
      phone: null,
      status: 'ACTIVE',
      roles: ['ADMIN'],
      permissions: ['users.read'],
    });

    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
      user: {
        id: 'user-123',
        userId: 'user-123',
        sub: 'user-123',
        schoolId: 'school-123',
        email: 'john@classivo.dev',
        phone: null,
        status: 'ACTIVE',
        roles: ['ADMIN'],
        permissions: ['users.read'],
      },
    };

    const context = createHttpExecutionContext(request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyAsyncMock).toHaveBeenCalledWith('valid-token', {
      secret: 'test-access-secret',
    });
    expect(request.user).toEqual({
      id: 'user-123',
      userId: 'user-123',
      sub: 'user-123',
      schoolId: 'school-123',
      email: 'john@classivo.dev',
      phone: null,
      status: 'ACTIVE',
      roles: ['ADMIN'],
      permissions: ['users.read'],
    });
  });

  it('should reject requests without a bearer token', async () => {
    getAllAndOverrideMock.mockReturnValueOnce(false);

    const context = createHttpExecutionContext({
      headers: {},
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject invalid tokens', async () => {
    getAllAndOverrideMock.mockReturnValueOnce(false);
    verifyAsyncMock.mockRejectedValueOnce(new Error('invalid token'));

    const context = createHttpExecutionContext({
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
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
