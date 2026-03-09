import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { compareHash } from '../../common/security/hash.utils';
import {
  getJwtAccessTokenConfig,
  getJwtRefreshTokenConfig,
  hashToken,
} from '../../common/security/jwt.utils';
import { LoginDto } from './dto/login.dto';

const AUTH_USER_SELECT = {
  id: true,
  schoolId: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SessionContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

type AuthenticatedUser = {
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
};

type AccessTokenPayload = {
  sub: string;
  schoolId: string | null;
  email: string | null;
  phone: string | null;
  status: UserStatus;
};

type RefreshTokenPayload = {
  sub: string;
  sid: string;
  type: 'refresh';
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  getStatus(): string {
    return 'auth module is ready';
  }

  async login(dto: LoginDto, sessionContext?: SessionContext) {
    this.ensureSingleIdentifier(dto.email, dto.phone);

    const user = await this.prisma.user.findUnique({
      where: dto.email ? { email: dto.email } : { phone: dto.phone },
      select: {
        id: true,
        status: true,
        passwordHash: true,
      },
    });

    if (!user || !compareHash(dto.password, user.passwordHash)) {
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
    const authTokens = await this.issueTokenPair(authenticatedUser, sessionId);

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: authenticatedUser.id,
        refreshTokenHash: hashToken(authTokens.refreshToken),
        ipAddress: sessionContext?.ipAddress ?? null,
        userAgent: sessionContext?.userAgent ?? null,
        expiresAt: this.buildExpiryDate(authTokens.refreshExpiresIn),
      },
    });

    return {
      ...authTokens,
      user: authenticatedUser,
    };
  }

  async refresh(refreshToken: string, sessionContext?: SessionContext) {
    const payload = await this.verifyRefreshToken(refreshToken);
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
      await this.revokeSession(session.id);
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired',
      });
    }

    if (session.refreshTokenHash !== hashToken(refreshToken)) {
      await this.revokeSession(session.id);
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REUSED',
        message: 'Refresh token reuse detected',
      });
    }

    if (session.user.status !== UserStatus.ACTIVE) {
      await this.revokeSession(session.id);
      throw new UnauthorizedException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is not active',
      });
    }

    const authTokens = await this.issueTokenPair(session.user, session.id);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: hashToken(authTokens.refreshToken),
        expiresAt: this.buildExpiryDate(authTokens.refreshExpiresIn),
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
    const payload = await this.verifyRefreshToken(refreshToken);

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
      await this.revokeSession(session.id);
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REUSED',
        message: 'Refresh token reuse detected',
      });
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.revokeSession(session.id);
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired',
      });
    }

    await this.revokeSession(session.id);
  }

  private ensureSingleIdentifier(email?: string, phone?: string): void {
    if (!email && !phone) {
      throw new BadRequestException({
        code: 'IDENTIFIER_REQUIRED',
        message: 'Either email or phone must be provided',
      });
    }

    if (email && phone) {
      throw new BadRequestException({
        code: 'IDENTIFIER_AMBIGUOUS',
        message: 'Provide only one of email or phone',
      });
    }
  }

  private async issueTokenPair(
    user: AuthenticatedUser,
    sessionId: string,
  ): Promise<{
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    refreshToken: string;
    refreshExpiresIn: number;
  }> {
    const accessConfig = getJwtAccessTokenConfig();
    const refreshConfig = getJwtRefreshTokenConfig();
    const accessPayload = this.buildAccessTokenPayload(user);
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      sid: sessionId,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessConfig.secret,
        expiresIn: accessConfig.expiresInSeconds,
        jwtid: randomUUID(),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshConfig.secret,
        expiresIn: refreshConfig.expiresInSeconds,
        jwtid: randomUUID(),
      }),
    ]);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: accessConfig.expiresInSeconds,
      refreshToken,
      refreshExpiresIn: refreshConfig.expiresInSeconds,
    };
  }

  private buildAccessTokenPayload(user: AuthenticatedUser): AccessTokenPayload {
    return {
      sub: user.id,
      schoolId: user.schoolId ?? null,
      email: user.email ?? null,
      phone: user.phone ?? null,
      status: user.status,
    };
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    const normalizedRefreshToken = refreshToken.trim();

    if (!normalizedRefreshToken) {
      throw new BadRequestException({
        code: 'REFRESH_TOKEN_REQUIRED',
        message: 'Refresh token is required',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        normalizedRefreshToken,
        {
          secret: getJwtRefreshTokenConfig().secret,
        },
      );

      if (!payload.sid || !payload.sub || payload.type !== 'refresh') {
        throw new UnauthorizedException({
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is invalid',
        });
      }

      return payload;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Refresh token has expired',
        });
      }

      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid',
      });
    }
  }

  private async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private buildExpiryDate(expiresInSeconds: number): Date {
    return new Date(Date.now() + expiresInSeconds * 1000);
  }
}
