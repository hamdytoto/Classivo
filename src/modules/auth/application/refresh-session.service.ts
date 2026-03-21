import { Injectable } from '@nestjs/common';
import { AUDIT_ACTIONS } from '../../../common/audit/audit.constants';
import { AuditLogService } from '../../../common/audit/audit-log.service';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { SessionContext } from '../domain/auth.types';
import { RefreshSessionPolicy } from '../domain/policies/refresh-session.policy';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';
import { AuthTokenService } from '../infrastructure/security/auth-token.service';
import { TokenHasherService } from '../infrastructure/security/token-hasher.service';

@Injectable()
export class RefreshSessionService {
  constructor(
    private readonly prismaTransactionService: PrismaTransactionService,
    private readonly refreshSessionPolicy: RefreshSessionPolicy,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly authTokenService: AuthTokenService,
    private readonly tokenHasherService: TokenHasherService,
    private readonly auditLogService: AuditLogService,
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
    const refreshExpiresAt = this.authTokenService.buildExpiryDate(
      authTokens.refreshExpiresIn,
    );

    await this.prismaTransactionService.run(async (tx) => {
      await this.authSessionRepository.rotate(
        {
          sessionId: session.id,
          refreshTokenHash: this.tokenHasherService.hash(
            authTokens.refreshToken,
          ),
          expiresAt: refreshExpiresAt,
          ipAddress: sessionContext?.ipAddress ?? null,
          userAgent: sessionContext?.userAgent ?? null,
        },
        tx,
      );

      await this.auditLogService.log(
        {
          action: AUDIT_ACTIONS.authRefresh,
          resource: 'session',
          resourceId: session.id,
          actorId: session.user.id,
          schoolId: session.user.schoolId,
          ipAddress: sessionContext?.ipAddress ?? null,
          metadata: {
            sessionId: session.id,
            userAgent: sessionContext?.userAgent ?? null,
          },
        },
        tx,
      );
    });

    return {
      ...authTokens,
      user: session.user,
    };
  }
}
