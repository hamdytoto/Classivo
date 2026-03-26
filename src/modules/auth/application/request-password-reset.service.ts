import { Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { SessionContext } from '../domain/auth.types';
import { AuthIdentityPolicy } from '../domain/policies/auth-identity.policy';
import { PasswordResetPolicy } from '../domain/policies/password-reset.policy';
import { PasswordResetMailFactory } from '../infrastructure/notifications/password-reset-mail.factory';
import { PasswordResetMailQueue } from '../infrastructure/queue/password-reset-mail.queue';
import { AuthPasswordResetOtpRepository } from '../infrastructure/repositories/auth-password-reset-otp.repository';
import { AuthUserRepository } from '../infrastructure/repositories/auth-user.repository';
import { PasswordHasherService } from '../infrastructure/security/password-hasher.service';

@Injectable()
export class RequestPasswordResetService {
  constructor(
    private readonly prismaTransactionService: PrismaTransactionService,
    private readonly authIdentityPolicy: AuthIdentityPolicy,
    private readonly passwordResetPolicy: PasswordResetPolicy,
    private readonly passwordResetMailFactory: PasswordResetMailFactory,
    private readonly passwordResetMailQueue: PasswordResetMailQueue,
    private readonly authPasswordResetOtpRepository: AuthPasswordResetOtpRepository,
    private readonly authUserRepository: AuthUserRepository,
    private readonly passwordHasherService: PasswordHasherService,
  ) {}

  async execute(
    email: string,
    sessionContext?: SessionContext,
  ): Promise<{ message: string }> {
    const normalizedEmail = this.authIdentityPolicy.normalizeEmail(email);
    const user =
      await this.authUserRepository.findForForgotPassword(normalizedEmail);
    const response =
      this.passwordResetPolicy.buildForgotPasswordResponse();

    if (!user || !user.email || user.status !== UserStatus.ACTIVE) {
      return response;
    }

    const userEmail = user.email;
    const otp = this.passwordResetPolicy.generateOtp();
    const otpHash = await this.passwordHasherService.hash(otp);
    const expiresAt = this.passwordResetPolicy.buildOtpExpiryDate();
    const mailContent = this.passwordResetMailFactory.build({
      otp,
      expiresAt,
      firstName: user.firstName,
    });

    const resetRequest = await this.prismaTransactionService.run(async (tx) => {
      await this.authPasswordResetOtpRepository.invalidateActiveByUserId(
        user.id,
        tx,
      );

      return this.authPasswordResetOtpRepository.create(
        {
          userId: user.id,
          email: userEmail,
          codeHash: otpHash,
          expiresAt,
          requestedIpAddress: sessionContext?.ipAddress ?? null,
          requestedUserAgent: sessionContext?.userAgent ?? null,
        },
        tx,
      );
    });

    try {
      await this.passwordResetMailQueue.enqueue({
        passwordResetRequestId: resetRequest.id,
        userId: user.id,
        to: userEmail,
        name: user.firstName,
        subject: mailContent.subject,
        html: mailContent.html,
        text: mailContent.text,
      });
    } catch (error) {
      await this.authPasswordResetOtpRepository.deleteActiveByUserIdAndCodeHash(
        user.id,
        otpHash,
      );

      throw error;
    }

    return response;
  }
}
