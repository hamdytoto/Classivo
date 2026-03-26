import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../common/queue/queue.service';
import { AUTH_QUEUE_JOB_NAMES } from './auth-queue.constants';

export type PasswordResetMailJobData = {
  passwordResetRequestId: string;
  userId: string;
  to: string;
  name?: string;
  subject: string;
  html: string;
  text: string;
};

@Injectable()
export class PasswordResetMailQueue {
  constructor(private readonly queueService: QueueService) {}

  enqueue(data: PasswordResetMailJobData) {
    return this.queueService.add(
      AUTH_QUEUE_JOB_NAMES.passwordResetMail,
      data,
      {
        jobId: `password-reset-mail:${data.passwordResetRequestId}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
  }
}
