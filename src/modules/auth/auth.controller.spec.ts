import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthRateLimitGuard, JwtAuthGuard } from '../../common/guards';
import { AuthController } from './interface/auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const loginMock = jest.fn();
  const meMock = jest.fn();
  const sessionsMock = jest.fn();
  const revokeSessionMock = jest.fn();
  const registerSchoolMock = jest.fn();
  const refreshMock = jest.fn();
  const logoutMock = jest.fn();
  const logoutAllMock = jest.fn();
  const changePasswordMock = jest.fn();
  const forgotPasswordMock = jest.fn();
  const resetPasswordMock = jest.fn();
  const authServiceMock = {
    login: loginMock,
    me: meMock,
    sessions: sessionsMock,
    revokeSession: revokeSessionMock,
    registerSchool: registerSchoolMock,
    refresh: refreshMock,
    logout: logoutMock,
    logoutAll: logoutAllMock,
    changePassword: changePasswordMock,
    forgotPassword: forgotPasswordMock,
    resetPassword: resetPasswordMock,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: AuthRateLimitGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: Reflector,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate login to auth service', async () => {
    loginMock.mockResolvedValueOnce({
      user: { id: 'b6513f67-fe56-4a84-a9ae-bff34d8ae370' },
    });

    const result = await controller.login(
      {
        email: 'john@classivo.dev',
        password: 'Password123',
      } as never,
      {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('jest'),
      } as never,
    );

    expect(loginMock).toHaveBeenCalledWith(
      {
        email: 'john@classivo.dev',
        password: 'Password123',
      },
      {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      },
    );
    expect(result).toEqual({
      user: { id: 'b6513f67-fe56-4a84-a9ae-bff34d8ae370' },
    });
  });

  it('should delegate refresh to auth service', async () => {
    refreshMock.mockResolvedValueOnce({
      accessToken: 'new-access-token',
    });

    const result = await controller.refresh(
      {
        refreshToken: 'refresh-token',
      },
      {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('jest'),
      } as never,
    );

    expect(refreshMock).toHaveBeenCalledWith('refresh-token', {
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });
    expect(result).toEqual({
      accessToken: 'new-access-token',
    });
  });

  it('should delegate school registration to auth service', async () => {
    registerSchoolMock.mockResolvedValueOnce({
      school: { id: 'school-123' },
      user: { id: 'user-123' },
    });

    const result = await controller.registerSchool(
      {
        schoolName: 'Classivo Academy',
        schoolCode: 'classivo',
        email: 'owner@classivo.dev',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      } as never,
      'actor-1',
      {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('jest'),
      } as never,
    );

    expect(registerSchoolMock).toHaveBeenCalledWith(
      {
        schoolName: 'Classivo Academy',
        schoolCode: 'classivo',
        email: 'owner@classivo.dev',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      },
      {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      },
      'actor-1',
    );
    expect(result).toEqual({
      school: { id: 'school-123' },
      user: { id: 'user-123' },
    });
  });

  it('should delegate auth/me to auth service', async () => {
    meMock.mockResolvedValueOnce({
      id: 'user-123',
      roles: ['SCHOOL_ADMIN'],
      permissions: ['users.read'],
    });

    const result = await controller.me('user-123');

    expect(meMock).toHaveBeenCalledWith('user-123');
    expect(result).toEqual({
      id: 'user-123',
      roles: ['SCHOOL_ADMIN'],
      permissions: ['users.read'],
    });
  });

  it('should delegate auth/sessions to auth service', async () => {
    sessionsMock.mockResolvedValueOnce({
      data: [
        {
          id: 'session-1',
          lastUsedAt: new Date('2026-03-21T10:00:00.000Z'),
          revokedAt: null,
        },
        {
          id: 'session-2',
          lastUsedAt: new Date('2026-03-21T09:00:00.000Z'),
          revokedAt: null,
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
    });

    const result = await controller.sessions('user-123', {
      page: 1,
      limit: 20,
      sortBy: 'lastUsedAt',
      sortOrder: 'desc',
    } as never);

    expect(sessionsMock).toHaveBeenCalledWith('user-123', {
      page: 1,
      limit: 20,
      sortBy: 'lastUsedAt',
      sortOrder: 'desc',
    });
    expect(result).toEqual({
      data: [
        {
          id: 'session-1',
          lastUsedAt: new Date('2026-03-21T10:00:00.000Z'),
          revokedAt: null,
        },
        {
          id: 'session-2',
          lastUsedAt: new Date('2026-03-21T09:00:00.000Z'),
          revokedAt: null,
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
    });
  });

  it('should delegate session revocation to auth service', async () => {
    revokeSessionMock.mockResolvedValueOnce(undefined);

    const result = await controller.revokeSession(
      {
        sessionId: 'session-123',
      } as never,
      'user-123',
    );

    expect(revokeSessionMock).toHaveBeenCalledWith('session-123', 'user-123');
    expect(result).toBeUndefined();
  });

  it('should delegate logout to auth service', async () => {
    logoutMock.mockResolvedValueOnce(undefined);

    const result = await controller.logout(
      {
        refreshToken: 'refresh-token',
      } as never,
      'user-123',
      {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('jest'),
      } as never,
    );

    expect(logoutMock).toHaveBeenCalledWith('refresh-token', 'user-123', {
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });
    expect(result).toBeUndefined();
  });

  it('should delegate logout-all to auth service', async () => {
    logoutAllMock.mockResolvedValueOnce({ revokedCount: 2 });

    const result = await controller.logoutAll(
      {
        refreshToken: 'refresh-token',
        includeCurrent: false,
      } as never,
      'user-123',
      {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('jest'),
      } as never,
    );

    expect(logoutAllMock).toHaveBeenCalledWith(
      'refresh-token',
      false,
      'user-123',
      {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      },
    );
    expect(result).toEqual({ revokedCount: 2 });
  });

  it('should delegate change-password to auth service', async () => {
    changePasswordMock.mockResolvedValueOnce(undefined);

    const result = await controller.changePassword(
      {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
      } as never,
      'user-123',
      {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('jest'),
      } as never,
    );

    expect(changePasswordMock).toHaveBeenCalledWith(
      'user-123',
      'OldPassword123',
      'NewPassword456',
      {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      },
    );
    expect(result).toBeUndefined();
  });

  it('should delegate forgot-password to auth service', async () => {
    forgotPasswordMock.mockResolvedValueOnce({
      message:
        'If an active account exists for that email, a password reset OTP has been sent.',
    });

    const result = await controller.forgotPassword(
      {
        email: 'john@classivo.dev',
      } as never,
      {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('jest'),
      } as never,
    );

    expect(forgotPasswordMock).toHaveBeenCalledWith('john@classivo.dev', {
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });
    expect(result).toEqual({
      message:
        'If an active account exists for that email, a password reset OTP has been sent.',
    });
  });

  it('should delegate reset-password to auth service', async () => {
    resetPasswordMock.mockResolvedValueOnce(undefined);

    const result = await controller.resetPassword({
      email: 'john@classivo.dev',
      otp: '123456',
      newPassword: 'NewPassword456!',
    } as never,
    {
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('jest'),
    } as never);

    expect(resetPasswordMock).toHaveBeenCalledWith(
      'john@classivo.dev',
      '123456',
      'NewPassword456!',
      {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      },
    );
    expect(result).toBeUndefined();
  });
});
