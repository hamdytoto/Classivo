import { UserStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../../../../common/redis/redis.service';
import { AuthMailerService } from '../notifications/auth-mailer.service';
import { AuthPasswordResetOtpRepository } from '../repositories/auth-password-reset-otp.repository';
import { PasswordResetMailWorker } from './password-reset-mail.worker';

describe('PasswordResetMailWorker', () => {
  let worker: PasswordResetMailWorker;

  const redisServiceMock = {
    getConnectionOptions: jest.fn(),
  };
  const authMailerServiceMock = {
    sendPasswordResetMail: jest.fn(),
  };
  const authPasswordResetOtpRepositoryMock = {
    findActiveDeliveryTargetById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetMailWorker,
        {
          provide: RedisService,
          useValue: redisServiceMock,
        },
        {
          provide: AuthMailerService,
          useValue: authMailerServiceMock,
        },
        {
          provide: AuthPasswordResetOtpRepository,
          useValue: authPasswordResetOtpRepositoryMock,
        },
      ],
    }).compile();

    worker = module.get<PasswordResetMailWorker>(PasswordResetMailWorker);
    jest.clearAllMocks();
  });

  it('should send mail for an active password reset request', async () => {
    authPasswordResetOtpRepositoryMock.findActiveDeliveryTargetById.mockResolvedValueOnce(
      {
        id: 'reset-1',
        userId: 'user-1',
        email: 'user@classivo.dev',
        user: {
          status: UserStatus.ACTIVE,
        },
      },
    );
    authMailerServiceMock.sendPasswordResetMail.mockResolvedValueOnce(
      undefined,
    );

    await expect(
      worker.process({
        id: 'job-1',
        name: 'auth.password_reset_mail',
        data: {
          passwordResetRequestId: 'reset-1',
          userId: 'user-1',
          to: 'user@classivo.dev',
          name: 'User',
          subject: 'Reset your password',
          html: '<p>123456</p>',
          text: '123456',
        },
      } as never),
    ).resolves.toBeUndefined();

    expect(authMailerServiceMock.sendPasswordResetMail).toHaveBeenCalledWith({
      to: 'user@classivo.dev',
      name: 'User',
      subject: 'Reset your password',
      html: '<p>123456</p>',
      text: '123456',
    });
  });

  it('should skip stale or inactive password reset requests', async () => {
    authPasswordResetOtpRepositoryMock.findActiveDeliveryTargetById.mockResolvedValueOnce(
      null,
    );

    await expect(
      worker.process({
        id: 'job-2',
        name: 'auth.password_reset_mail',
        data: {
          passwordResetRequestId: 'reset-2',
          userId: 'user-1',
          to: 'user@classivo.dev',
          subject: 'Reset your password',
          html: '<p>123456</p>',
          text: '123456',
        },
      } as never),
    ).resolves.toBeUndefined();

    expect(authMailerServiceMock.sendPasswordResetMail).not.toHaveBeenCalled();
  });
});
