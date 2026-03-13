import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { LoginDto } from './dto/login.dto';

type MeUserRoleAssignment = {
  role: {
    code: string;
    permissions: Array<{
      permission: { code: string };
    }>;
  };
};

type MeUserShape = {
  id: string;
  schoolId: string | null;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: MeUserRoleAssignment[];
};

@Injectable()
export class AuthIdentityService {
  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  normalizeSchoolCode(code: string): string {
    return code.trim().toUpperCase();
  }

  resolveLoginIdentifier(dto: LoginDto): { email: string } | { phone: string } {
    const email = dto.email?.trim();
    const phone = dto.phone?.trim();
    const hasEmail = Boolean(email);
    const hasPhone = Boolean(phone);

    if (hasEmail === hasPhone) {
      throw new BadRequestException({
        code: 'INVALID_LOGIN_IDENTIFIER',
        message: 'Provide either email or phone, but not both',
      });
    }

    if (email) {
      return { email: this.normalizeEmail(email) };
    }

    return { phone: phone! };
  }

  assertUserIsActive(status: UserStatus): void {
    if (status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is not active',
      });
    }
  }

  buildAuthenticatedActorProfile(user: MeUserShape) {
    const roles = user.roles.map((assignment) => assignment.role.code);
    const permissions = [
      ...new Set(
        user.roles.flatMap((assignment) =>
          assignment.role.permissions.map((entry) => entry.permission.code),
        ),
      ),
    ];

    return {
      id: user.id,
      schoolId: user.schoolId,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles,
      permissions,
    };
  }
}
