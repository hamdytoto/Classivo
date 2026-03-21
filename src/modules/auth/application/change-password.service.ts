import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AUDIT_ACTIONS } from '../../../common/audit/audit.constants';
import { AuditLogService } from '../../../common/audit/audit-log.service';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { AUTH_ERROR_CODES } from '../domain/auth-errors';
import { SessionContext } from '../domain/auth.types';
import { AuthIdentityPolicy } from '../domain/policies/auth-identity.policy';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';
import { AuthUserRepository } from '../infrastructure/repositories/auth-user.repository';
import { PasswordHasherService } from '../infrastructure/security/password-hasher.service';

@Injectable()
export class ChangePasswordService {
  constructor(
    private readonly prismaTransactionService: PrismaTransactionService,
    private readonly authIdentityPolicy: AuthIdentityPolicy,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly authUserRepository: AuthUserRepository,
    private readonly passwordHasherService: PasswordHasherService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(
    userId: string,
    currentPassword: string,
    newPassword: string,
    sessionContext?: SessionContext,
  ): Promise<void> {
    const user = await this.authUserRepository.findForPasswordChange(userId);

    if (!user) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.userNotFound,
        message: 'User not found',
      });
    }

    this.authIdentityPolicy.assertUserIsActive(user.status);

    const isCurrentPasswordValid = await this.passwordHasherService.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.invalidCurrentPassword,
        message: 'Current password is incorrect',
      });
    }

    const newPasswordHash = await this.passwordHasherService.hash(newPassword);

    await this.prismaTransactionService.run(async (tx) => {
      await this.authUserRepository.updatePassword(
        userId,
        newPasswordHash,
        tx,
        new Date(),
      );

      const revokedSessions =
        await this.authSessionRepository.revokeManyByUserId(
          userId,
          new Date(),
          undefined,
          tx,
        );

      await this.auditLogService.log(
        {
          action: AUDIT_ACTIONS.authChangePassword,
          resource: 'user',
          resourceId: userId,
          actorId: userId,
          schoolId: user.schoolId,
          ipAddress: sessionContext?.ipAddress ?? null,
          metadata: {
            revokedSessionCount: revokedSessions.count,
            userAgent: sessionContext?.userAgent ?? null,
          },
        },
        tx,
      );
    });
  }
}
