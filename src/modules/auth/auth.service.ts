import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { compareHash, hash } from '../../common/security/hash.utils';
import {
  hashToken,
} from '../../common/security/jwt.utils';
import { LoginDto } from './dto/login.dto';
import { RegisterSchoolDto } from './dto/register-school.dto';
import {
  SessionContext,
} from './auth.types';
import {
  AUTH_ME_SELECT,
  AUTH_USER_SELECT,
  SCHOOL_PUBLIC_SELECT,
} from './auth.constants';
import { AuthSessionService } from './auth-session.service';
import { AuthTokenService } from './auth-token.service';
import { handlePrismaError } from '../../common/prisma/prisma-error.handler';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authSessionService: AuthSessionService,
    private readonly authTokenService: AuthTokenService,
  ) { }

  async login(dto: LoginDto, sessionContext?: SessionContext) {
    const user = await this.prisma.user.findUnique({
      where: dto.email ? { email: dto.email } : { phone: dto.phone },
      select: {
        id: true,
        status: true,
        passwordHash: true,
      },
    });

    if (!user || !(await compareHash(dto.password, user.passwordHash))) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid login credentials',
      });
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is not active',
      });
    }

    const authenticatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: AUTH_USER_SELECT,
    });
    const sessionId = randomUUID();
    const authTokens = await this.authTokenService.issueTokenPair(authenticatedUser, sessionId);

    await this.authSessionService.createSession({
      sessionId,
      userId: authenticatedUser.id,
      refreshToken: authTokens.refreshToken,
      expiresAt: this.authTokenService.buildExpiryDate(authTokens.refreshExpiresIn),
      sessionContext,
    });

    return {
      ...authTokens,
      user: authenticatedUser,
    };
  }

  async me(actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: AUTH_ME_SELECT,
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Authenticated user was not found',
      });
    }

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

  async sessions(actorId: string) {
    return this.authSessionService.listActiveSessions(actorId);
  }

  async registerSchool(
    dto: RegisterSchoolDto,
    sessionContext?: SessionContext,
  ) {
    const schoolCode = this.normalizeSchoolCode(dto.schoolCode);
    const schoolAdminRole = await this.prisma.role.findUnique({
      where: { code: 'SCHOOL_ADMIN' },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    if (!schoolAdminRole) {
      throw new InternalServerErrorException({
        code: 'BASELINE_ROLE_NOT_FOUND',
        message: 'Baseline role SCHOOL_ADMIN is not configured',
      });
    }

    const passwordHash = await hash(dto.password);
    const sessionId = randomUUID();

    try {
      return await this.prisma.$transaction(async (tx) => {
        const school = await tx.school.create({
          data: {
            name: dto.schoolName.trim(),
            code: schoolCode,
          },
          select: SCHOOL_PUBLIC_SELECT,
        });

        const user = await tx.user.create({
          data: {
            schoolId: school.id,
            email: dto.email.trim().toLowerCase(),
            phone: dto.phone?.trim() || null,
            passwordHash,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            status: UserStatus.ACTIVE,
          },
          select: AUTH_USER_SELECT,
        });

        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: schoolAdminRole.id,
          },
        });

        const authTokens = await this.authTokenService.issueTokenPair(user, sessionId);

        await tx.session.create({
          data: {
            id: sessionId,
            userId: user.id,
            refreshTokenHash: hashToken(authTokens.refreshToken),
            ipAddress: sessionContext?.ipAddress ?? null,
            userAgent: sessionContext?.userAgent ?? null,
            expiresAt: this.authTokenService.buildExpiryDate(authTokens.refreshExpiresIn),
          },
        });

        return {
          ...authTokens,
          school,
          user,
          assignedRole: schoolAdminRole,
        };
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async refresh(refreshToken: string, sessionContext?: SessionContext) {
    const payload = await this.authTokenService.verifyRefreshToken(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      select: {
        id: true,
        userId: true,
        refreshTokenHash: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: AUTH_USER_SELECT,
        },
      },
    });

    if (!session || session.userId !== payload.sub) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid',
      });
    }

    if (session.revokedAt) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REVOKED',
        message: 'Refresh token has been revoked',
      });
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.authSessionService.revokeSession(session.id);
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired',
      });
    }

    if (session.refreshTokenHash !== hashToken(refreshToken)) {
      await this.authSessionService.revokeSession(session.id);
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REUSED',
        message: 'Refresh token reuse detected',
      });
    }

    if (session.user.status !== UserStatus.ACTIVE) {
      await this.authSessionService.revokeSession(session.id);
      throw new UnauthorizedException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is not active',
      });
    }

    const authTokens = await this.authTokenService.issueTokenPair(session.user, session.id);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: hashToken(authTokens.refreshToken),
        expiresAt: this.authTokenService.buildExpiryDate(authTokens.refreshExpiresIn),
        ipAddress: sessionContext?.ipAddress ?? null,
        userAgent: sessionContext?.userAgent ?? null,
      },
    });

    return {
      ...authTokens,
      user: session.user,
    };
  }

  async logout(refreshToken: string, actorId?: string): Promise<void> {
    const payload = await this.authTokenService.verifyRefreshToken(refreshToken);

    if (actorId && actorId !== payload.sub) {
      throw new UnauthorizedException({
        code: 'SESSION_OWNERSHIP_MISMATCH',
        message: 'Refresh token does not belong to the authenticated user',
      });
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      select: {
        id: true,
        userId: true,
        refreshTokenHash: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    if (!session || session.userId !== payload.sub) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid',
      });
    }

    if (session.refreshTokenHash !== hashToken(refreshToken)) {
      await this.authSessionService.revokeSession(session.id);
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REUSED',
        message: 'Refresh token reuse detected',
      });
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.authSessionService.revokeSession(session.id);
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired',
      });
    }

    await this.authSessionService.revokeSession(session.id);
  }

  private normalizeSchoolCode(code: string): string {
    return code.trim().toUpperCase();
  }
}
