import { Injectable } from '@nestjs/common';
import { SessionContext } from '../domain/auth.types';
import { RefreshSessionPolicy } from '../domain/policies/refresh-session.policy';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';
import { AuthTokenService } from '../infrastructure/security/auth-token.service';
import { TokenHasherService } from '../infrastructure/security/token-hasher.service';

@Injectable()
export class RefreshSessionService {
  constructor(
    private readonly refreshSessionPolicy: RefreshSessionPolicy,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly authTokenService: AuthTokenService,
    private readonly tokenHasherService: TokenHasherService,
  ) {}

  async execute(refreshToken: string, sessionContext?: SessionContext) {
    const session = await this.refreshSessionPolicy.validateRefreshSession(
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

    await this.authSessionRepository.rotate({
      sessionId: session.id,
      refreshTokenHash: this.tokenHasherService.hash(authTokens.refreshToken),
      expiresAt: this.authTokenService.buildExpiryDate(
        authTokens.refreshExpiresIn,
      ),
      ipAddress: sessionContext?.ipAddress ?? null,
      userAgent: sessionContext?.userAgent ?? null,
    });

    return {
      ...authTokens,
      user: session.user,
    };
  }
}
