import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '@prisma/client';
import { PrismaTransactionService } from '../../../../common/prisma/prisma-transaction.service';
import { AuthIdentityPolicy } from '../../domain/policies/auth-identity.policy';
import { PasswordResetPolicy } from '../../domain/policies/password-reset.policy';
import { PasswordResetMailFactory } from '../../infrastructure/notifications/password-reset-mail.factory';
import { PasswordResetMailQueue } from '../../infrastructure/queue/password-reset-mail.queue';
import { AuthPasswordResetOtpRepository } from '../../infrastructure/repositories/auth-password-reset-otp.repository';
import { AuthUserRepository } from '../../infrastructure/repositories/auth-user.repository';
import { PasswordHasherService } from '../../infrastructure/security/password-hasher.service';
import { RequestPasswordResetService } from '../request-password-reset.service';

describe('RequestPasswordResetService', () => {
  let service: RequestPasswordResetService;

  const prismaTransactionServiceMock = {
    run: jest.fn(),
  };
  const authIdentityPolicyMock = {
    normalizeEmail: jest.fn(),
  };
  const passwordResetPolicyMock = {
    buildForgotPasswordResponse: jest.fn(),
    generateOtp: jest.fn(),
    buildOtpExpiryDate: jest.fn(),
  };
  const passwordResetMailFactoryMock = {
    build: jest.fn(),
  };
  const passwordResetMailQueueMock = {
    enqueue: jest.fn(),
  };
  const authPasswordResetOtpRepositoryMock = {
    invalidateActiveByUserId: jest.fn(),
    create: jest.fn(),
    deleteActiveByUserIdAndCodeHash: jest.fn(),
  };
  const authUserRepositoryMock = {
    findForForgotPassword: jest.fn(),
  };
  const passwordHasherServiceMock = {
    hash: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestPasswordResetService,
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
          provide: PasswordResetMailFactory,
          useValue: passwordResetMailFactoryMock,
        },
        {
          provide: PasswordResetMailQueue,
          useValue: passwordResetMailQueueMock,
        },
        {
          provide: AuthPasswordResetOtpRepository,
          useValue: authPasswordResetOtpRepositoryMock,
        },
        {
          provide: AuthUserRepository,
          useValue: authUserRepositoryMock,
        },
        {
          provide: PasswordHasherService,
          useValue: passwordHasherServiceMock,
        },
      ],
    }).compile();

    service = module.get<RequestPasswordResetService>(
      RequestPasswordResetService,
    );
    jest.clearAllMocks();
  });

  it('should persist an otp and enqueue password reset mail delivery', async () => {
    const tx = {};
    const response = {
      message:
        'If an active account exists for that email, a password reset OTP has been sent.',
    };
    const expiresAt = new Date('2026-03-28T00:00:00.000Z');

    authIdentityPolicyMock.normalizeEmail.mockReturnValueOnce(
      'user@classivo.dev',
    );
    authUserRepositoryMock.findForForgotPassword.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@classivo.dev',
      firstName: 'User',
      status: UserStatus.ACTIVE,
    });
    passwordResetPolicyMock.buildForgotPasswordResponse.mockReturnValueOnce(
      response,
    );
    passwordResetPolicyMock.generateOtp.mockReturnValueOnce('123456');
    passwordHasherServiceMock.hash.mockResolvedValueOnce('hashed-otp');
    passwordResetPolicyMock.buildOtpExpiryDate.mockReturnValueOnce(expiresAt);
    passwordResetMailFactoryMock.build.mockReturnValueOnce({
      subject: 'Reset your password',
      html: '<p>123456</p>',
      text: '123456',
    });
    prismaTransactionServiceMock.run.mockImplementationOnce((callback) =>
      callback(tx),
    );
    authPasswordResetOtpRepositoryMock.create.mockResolvedValueOnce({
      id: 'reset-1',
    });
    passwordResetMailQueueMock.enqueue.mockResolvedValueOnce(undefined);

    await expect(
      service.execute('User@Classivo.dev', {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }),
    ).resolves.toEqual(response);

    expect(authPasswordResetOtpRepositoryMock.invalidateActiveByUserId).toHaveBeenCalledWith(
      'user-1',
      tx,
    );
    expect(authPasswordResetOtpRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        email: 'user@classivo.dev',
        codeHash: 'hashed-otp',
        expiresAt,
        requestedIpAddress: '127.0.0.1',
        requestedUserAgent: 'jest',
      }),
      tx,
    );
    expect(passwordResetMailQueueMock.enqueue).toHaveBeenCalledWith({
      passwordResetRequestId: 'reset-1',
      userId: 'user-1',
      to: 'user@classivo.dev',
      name: 'User',
      subject: 'Reset your password',
      html: '<p>123456</p>',
      text: '123456',
    });
  });

  it('should clean up the active otp when queue enqueue fails', async () => {
    const tx = {};
    const queueError = new Error('Redis unavailable');

    authIdentityPolicyMock.normalizeEmail.mockReturnValueOnce(
      'user@classivo.dev',
    );
    authUserRepositoryMock.findForForgotPassword.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@classivo.dev',
      firstName: 'User',
      status: UserStatus.ACTIVE,
    });
    passwordResetPolicyMock.buildForgotPasswordResponse.mockReturnValueOnce({
      message: 'ok',
    });
    passwordResetPolicyMock.generateOtp.mockReturnValueOnce('123456');
    passwordHasherServiceMock.hash.mockResolvedValueOnce('hashed-otp');
    passwordResetPolicyMock.buildOtpExpiryDate.mockReturnValueOnce(
      new Date('2026-03-28T00:00:00.000Z'),
    );
    passwordResetMailFactoryMock.build.mockReturnValueOnce({
      subject: 'Reset your password',
      html: '<p>123456</p>',
      text: '123456',
    });
    prismaTransactionServiceMock.run.mockImplementationOnce((callback) =>
      callback(tx),
    );
    authPasswordResetOtpRepositoryMock.create.mockResolvedValueOnce({
      id: 'reset-1',
    });
    passwordResetMailQueueMock.enqueue.mockRejectedValueOnce(queueError);

    await expect(
      service.execute('user@classivo.dev'),
    ).rejects.toThrow(queueError);

    expect(
      authPasswordResetOtpRepositoryMock.deleteActiveByUserIdAndCodeHash,
    ).toHaveBeenCalledWith('user-1', 'hashed-otp');
  });

  it('should return the generic response without creating an otp for inactive accounts', async () => {
    const response = {
      message:
        'If an active account exists for that email, a password reset OTP has been sent.',
    };

    authIdentityPolicyMock.normalizeEmail.mockReturnValueOnce(
      'disabled@classivo.dev',
    );
    authUserRepositoryMock.findForForgotPassword.mockResolvedValueOnce({
      id: 'user-1',
      email: 'disabled@classivo.dev',
      firstName: 'Disabled',
      status: UserStatus.DISABLED,
    });
    passwordResetPolicyMock.buildForgotPasswordResponse.mockReturnValueOnce(
      response,
    );

    await expect(
      service.execute('disabled@classivo.dev'),
    ).resolves.toEqual(response);

    expect(authPasswordResetOtpRepositoryMock.create).not.toHaveBeenCalled();
    expect(passwordResetMailQueueMock.enqueue).not.toHaveBeenCalled();
  });
});
