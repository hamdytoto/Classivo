import { UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_ERROR_CODES } from '../auth-errors';
import { AuthSessionRepository } from '../../infrastructure/repositories/auth-session.repository';
import { AuthTokenService } from '../../infrastructure/security/auth-token.service';
import { TokenHasherService } from '../../infrastructure/security/token-hasher.service';
import { AuthIdentityPolicy } from './auth-identity.policy';
import { RefreshSessionPolicy } from './refresh-session.policy';

describe('RefreshSessionPolicy', () => {
  let policy: RefreshSessionPolicy;

  const authTokenServiceMock = {
    verifyRefreshToken: jest.fn(),
  };
  const authSessionRepositoryMock = {
    findById: jest.fn(),
    findByIdWithUser: jest.fn(),
    revokeById: jest.fn(),
  };
  const tokenHasherServiceMock = {
    hash: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshSessionPolicy,
        AuthIdentityPolicy,
        {
          provide: AuthTokenService,
          useValue: authTokenServiceMock,
        },
        {
          provide: AuthSessionRepository,
          useValue: authSessionRepositoryMock,
        },
        {
          provide: TokenHasherService,
          useValue: tokenHasherServiceMock,
        },
      ],
    }).compile();

    policy = module.get<RefreshSessionPolicy>(RefreshSessionPolicy);
    jest.clearAllMocks();
  });

  it('should return the session when the user is active', async () => {
    const expiresAt = new Date(Date.now() + 60_000);

    authTokenServiceMock.verifyRefreshToken.mockResolvedValueOnce({
      sub: 'user-1',
      sid: 'session-1',
      type: 'refresh',
    });
    authSessionRepositoryMock.findByIdWithUser.mockResolvedValueOnce({
      id: 'session-1',
      userId: 'user-1',
      refreshTokenHash: 'hashed-refresh-token',
      expiresAt,
      revokedAt: null,
      user: {
        id: 'user-1',
        schoolId: 'school-1',
        email: 'user@classivo.dev',
        phone: null,
        firstName: 'Test',
        lastName: 'User',
        status: UserStatus.ACTIVE,
        lastLoginAt: null,
        createdAt: new Date('2026-03-21T00:00:00.000Z'),
        updatedAt: new Date('2026-03-21T00:00:00.000Z'),
      },
    });
    tokenHasherServiceMock.hash.mockReturnValueOnce('hashed-refresh-token');

    await expect(
      policy.validateRefreshSessionWithUser('refresh-token', {
        revokeOnInactiveUser: true,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'session-1',
        userId: 'user-1',
      }),
    );

    expect(authSessionRepositoryMock.revokeById).not.toHaveBeenCalled();
  });

  it.each([
    [UserStatus.SUSPENDED, AUTH_ERROR_CODES.accountSuspended],
    [UserStatus.DISABLED, AUTH_ERROR_CODES.accountDisabled],
  ])('should revoke the session when the user is %s', async (status, code) => {
    const expiresAt = new Date(Date.now() + 60_000);

    authTokenServiceMock.verifyRefreshToken.mockResolvedValueOnce({
      sub: 'user-1',
      sid: 'session-1',
      type: 'refresh',
    });
    authSessionRepositoryMock.findByIdWithUser.mockResolvedValueOnce({
      id: 'session-1',
      userId: 'user-1',
      refreshTokenHash: 'hashed-refresh-token',
      expiresAt,
      revokedAt: null,
      user: {
        id: 'user-1',
        schoolId: 'school-1',
        email: 'user@classivo.dev',
        phone: null,
        firstName: 'Test',
        lastName: 'User',
        status,
        lastLoginAt: null,
        createdAt: new Date('2026-03-21T00:00:00.000Z'),
        updatedAt: new Date('2026-03-21T00:00:00.000Z'),
      },
    });
    tokenHasherServiceMock.hash.mockReturnValueOnce('hashed-refresh-token');
    authSessionRepositoryMock.revokeById.mockResolvedValueOnce({
      count: 1,
    });

    try {
      await policy.validateRefreshSessionWithUser('refresh-token', {
        revokeOnInactiveUser: true,
      });
      fail('Expected validateRefreshSessionWithUser to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).getResponse()).toEqual({
        code,
        message:
          status === UserStatus.SUSPENDED
            ? 'Account is suspended'
            : 'Account is disabled',
      });
    }

    expect(authSessionRepositoryMock.revokeById).toHaveBeenCalledWith(
      'session-1',
      expect.any(Date),
    );
  });
});
