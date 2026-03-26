import { Test, TestingModule } from '@nestjs/testing';
import { ChangePasswordService } from './application/change-password.service';
import { ConfirmPasswordResetService } from './application/confirm-password-reset.service';
import { GetCurrentUserProfileService } from './application/get-current-user-profile.service';
import { ListActiveSessionsService } from './application/list-active-sessions.service';
import { LoginService } from './application/login.service';
import { LogoutAllService } from './application/logout-all.service';
import { LogoutService } from './application/logout.service';
import { RefreshSessionService } from './application/refresh-session.service';
import { RegisterSchoolService } from './application/register-school.service';
import { RequestPasswordResetService } from './application/request-password-reset.service';
import { RevokeSessionService } from './application/revoke-session.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const loginExecute = jest.fn();
  const refreshExecute = jest.fn();
  const logoutExecute = jest.fn();
  const logoutAllExecute = jest.fn();
  const revokeSessionExecute = jest.fn();
  const registerSchoolExecute = jest.fn();
  const changePasswordExecute = jest.fn();
  const requestPasswordResetExecute = jest.fn();
  const confirmPasswordResetExecute = jest.fn();
  const getCurrentUserProfileExecute = jest.fn();
  const listActiveSessionsExecute = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: LoginService, useValue: { execute: loginExecute } },
        {
          provide: RefreshSessionService,
          useValue: { execute: refreshExecute },
        },
        { provide: LogoutService, useValue: { execute: logoutExecute } },
        {
          provide: LogoutAllService,
          useValue: { execute: logoutAllExecute },
        },
        {
          provide: RevokeSessionService,
          useValue: { execute: revokeSessionExecute },
        },
        {
          provide: RegisterSchoolService,
          useValue: { execute: registerSchoolExecute },
        },
        {
          provide: ChangePasswordService,
          useValue: { execute: changePasswordExecute },
        },
        {
          provide: RequestPasswordResetService,
          useValue: { execute: requestPasswordResetExecute },
        },
        {
          provide: ConfirmPasswordResetService,
          useValue: { execute: confirmPasswordResetExecute },
        },
        {
          provide: GetCurrentUserProfileService,
          useValue: { execute: getCurrentUserProfileExecute },
        },
        {
          provide: ListActiveSessionsService,
          useValue: { execute: listActiveSessionsExecute },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should delegate login', async () => {
    loginExecute.mockResolvedValueOnce({ accessToken: 'token' });

    await expect(
      service.login(
        { email: 'user@classivo.dev', password: 'Password123!' },
        { ipAddress: '127.0.0.1' },
      ),
    ).resolves.toEqual({ accessToken: 'token' });

    expect(loginExecute).toHaveBeenCalledWith(
      { email: 'user@classivo.dev', password: 'Password123!' },
      { ipAddress: '127.0.0.1' },
    );
  });

  it('should delegate refresh and logout flows', async () => {
    refreshExecute.mockResolvedValueOnce({ refreshToken: 'next-token' });
    logoutExecute.mockResolvedValueOnce(undefined);
    logoutAllExecute.mockResolvedValueOnce({ revokedCount: 2 });

    await expect(
      service.refresh('refresh-token', { userAgent: 'jest' }),
    ).resolves.toEqual({ refreshToken: 'next-token' });
    await expect(
      service.logout('refresh-token', 'user-1', { ipAddress: '127.0.0.1' }),
    ).resolves.toBeUndefined();
    await expect(
      service.logoutAll('refresh-token', false, 'user-1', {
        userAgent: 'jest',
      }),
    ).resolves.toEqual({ revokedCount: 2 });

    expect(refreshExecute).toHaveBeenCalledWith('refresh-token', {
      userAgent: 'jest',
    });
    expect(logoutExecute).toHaveBeenCalledWith('refresh-token', 'user-1', {
      ipAddress: '127.0.0.1',
    });
    expect(logoutAllExecute).toHaveBeenCalledWith(
      'refresh-token',
      false,
      'user-1',
      { userAgent: 'jest' },
    );
  });

  it('should delegate profile and session operations', async () => {
    getCurrentUserProfileExecute.mockResolvedValueOnce({ id: 'user-1' });
    listActiveSessionsExecute.mockResolvedValueOnce({
      data: [{ id: 'session-1' }],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
    revokeSessionExecute.mockResolvedValueOnce(undefined);

    await expect(service.me('user-1')).resolves.toEqual({ id: 'user-1' });
    await expect(
      service.sessions('user-1', { page: 1, limit: 10 }),
    ).resolves.toEqual({
      data: [{ id: 'session-1' }],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
    await expect(
      service.revokeSession('session-1', 'user-1'),
    ).resolves.toBeUndefined();

    expect(getCurrentUserProfileExecute).toHaveBeenCalledWith('user-1');
    expect(listActiveSessionsExecute).toHaveBeenCalledWith('user-1', {
      page: 1,
      limit: 10,
    });
    expect(revokeSessionExecute).toHaveBeenCalledWith('session-1', 'user-1');
  });

  it('should delegate registration and password operations', async () => {
    registerSchoolExecute.mockResolvedValueOnce({ school: { id: 'school-1' } });
    changePasswordExecute.mockResolvedValueOnce(undefined);
    requestPasswordResetExecute.mockResolvedValueOnce({ message: 'queued' });
    confirmPasswordResetExecute.mockResolvedValueOnce(undefined);

    await expect(
      service.registerSchool(
        {
          schoolName: 'Classivo',
          schoolCode: 'CLASSIVO',
          email: 'owner@classivo.dev',
          password: 'Password123!',
          firstName: 'Owner',
          lastName: 'User',
        },
        { ipAddress: '127.0.0.1' },
        'actor-1',
      ),
    ).resolves.toEqual({ school: { id: 'school-1' } });
    await expect(
      service.changePassword('user-1', 'old', 'new', {
        ipAddress: '127.0.0.1',
      }),
    ).resolves.toBeUndefined();
    await expect(
      service.forgotPassword('user@classivo.dev', { ipAddress: '127.0.0.1' }),
    ).resolves.toEqual({ message: 'queued' });
    await expect(
      service.resetPassword(
        'user@classivo.dev',
        '123456',
        'Password123!',
        { ipAddress: '127.0.0.1' },
      ),
    ).resolves.toBeUndefined();

    expect(registerSchoolExecute).toHaveBeenCalledWith(
      {
        schoolName: 'Classivo',
        schoolCode: 'CLASSIVO',
        email: 'owner@classivo.dev',
        password: 'Password123!',
        firstName: 'Owner',
        lastName: 'User',
      },
      { ipAddress: '127.0.0.1' },
      'actor-1',
    );
    expect(changePasswordExecute).toHaveBeenCalledWith('user-1', 'old', 'new', {
      ipAddress: '127.0.0.1',
    });
    expect(requestPasswordResetExecute).toHaveBeenCalledWith(
      'user@classivo.dev',
      { ipAddress: '127.0.0.1' },
    );
    expect(confirmPasswordResetExecute).toHaveBeenCalledWith(
      'user@classivo.dev',
      '123456',
      'Password123!',
      { ipAddress: '127.0.0.1' },
    );
  });
});
