import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../common/guards';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    getStatus: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
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
    (authServiceMock.login as jest.Mock).mockResolvedValueOnce({
      user: { id: 'b6513f67-fe56-4a84-a9ae-bff34d8ae370' },
    });

    const result = await controller.login({
      email: 'john@classivo.dev',
      password: 'Password123',
    } as never, {
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('jest'),
    } as never);

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'john@classivo.dev',
      password: 'Password123',
    }, {
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });
    expect(result).toEqual({
      user: { id: 'b6513f67-fe56-4a84-a9ae-bff34d8ae370' },
    });
  });

  it('should delegate refresh to auth service', async () => {
    (authServiceMock.refresh as jest.Mock).mockResolvedValueOnce({
      accessToken: 'new-access-token',
    });

    const result = await controller.refresh({
      refreshToken: 'refresh-token',
    }, {
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('jest'),
    } as never);

    expect(authServiceMock.refresh).toHaveBeenCalledWith('refresh-token', {
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });
    expect(result).toEqual({
      accessToken: 'new-access-token',
    });
  });

  it('should delegate logout to auth service', async () => {
    (authServiceMock.logout as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await controller.logout(
      {
        refreshToken: 'refresh-token',
      } as never,
      {
        user: { id: 'user-123' },
      } as never,
    );

    expect(authServiceMock.logout).toHaveBeenCalledWith(
      'refresh-token',
      'user-123',
    );
    expect(result).toBeUndefined();
  });
});
