import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthRateLimitGuard, JwtAuthGuard } from '../../common/guards';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const getStatusMock = jest.fn();
  const loginMock = jest.fn();
  const registerSchoolMock = jest.fn();
  const refreshMock = jest.fn();
  const logoutMock = jest.fn();
  const authServiceMock = {
    getStatus: getStatusMock,
    login: loginMock,
    registerSchool: registerSchoolMock,
    refresh: refreshMock,
    logout: logoutMock,
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
    );
    expect(result).toEqual({
      school: { id: 'school-123' },
      user: { id: 'user-123' },
    });
  });

  it('should delegate logout to auth service', async () => {
    logoutMock.mockResolvedValueOnce(undefined);

    const result = await controller.logout(
      {
        refreshToken: 'refresh-token',
      } as never,
      {
        user: { id: 'user-123' },
      } as never,
    );

    expect(logoutMock).toHaveBeenCalledWith('refresh-token', 'user-123');
    expect(result).toBeUndefined();
  });
});
