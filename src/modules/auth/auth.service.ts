import { randomUUID } from 'crypto';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { compareHash, hash } from '../../common/security/hash.utils';
import { hashToken } from '../../common/security/jwt.utils';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterSchoolDto } from './dto/register-school.dto';
import { SessionContext } from './auth.types';
import {
  AUTH_ME_SELECT,
  AUTH_USER_SELECT,
  SCHOOL_PUBLIC_SELECT,
} from './auth.constants';
import { AuthIdentityService } from './auth-identity.service';
import { AuthPasswordResetService } from './auth-password-reset.service';
import { AuthRefreshSessionService } from './auth-refresh-session.service';
import { AuthSessionService } from './auth-session.service';
import { AuthTokenService } from './auth-token.service';
import { handlePrismaError } from '../../common/prisma/prisma-error.handler';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authIdentityService: AuthIdentityService,
    private readonly authPasswordResetService: AuthPasswordResetService,
    private readonly authRefreshSessionService: AuthRefreshSessionService,
    private readonly authSessionService: AuthSessionService,
    private readonly authTokenService: AuthTokenService,
    private readonly mailService: MailService,
  ) {}

  async login(dto: LoginDto, sessionContext?: SessionContext) {
    const identifier = this.authIdentityService.resolveLoginIdentifier(dto);

    const user = await this.prisma.user.findUnique({
      where: identifier,
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

    this.authIdentityService.assertUserIsActive(user.status);

    const authenticatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: AUTH_USER_SELECT,
    });
    const sessionId = randomUUID();
    const authTokens = await this.authTokenService.issueTokenPair(
      authenticatedUser,
      sessionId,
    );

    await this.authSessionService.createSession({
      sessionId,
      userId: authenticatedUser.id,
      refreshToken: authTokens.refreshToken,
      expiresAt: this.authTokenService.buildExpiryDate(
        authTokens.refreshExpiresIn,
      ),
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

    return this.authIdentityService.buildAuthenticatedActorProfile(user);
  }

  async sessions(actorId: string) {
    return this.authSessionService.listActiveSessions(actorId);
  }

  async revokeSession(sessionId: string, actorId: string): Promise<void> {
    const session = await this.authSessionService.findSession(sessionId);
    if (!session || session.userId !== actorId) {
      throw new NotFoundException({
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
      });
    }

    if (session.revokedAt) {
      return;
    }

    await this.authSessionService.revokeSession(session.id);
  }

  async registerSchool(
    dto: RegisterSchoolDto,
    sessionContext?: SessionContext,
  ) {
    const schoolCode = this.authIdentityService.normalizeSchoolCode(
      dto.schoolCode,
    );
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
            email: this.authIdentityService.normalizeEmail(dto.email),
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

        const authTokens = await this.authTokenService.issueTokenPair(
          user,
          sessionId,
        );

        await tx.session.create({
          data: {
            id: sessionId,
            userId: user.id,
            refreshTokenHash: hashToken(authTokens.refreshToken),
            ipAddress: sessionContext?.ipAddress ?? null,
            userAgent: sessionContext?.userAgent ?? null,
            expiresAt: this.authTokenService.buildExpiryDate(
              authTokens.refreshExpiresIn,
            ),
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
    const session = await this.authRefreshSessionService.validateRefreshSession(
      refreshToken,
      {
        includeUser: true,
        revokeOnInactiveUser: true,
      },
    );

    const authTokens = await this.authTokenService.issueTokenPair(
      session.user,
      session.id,
    );

    await this.authSessionService.rotateSession({
      sessionId: session.id,
      refreshToken: authTokens.refreshToken,
      expiresAt: this.authTokenService.buildExpiryDate(
        authTokens.refreshExpiresIn,
      ),
      sessionContext,
    });

    return {
      ...authTokens,
      user: session.user,
    };
  }

  async logout(refreshToken: string, actorId?: string): Promise<void> {
    const session = await this.authRefreshSessionService.validateRefreshSession(
      refreshToken,
      {
        actorId,
      },
    );

    await this.authSessionService.revokeSession(session.id);
  }

  async logoutAll(
    refreshToken: string,
    includeCurrent: boolean,
    actorId?: string,
  ): Promise<{ revokedCount: number }> {
    const session = await this.authRefreshSessionService.validateRefreshSession(
      refreshToken,
      {
        actorId,
      },
    );

    const excludeSessionId = includeCurrent ? undefined : session.id;
    const revokedCount = await this.authSessionService.revokeMultipleSessions(
      session.userId,
      excludeSessionId,
    );

    return { revokedCount };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
        status: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    this.authIdentityService.assertUserIsActive(user.status);

    const isCurrentPasswordValid = await compareHash(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CURRENT_PASSWORD',
        message: 'Current password is incorrect',
      });
    }

    const newPasswordHash = await hash(newPassword);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        },
      });

      await tx.session.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    });
  }

  async forgotPassword(
    email: string,
    sessionContext?: SessionContext,
  ): Promise<{ message: string }> {
    const normalizedEmail = this.authIdentityService.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        status: true,
      },
    });

    const response =
      this.authPasswordResetService.buildForgotPasswordResponse();

    if (!user || !user.email || user.status !== UserStatus.ACTIVE) {
      return response;
    }

    const userEmail = user.email;

    const otp = this.authPasswordResetService.generateOtp();
    const otpHash = await hash(otp);
    const expiresAt = this.authPasswordResetService.buildOtpExpiryDate();
    const mailContent = this.authPasswordResetService.buildResetMailContent(
      otp,
      expiresAt,
      user.firstName,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetOtp.updateMany({
        where: {
          userId: user.id,
          consumedAt: null,
        },
        data: {
          consumedAt: new Date(),
        },
      });

      await tx.passwordResetOtp.create({
        data: {
          userId: user.id,
          email: userEmail,
          codeHash: otpHash,
          expiresAt,
          requestedIpAddress: sessionContext?.ipAddress ?? null,
          requestedUserAgent: sessionContext?.userAgent ?? null,
        },
      });
    });

    try {
      await this.mailService.sendMail({
        to: userEmail,
        name: user.firstName,
        subject: mailContent.subject,
        html: mailContent.html,
        text: mailContent.text,
      });
    } catch (error) {
      await this.prisma.passwordResetOtp.deleteMany({
        where: {
          userId: user.id,
          consumedAt: null,
          codeHash: otpHash,
        },
      });

      throw error;
    }

    return response;
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<void> {
    const normalizedEmail = this.authIdentityService.normalizeEmail(email);
    const resetRecord = await this.prisma.passwordResetOtp.findFirst({
      where: {
        email: normalizedEmail,
        consumedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        codeHash: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    this.authPasswordResetService.assertResetRecordIsUsable(resetRecord);

    const isOtpValid = await compareHash(otp, resetRecord.codeHash);
    if (!isOtpValid) {
      this.authPasswordResetService.throwInvalidOtp();
    }

    const newPasswordHash = await hash(newPassword);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash: newPasswordHash,
        },
      });

      await tx.session.updateMany({
        where: {
          userId: resetRecord.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      await tx.passwordResetOtp.updateMany({
        where: {
          userId: resetRecord.userId,
          consumedAt: null,
        },
        data: {
          consumedAt: new Date(),
        },
      });
    });
  }
}
