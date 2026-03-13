import { Injectable } from '@nestjs/common';
import { PasswordResetMailContent } from '../../domain/auth.types';

const PASSWORD_RESET_EMAIL_SUBJECT = 'Classivo password reset OTP';

@Injectable()
export class PasswordResetMailFactory {
  build(params: {
    otp: string;
    expiresAt: Date;
    firstName?: string;
  }): PasswordResetMailContent {
    const greeting = params.firstName?.trim()
      ? `Hi ${params.firstName},`
      : 'Hi,';

    return {
      subject: PASSWORD_RESET_EMAIL_SUBJECT,
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <p>${greeting}</p>
        <p>Use the following one-time password to reset your Classivo account password:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${params.otp}</p>
        <p>This code expires at ${params.expiresAt.toISOString()} and can only be used once.</p>
        <p>If you did not request this reset, you can ignore this email.</p>
      </div>
    `.trim(),
      text: `${greeting}

Use this one-time password to reset your Classivo password: ${params.otp}

This code expires at ${params.expiresAt.toISOString()} and can only be used once.

If you did not request this reset, you can ignore this email.`,
    };
  }
}
