import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AUDIT_ACTIONS } from '../../../../common/audit/audit.constants';
import { AuditLogService } from '../../../../common/audit/audit-log.service';
import { PrismaTransactionService } from '../../../../common/prisma/prisma-transaction.service';
import { AuthIdentityPolicy } from '../../domain/policies/auth-identity.policy';
import { AuthSessionRepository } from '../../infrastructure/repositories/auth-session.repository';
import { AuthUserRepository } from '../../infrastructure/repositories/auth-user.repository';
import { PasswordHasherService } from '../../infrastructure/security/password-hasher.service';
import { ChangePasswordService } from '../change-password.service';

describe('ChangePasswordService', () => {
  let service: ChangePasswordService;

  const prismaTransactionServiceMock = {
    run: jest.fn(),
  };
  const authIdentityPolicyMock = {
    assertUserIsActive: jest.fn(),
  };
  const authSessionRepositoryMock = {
    revokeManyByUserId: jest.fn(),
  };
  const authUserRepositoryMock = {
    findForPasswordChange: jest.fn(),
    updatePassword: jest.fn(),
  };
  const passwordHasherServiceMock = {
    compare: jest.fn(),
    hash: jest.fn(),
  };
  const auditLogServiceMock = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangePasswordService,
        {
          provide: PrismaTransactionService,
          useValue: prismaTransactionServiceMock,
        },
        {
          provide: AuthIdentityPolicy,
          useValue: authIdentityPolicyMock,
        },
        {
          provide: AuthSessionRepository,
          useValue: authSessionRepositoryMock,
        },
        {
          provide: AuthUserRepository,
          useValue: authUserRepositoryMock,
        },
        {
          provide: PasswordHasherService,
          useValue: passwordHasherServiceMock,
        },
        {
          provide: AuditLogService,
          useValue: auditLogServiceMock,
        },
      ],
    }).compile();

    service = module.get<ChangePasswordService>(ChangePasswordService);
    jest.clearAllMocks();
  });

  it('should rotate the password, revoke sessions, and audit the change', async () => {
    const tx = {};

    authUserRepositoryMock.findForPasswordChange.mockResolvedValueOnce({
      id: 'user-1',
      schoolId: 'school-1',
      passwordHash: 'stored-hash',
      status: 'ACTIVE',
    });
    passwordHasherServiceMock.compare.mockResolvedValueOnce(true);
    passwordHasherServiceMock.hash.mockResolvedValueOnce('new-hash');
    prismaTransactionServiceMock.run.mockImplementationOnce((callback) =>
      callback(tx),
    );
    authUserRepositoryMock.updatePassword.mockResolvedValueOnce(undefined);
    authSessionRepositoryMock.revokeManyByUserId.mockResolvedValueOnce({
      count: 4,
    });
    auditLogServiceMock.log.mockResolvedValueOnce(undefined);

    await expect(
      service.execute('user-1', 'OldPassword123!', 'NewPassword456!', {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }),
    ).resolves.toBeUndefined();

    expect(auditLogServiceMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTIONS.authChangePassword,
        resource: 'user',
        resourceId: 'user-1',
        actorId: 'user-1',
        schoolId: 'school-1',
        metadata: expect.objectContaining({
          revokedSessionCount: 4,
          userAgent: 'jest',
        }),
      }),
      tx,
    );
  });

  it('should reject an invalid current password', async () => {
    authUserRepositoryMock.findForPasswordChange.mockResolvedValueOnce({
      id: 'user-1',
      schoolId: 'school-1',
      passwordHash: 'stored-hash',
      status: 'ACTIVE',
    });
    passwordHasherServiceMock.compare.mockResolvedValueOnce(false);

    await expect(
      service.execute('user-1', 'wrong-password', 'NewPassword456!'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
