import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_ERROR_CODES } from '../auth-errors';
import { AuthIdentityPolicy } from './auth-identity.policy';
import { AuthSessionRepository } from '../../infrastructure/repositories/auth-session.repository';
import { AuthTokenService } from '../../infrastructure/security/auth-token.service';
import { TokenHasherService } from '../../infrastructure/security/token-hasher.service';

type SessionWithUser = NonNullable<
  Awaited<ReturnType<AuthSessionRepository['findByIdWithUser']>>
>;

type SessionWithoutUser = NonNullable<
  Awaited<ReturnType<AuthSessionRepository['findById']>>
>;

@Injectable()
export class RefreshSessionPolicy {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly tokenHasherService: TokenHasherService,
    private readonly authIdentityPolicy: AuthIdentityPolicy,
  ) {}

  async validateRefreshSession(
    refreshToken: string,
    options: {
      actorId?: string;
      includeUser: true;
      revokeOnInactiveUser?: boolean;
    },
  ): Promise<SessionWithUser>;
  async validateRefreshSession(
    refreshToken: string,
    options?: {
      actorId?: string;
      includeUser?: false;
      revokeOnInactiveUser?: boolean;
    },
  ): Promise<SessionWithoutUser>;
  async validateRefreshSession(
    refreshToken: string,
    options?: {
      actorId?: string;
      includeUser?: boolean;
      revokeOnInactiveUser?: boolean;
    },
  ): Promise<SessionWithUser | SessionWithoutUser> {
    const payload =
      await this.authTokenService.verifyRefreshToken(refreshToken);

    if (options?.actorId && options.actorId !== payload.sub) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.sessionOwnershipMismatch,
        message: 'Refresh token does not belong to the authenticated user',
      });
    }

    if (options?.includeUser) {
      const session = await this.authSessionRepository.findByIdWithUser(
        payload.sid,
      );

      this.assertSessionMatchesPayload(session, payload.sub);
      await this.assertSessionIsUsable(session, refreshToken);

      if (options.revokeOnInactiveUser) {
        try {
          this.authIdentityPolicy.assertUserIsActive(session.user.status);
        } catch (error) {
          await this.revokeSession(session.id);
          throw error;
        }
      } else {
        this.authIdentityPolicy.assertUserIsActive(session.user.status);
      }

      return session;
    }

    const session = await this.authSessionRepository.findById(payload.sid);

    this.assertSessionMatchesPayload(session, payload.sub);
    await this.assertSessionIsUsable(session, refreshToken);

    return session;
  }

  async validateRefreshSessionWithUser(
    refreshToken: string,
    options?: {
      actorId?: string;
      revokeOnInactiveUser?: boolean;
    },
  ): Promise<SessionWithUser> {
    return this.validateRefreshSession(refreshToken, {
      ...options,
      includeUser: true,
    });
  }

  private assertSessionMatchesPayload(
    session: SessionWithUser | SessionWithoutUser | null,
    expectedUserId: string,
  ): asserts session is SessionWithUser | SessionWithoutUser {
    if (!session || session.userId !== expectedUserId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.invalidRefreshToken,
        message: 'Refresh token is invalid',
      });
    }
  }

  private async assertSessionIsUsable(
    session: SessionWithUser | SessionWithoutUser,
    refreshToken: string,
  ): Promise<void> {
    if (session.revokedAt) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.refreshTokenRevoked,
        message: 'Refresh token has been revoked',
      });
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.revokeSession(session.id);
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.refreshTokenExpired,
        message: 'Refresh token has expired',
      });
    }

    if (
      session.refreshTokenHash !== this.tokenHasherService.hash(refreshToken)
    ) {
      await this.revokeSession(session.id);
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.refreshTokenReused,
        message: 'Refresh token reuse detected',
      });
    }
  }

  private async revokeSession(sessionId: string): Promise<void> {
    await this.authSessionRepository.revokeById(sessionId, new Date());
  }
}
