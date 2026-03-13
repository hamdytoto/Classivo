import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthIdentityService } from './auth-identity.service';
import { AuthSessionService } from './auth-session.service';
import { AuthTokenService } from './auth-token.service';

type SessionWithUser = NonNullable<
  Awaited<ReturnType<AuthSessionService['findSessionWithUser']>>
>;

type SessionWithoutUser = NonNullable<
  Awaited<ReturnType<AuthSessionService['findSession']>>
>;

@Injectable()
export class AuthRefreshSessionService {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly authSessionService: AuthSessionService,
    private readonly authIdentityService: AuthIdentityService,
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
        code: 'SESSION_OWNERSHIP_MISMATCH',
        message: 'Refresh token does not belong to the authenticated user',
      });
    }

    if (options?.includeUser) {
      const session = await this.authSessionService.findSessionWithUser(
        payload.sid,
      );

      this.assertSessionMatchesPayload(session, payload.sub);
      await this.assertSessionIsUsable(session, refreshToken);

      if (options.revokeOnInactiveUser) {
        try {
          this.authIdentityService.assertUserIsActive(session.user.status);
        } catch (error) {
          await this.authSessionService.revokeSession(session.id);
          throw error;
        }

        return session;
      }

      this.authIdentityService.assertUserIsActive(session.user.status);
      return session;
    }

    const session = await this.authSessionService.findSession(payload.sid);

    this.assertSessionMatchesPayload(session, payload.sub);
    await this.assertSessionIsUsable(session, refreshToken);

    return session;
  }

  private assertSessionMatchesPayload(
    session: SessionWithUser | SessionWithoutUser | null,
    expectedUserId: string,
  ): asserts session is SessionWithUser | SessionWithoutUser {
    if (!session || session.userId !== expectedUserId) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
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

    try {
      this.authSessionService.assertRefreshTokenMatches(
        session.refreshTokenHash,
        refreshToken,
      );
    } catch (error) {
      await this.authSessionService.revokeSession(session.id);
      throw error;
    }
  }
}
