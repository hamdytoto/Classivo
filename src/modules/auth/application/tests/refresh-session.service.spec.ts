import { Test, TestingModule } from '@nestjs/testing';
import { AUDIT_ACTIONS } from '../../../../common/audit/audit.constants';
import { AuditLogService } from '../../../../common/audit/audit-log.service';
import { PrismaTransactionService } from '../../../../common/prisma/prisma-transaction.service';
import { RefreshSessionPolicy } from '../../domain/policies/refresh-session.policy';
import { AuthSessionRepository } from '../../infrastructure/repositories/auth-session.repository';
import { AuthTokenService } from '../../infrastructure/security/auth-token.service';
import { TokenHasherService } from '../../infrastructure/security/token-hasher.service';
import { RefreshSessionService } from '../refresh-session.service';

describe('RefreshSessionService', () => {
  let service: RefreshSessionService;

  const prismaTransactionServiceMock = {
    run: jest.fn(),
  };
  const refreshSessionPolicyMock = {
    validateRefreshSession: jest.fn(),
  };
  const authSessionRepositoryMock = {
    rotate: jest.fn(),
  };
  const authTokenServiceMock = {
    issueTokenPair: jest.fn(),
    buildExpiryDate: jest.fn(),
  };
  const tokenHasherServiceMock = {
    hash: jest.fn(),
  };
  const auditLogServiceMock = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshSessionService,
        {
          provide: PrismaTransactionService,
          useValue: prismaTransactionServiceMock,
        },
        {
          provide: RefreshSessionPolicy,
          useValue: refreshSessionPolicyMock,
        },
        {
          provide: AuthSessionRepository,
          useValue: authSessionRepositoryMock,
        },
        {
          provide: AuthTokenService,
          useValue: authTokenServiceMock,
        },
        {
          provide: TokenHasherService,
          useValue: tokenHasherServiceMock,
        },
        {
          provide: AuditLogService,
          useValue: auditLogServiceMock,
        },
      ],
    }).compile();

    service = module.get<RefreshSessionService>(RefreshSessionService);
    jest.clearAllMocks();
  });

  it('should rotate the session and audit the refresh', async () => {
    const tx = {};

    refreshSessionPolicyMock.validateRefreshSession.mockResolvedValueOnce({
      id: 'session-1',
      userId: 'user-1',
      user: {
        id: 'user-1',
        schoolId: 'school-1',
      },
    });
    authTokenServiceMock.issueTokenPair.mockResolvedValueOnce({
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      refreshToken: 'refresh-token',
      refreshExpiresIn: 604800,
    });
    authTokenServiceMock.buildExpiryDate.mockReturnValueOnce(
      new Date('2026-03-28T00:00:00.000Z'),
    );
    tokenHasherServiceMock.hash.mockReturnValueOnce('hashed-refresh-token');
    prismaTransactionServiceMock.run.mockImplementationOnce((callback) =>
      callback(tx),
    );
    authSessionRepositoryMock.rotate.mockResolvedValueOnce(undefined);
    auditLogServiceMock.log.mockResolvedValueOnce(undefined);

    await expect(
      service.execute('refresh-token', {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        refreshToken: 'refresh-token',
      }),
    );

    expect(auditLogServiceMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTIONS.authRefresh,
        resource: 'session',
        resourceId: 'session-1',
        actorId: 'user-1',
        schoolId: 'school-1',
        metadata: expect.objectContaining({
          sessionId: 'session-1',
          userAgent: 'jest',
        }),
      }),
      tx,
    );
  });
});
