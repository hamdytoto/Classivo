import { Injectable } from '@nestjs/common';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { AuthIdentityPolicy } from '../domain/policies/auth-identity.policy';
import { PasswordResetPolicy } from '../domain/policies/password-reset.policy';
import { AuthPasswordResetOtpRepository } from '../infrastructure/repositories/auth-password-reset-otp.repository';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';
import { AuthUserRepository } from '../infrastructure/repositories/auth-user.repository';
import { PasswordHasherService } from '../infrastructure/security/password-hasher.service';

@Injectable()
export class ConfirmPasswordResetService {
  constructor(
    private readonly prismaTransactionService: PrismaTransactionService,
    private readonly authIdentityPolicy: AuthIdentityPolicy,
    private readonly passwordResetPolicy: PasswordResetPolicy,
    private readonly authPasswordResetOtpRepository: AuthPasswordResetOtpRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly authUserRepository: AuthUserRepository,
    private readonly passwordHasherService: PasswordHasherService,
  ) {}

  async execute(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<void> {
    const normalizedEmail = this.authIdentityPolicy.normalizeEmail(email);
    const resetRecord =
      await this.authPasswordResetOtpRepository.findLatestActiveByEmail(
        normalizedEmail,
      );

    this.passwordResetPolicy.assertResetRecordIsUsable(resetRecord);

    const isOtpValid = await this.passwordHasherService.compare(
      otp,
      resetRecord.codeHash,
    );

    if (!isOtpValid) {
      this.passwordResetPolicy.throwInvalidOtp();
    }

    const newPasswordHash =
      await this.passwordHasherService.hash(newPassword);

    await this.prismaTransactionService.run(async (tx) => {
      await this.authUserRepository.updatePassword(
        resetRecord.userId,
        newPasswordHash,
        tx,
      );

      await this.authSessionRepository.revokeManyByUserId(
        resetRecord.userId,
        new Date(),
        undefined,
        tx,
      );

      await this.authPasswordResetOtpRepository.consumeActiveByUserId(
        resetRecord.userId,
        tx,
      );
    });
  }
}
