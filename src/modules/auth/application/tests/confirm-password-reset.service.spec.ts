import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AUDIT_ACTIONS } from '../../../../common/audit/audit.constants';
import { AuditLogService } from '../../../../common/audit/audit-log.service';
import { PrismaTransactionService } from '../../../../common/prisma/prisma-transaction.service';
import { AuthIdentityPolicy } from '../../domain/policies/auth-identity.policy';
import { PasswordResetPolicy } from '../../domain/policies/password-reset.policy';
import { AuthPasswordResetOtpRepository } from '../../infrastructure/repositories/auth-password-reset-otp.repository';
import { AuthSessionRepository } from '../../infrastructure/repositories/auth-session.repository';
import { AuthUserRepository } from '../../infrastructure/repositories/auth-user.repository';
import { PasswordHasherService } from '../../infrastructure/security/password-hasher.service';
import { ConfirmPasswordResetService } from '../confirm-password-reset.service';

describe('ConfirmPasswordResetService', () => {
  let service: ConfirmPasswordResetService;

  const prismaTransactionServiceMock = {
    run: jest.fn(),
  };
  const authIdentityPolicyMock = {
    normalizeEmail: jest.fn(),
  };
  const passwordResetPolicyMock = {
    assertResetRecordIsUsable: jest.fn(),
    throwInvalidOtp: jest.fn(),
  };
  const authPasswordResetOtpRepositoryMock = {
    findLatestActiveByEmail: jest.fn(),
    consumeActiveByUserId: jest.fn(),
  };
  const authSessionRepositoryMock = {
    revokeManyByUserId: jest.fn(),
  };
  const authUserRepositoryMock = {
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
        ConfirmPasswordResetService,
        {
          provide: PrismaTransactionService,
          useValue: prismaTransactionServiceMock,
        },
        {
          provide: AuthIdentityPolicy,
          useValue: authIdentityPolicyMock,
        },
        {
          provide: PasswordResetPolicy,
          useValue: passwordResetPolicyMock,
        },
        {
          provide: AuthPasswordResetOtpRepository,
          useValue: authPasswordResetOtpRepositoryMock,
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

    service = module.get<ConfirmPasswordResetService>(
      ConfirmPasswordResetService,
    );
    jest.clearAllMocks();
  });

  it('should audit successful password reset completion', async () => {
    const tx = {};

    authIdentityPolicyMock.normalizeEmail.mockReturnValueOnce(
      'user@classivo.dev',
    );
    authPasswordResetOtpRepositoryMock.findLatestActiveByEmail.mockResolvedValueOnce(
      {
        id: 'reset-1',
        userId: 'user-1',
        codeHash: 'stored-otp-hash',
        expiresAt: new Date('2026-03-28T00:00:00.000Z'),
        user: {
          id: 'user-1',
          status: 'ACTIVE',
        },
      },
    );
    passwordHasherServiceMock.compare.mockResolvedValueOnce(true);
    passwordHasherServiceMock.hash.mockResolvedValueOnce('new-password-hash');
    prismaTransactionServiceMock.run.mockImplementationOnce((callback) =>
      callback(tx),
    );
    authUserRepositoryMock.updatePassword.mockResolvedValueOnce({
      id: 'user-1',
      schoolId: 'school-1',
      email: 'user@classivo.dev',
    });
    authSessionRepositoryMock.revokeManyByUserId.mockResolvedValueOnce({
      count: 3,
    });
    authPasswordResetOtpRepositoryMock.consumeActiveByUserId.mockResolvedValueOnce(
      {
        count: 1,
      },
    );
    auditLogServiceMock.log.mockResolvedValueOnce(undefined);

    await expect(
      service.execute(
        'User@Classivo.dev',
        '123456',
        'NewPassword123!',
        {
          ipAddress: '127.0.0.1',
          userAgent: 'jest',
        },
      ),
    ).resolves.toBeUndefined();

    expect(auditLogServiceMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTIONS.authResetPassword,
        resource: 'user',
        resourceId: 'user-1',
        actorId: 'user-1',
        schoolId: 'school-1',
        ipAddress: '127.0.0.1',
        metadata: expect.objectContaining({
          email: 'user@classivo.dev',
          passwordResetRequestId: 'reset-1',
          revokedSessionCount: 3,
          consumedResetRequestCount: 1,
          userAgent: 'jest',
        }),
      }),
      tx,
    );
  });

  it('should reject an invalid otp without mutating user or session state', async () => {
    authIdentityPolicyMock.normalizeEmail.mockReturnValueOnce(
      'user@classivo.dev',
    );
    authPasswordResetOtpRepositoryMock.findLatestActiveByEmail.mockResolvedValueOnce(
      {
        id: 'reset-1',
        userId: 'user-1',
        codeHash: 'stored-otp-hash',
        expiresAt: new Date('2026-03-28T00:00:00.000Z'),
        user: {
          id: 'user-1',
          status: 'ACTIVE',
        },
      },
    );
    passwordHasherServiceMock.compare.mockResolvedValueOnce(false);
    passwordResetPolicyMock.throwInvalidOtp.mockImplementationOnce(() => {
      throw new UnauthorizedException({
        code: 'INVALID_PASSWORD_RESET_OTP',
        message: 'Invalid password reset OTP',
      });
    });

    await expect(
      service.execute('user@classivo.dev', '000000', 'NewPassword123!'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prismaTransactionServiceMock.run).not.toHaveBeenCalled();
    expect(authUserRepositoryMock.updatePassword).not.toHaveBeenCalled();
    expect(authSessionRepositoryMock.revokeManyByUserId).not.toHaveBeenCalled();
    expect(auditLogServiceMock.log).not.toHaveBeenCalled();
  });
});
