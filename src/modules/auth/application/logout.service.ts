import { Injectable } from '@nestjs/common';
import { AUDIT_ACTIONS } from '../../../common/audit/audit.constants';
import { AuditLogService } from '../../../common/audit/audit-log.service';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { SessionContext } from '../domain/auth.types';
import { RefreshSessionPolicy } from '../domain/policies/refresh-session.policy';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';

@Injectable()
export class LogoutService {
  constructor(
    private readonly prismaTransactionService: PrismaTransactionService,
    private readonly refreshSessionPolicy: RefreshSessionPolicy,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(
    refreshToken: string,
    actorId?: string,
    sessionContext?: SessionContext,
  ): Promise<void> {
    const session = await this.refreshSessionPolicy.validateRefreshSession(
      refreshToken,
      {
        actorId,
        includeUser: true,
      },
    );

    await this.prismaTransactionService.run(async (tx) => {
      await this.authSessionRepository.revokeById(session.id, new Date(), tx);
      await this.auditLogService.log(
        {
          action: AUDIT_ACTIONS.authLogout,
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
  }
}
