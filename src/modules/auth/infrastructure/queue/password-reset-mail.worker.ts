import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { DEFAULT_QUEUE_NAME } from '../../../../common/queue/queue.constants';
import { RedisService } from '../../../../common/redis/redis.service';
import { UserStatus } from '@prisma/client';
import { AuthMailerService } from '../notifications/auth-mailer.service';
import { AuthPasswordResetOtpRepository } from '../repositories/auth-password-reset-otp.repository';
import {
  AUTH_QUEUE_JOB_NAMES,
} from './auth-queue.constants';
import type { PasswordResetMailJobData } from './password-reset-mail.queue';

@Injectable()
export class PasswordResetMailWorker
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PasswordResetMailWorker.name);
  private worker?: Worker;

  constructor(
    private readonly redisService: RedisService,
    private readonly authMailerService: AuthMailerService,
    private readonly authPasswordResetOtpRepository: AuthPasswordResetOtpRepository,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      DEFAULT_QUEUE_NAME,
      async (job) => {
        if (job.name !== AUTH_QUEUE_JOB_NAMES.passwordResetMail) {
          return;
        }

        await this.process(job as Job<PasswordResetMailJobData>);
      },
      {
        connection: this.redisService.getConnectionOptions(),
        concurrency: 5,
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Password reset mail job failed: ${job?.id ?? 'unknown-job'}`,
        error.stack,
      );
    });
  }

  async process(job: Job<PasswordResetMailJobData>): Promise<void> {
    const resetRequest =
      await this.authPasswordResetOtpRepository.findActiveDeliveryTargetById(
        job.data.passwordResetRequestId,
      );

    if (
      !resetRequest ||
      resetRequest.userId !== job.data.userId ||
      resetRequest.email !== job.data.to ||
      resetRequest.user.status !== UserStatus.ACTIVE
    ) {
      this.logger.warn(
        `Skipping stale password reset mail job ${job.id ?? job.name}`,
      );
      return;
    }

    await this.authMailerService.sendPasswordResetMail({
      to: job.data.to,
      name: job.data.name,
      subject: job.data.subject,
      html: job.data.html,
      text: job.data.text,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
