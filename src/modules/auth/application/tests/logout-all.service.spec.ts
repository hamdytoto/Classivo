import { Test, TestingModule } from '@nestjs/testing';
import { AUDIT_ACTIONS } from '../../../common/audit/audit.constants';
import { AuditLogService } from '../../../common/audit/audit-log.service';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { RefreshSessionPolicy } from '../domain/policies/refresh-session.policy';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';
import { LogoutAllService } from './logout-all.service';

describe('LogoutAllService', () => {
  let service: LogoutAllService;

  const prismaTransactionServiceMock = {
    run: jest.fn(),
  };
  const refreshSessionPolicyMock = {
    validateRefreshSession: jest.fn(),
  };
  const authSessionRepositoryMock = {
    revokeManyByUserId: jest.fn(),
  };
  const auditLogServiceMock = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutAllService,
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

    service = module.get<LogoutAllService>(LogoutAllService);
    jest.clearAllMocks();
  });

  it('should revoke sessions and audit logout-all', async () => {
    const tx = {};

    refreshSessionPolicyMock.validateRefreshSession.mockResolvedValueOnce({
      id: 'session-1',
      userId: 'user-1',
      user: {
        id: 'user-1',
        schoolId: 'school-1',
      },
    });
    prismaTransactionServiceMock.run.mockImplementationOnce((callback) =>
      callback(tx),
    );
    authSessionRepositoryMock.revokeManyByUserId.mockResolvedValueOnce({
      count: 3,
    });
    auditLogServiceMock.log.mockResolvedValueOnce(undefined);

    await expect(
      service.execute('refresh-token', false, 'user-1', {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }),
    ).resolves.toEqual({ revokedCount: 3 });

    expect(auditLogServiceMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTIONS.authLogoutAll,
        resource: 'user',
        resourceId: 'user-1',
        actorId: 'user-1',
        schoolId: 'school-1',
        metadata: expect.objectContaining({
          currentSessionId: 'session-1',
          includeCurrent: false,
          revokedCount: 3,
        }),
      }),
      tx,
    );
  });
});
