import { Test, TestingModule } from '@nestjs/testing';
import { AUDIT_ACTIONS } from '../../../../common/audit/audit.constants';
import { AuditLogService } from '../../../../common/audit/audit-log.service';
import { PrismaTransactionService } from '../../../../common/prisma/prisma-transaction.service';
import { RefreshSessionPolicy } from '../../domain/policies/refresh-session.policy';
import { AuthSessionRepository } from '../../infrastructure/repositories/auth-session.repository';
import { LogoutService } from '../logout.service';

describe('LogoutService', () => {
  let service: LogoutService;

  const prismaTransactionServiceMock = {
    run: jest.fn(),
  };
  const refreshSessionPolicyMock = {
    validateRefreshSession: jest.fn(),
  };
  const authSessionRepositoryMock = {
    revokeById: jest.fn(),
  };
  const auditLogServiceMock = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutService,
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
          provide: AuditLogService,
          useValue: auditLogServiceMock,
        },
      ],
    }).compile();

    service = module.get<LogoutService>(LogoutService);
    jest.clearAllMocks();
  });

  it('should revoke the session and audit logout', async () => {
    const tx = {};

    refreshSessionPolicyMock.validateRefreshSession.mockResolvedValueOnce({
      id: 'session-1',
      user: {
        id: 'user-1',
        schoolId: 'school-1',
      },
    });
    prismaTransactionServiceMock.run.mockImplementationOnce((callback) =>
      callback(tx),
    );
    authSessionRepositoryMock.revokeById.mockResolvedValueOnce(undefined);
    auditLogServiceMock.log.mockResolvedValueOnce(undefined);

    await expect(
      service.execute('refresh-token', 'user-1', {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }),
    ).resolves.toBeUndefined();

    expect(
      refreshSessionPolicyMock.validateRefreshSession,
    ).toHaveBeenCalledWith('refresh-token', {
      actorId: 'user-1',
      includeUser: true,
    });
    expect(auditLogServiceMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTIONS.authLogout,
        resourceId: 'session-1',
        actorId: 'user-1',
        schoolId: 'school-1',
      }),
      tx,
    );
  });
});
