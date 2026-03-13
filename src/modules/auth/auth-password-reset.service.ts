import { randomInt } from 'crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';

const PASSWORD_RESET_OTP_LENGTH = 6;
const DEFAULT_PASSWORD_RESET_OTP_TTL_MINUTES = 10;
const GENERIC_FORGOT_PASSWORD_MESSAGE =
  'If an active account exists for that email, a password reset OTP has been sent.';
const PASSWORD_RESET_EMAIL_SUBJECT = 'Classivo password reset OTP';

type ResetRecordShape = {
  user?: { status: UserStatus } | null;
  expiresAt: Date;
};

@Injectable()
export class AuthPasswordResetService {
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
      code: 'INVALID_PASSWORD_RESET_OTP',
      message: 'Password reset OTP is invalid or expired',
    });
  }

  buildResetMailContent(otp: string, expiresAt: Date, firstName?: string) {
    const greeting = firstName?.trim() ? `Hi ${firstName},` : 'Hi,';

    return {
      subject: PASSWORD_RESET_EMAIL_SUBJECT,
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <p>${greeting}</p>
        <p>Use the following one-time password to reset your Classivo account password:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
        <p>This code expires at ${expiresAt.toISOString()} and can only be used once.</p>
        <p>If you did not request this reset, you can ignore this email.</p>
      </div>
    `.trim(),
      text: `${greeting}

Use this one-time password to reset your Classivo password: ${otp}

This code expires at ${expiresAt.toISOString()} and can only be used once.

If you did not request this reset, you can ignore this email.`,
    };
  }
}
