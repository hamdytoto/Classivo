import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { AUTH_ERROR_CODES } from '../auth-errors';

@Injectable()
export class AuthIdentityPolicy {
  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  normalizeSchoolCode(code: string): string {
    return code.trim().toUpperCase();
  }

  resolveLoginIdentifier(dto: {
    email?: string;
    phone?: string;
  }): { email: string } | { phone: string } {
    const email = dto.email?.trim();
    const phone = dto.phone?.trim();
    const hasEmail = Boolean(email);
    const hasPhone = Boolean(phone);

    if (hasEmail === hasPhone) {
      throw new BadRequestException({
        code: AUTH_ERROR_CODES.invalidLoginIdentifier,
        message: 'Provide either email or phone, but not both',
      });
    }

    if (email) {
      return { email: this.normalizeEmail(email) };
    }

    return { phone: phone! };
  }

  assertUserIsActive(status: UserStatus): void {
    switch (status) {
      case UserStatus.ACTIVE:
        return;
      case UserStatus.SUSPENDED:
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.accountSuspended,
          message: 'Account is suspended',
        });
      case UserStatus.DISABLED:
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.accountDisabled,
          message: 'Account is disabled',
        });
      default:
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.accountInactive,
          message: 'Account is not active',
        });
    }
  }
}
