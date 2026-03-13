import { randomInt } from 'crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { AUTH_ERROR_CODES } from '../auth-errors';

const PASSWORD_RESET_OTP_LENGTH = 6;
const DEFAULT_PASSWORD_RESET_OTP_TTL_MINUTES = 10;
const GENERIC_FORGOT_PASSWORD_MESSAGE =
  'If an active account exists for that email, a password reset OTP has been sent.';

type ResetRecordShape = {
  userId: string;
  codeHash: string;
  user?: { status: UserStatus } | null;
  expiresAt: Date;
};

@Injectable()
export class PasswordResetPolicy {
  buildForgotPasswordResponse(): { message: string } {
    return {
      message: GENERIC_FORGOT_PASSWORD_MESSAGE,
    };
  }

  generateOtp(): string {
    return randomInt(
      10 ** (PASSWORD_RESET_OTP_LENGTH - 1),
      10 ** PASSWORD_RESET_OTP_LENGTH,
    ).toString();
  }

  buildOtpExpiryDate(): Date {
    const ttlMinutes = Number(
      process.env.PASSWORD_RESET_OTP_TTL_MINUTES ??
        DEFAULT_PASSWORD_RESET_OTP_TTL_MINUTES,
    );

    return new Date(Date.now() + ttlMinutes * 60_000);
  }

  assertResetRecordIsUsable(
    resetRecord: ResetRecordShape | null,
  ): asserts resetRecord is ResetRecordShape & {
    user: { status: UserStatus };
  } {
    if (
      !resetRecord ||
      !resetRecord.user ||
      resetRecord.user.status !== UserStatus.ACTIVE ||
      resetRecord.expiresAt.getTime() <= Date.now()
    ) {
      this.throwInvalidOtp();
    }
  }

  throwInvalidOtp(): never {
    throw new BadRequestException({
      code: AUTH_ERROR_CODES.invalidPasswordResetOtp,
      message: 'Password reset OTP is invalid or expired',
    });
  }
}
