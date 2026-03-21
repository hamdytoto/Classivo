import { Injectable } from '@nestjs/common';
import { AUDIT_ACTIONS } from '../../../common/audit/audit.constants';
import { AuditLogService } from '../../../common/audit/audit-log.service';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { SessionContext } from '../domain/auth.types';
import { RefreshSessionPolicy } from '../domain/policies/refresh-session.policy';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';

@Injectable()
export class LogoutAllService {
  constructor(
    private readonly prismaTransactionService: PrismaTransactionService,
    private readonly refreshSessionPolicy: RefreshSessionPolicy,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(
    refreshToken: string,
    includeCurrent: boolean,
    actorId?: string,
    sessionContext?: SessionContext,
  ): Promise<{ revokedCount: number }> {
    const session = await this.refreshSessionPolicy.validateRefreshSession(
      refreshToken,
      {
        actorId,
        includeUser: true,
      },
    );

    const result = await this.prismaTransactionService.run(async (tx) => {
      const revokedSessions =
        await this.authSessionRepository.revokeManyByUserId(
          session.userId,
          new Date(),
          includeCurrent ? undefined : session.id,
          tx,
        );

      await this.auditLogService.log(
        {
          action: AUDIT_ACTIONS.authLogoutAll,
          resource: 'user',
          resourceId: session.user.id,
          actorId: session.user.id,
          schoolId: session.user.schoolId,
          ipAddress: sessionContext?.ipAddress ?? null,
          metadata: {
            currentSessionId: session.id,
            includeCurrent,
            revokedCount: revokedSessions.count,
            userAgent: sessionContext?.userAgent ?? null,
          },
        },
        tx,
      );

      return revokedSessions;
    });

    return { revokedCount: result.count };
  }
}
