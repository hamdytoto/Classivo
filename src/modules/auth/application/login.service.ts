import { randomUUID } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AUDIT_ACTIONS } from '../../../common/audit/audit.constants';
import { AuditLogService } from '../../../common/audit/audit-log.service';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { AUTH_ERROR_CODES } from '../domain/auth-errors';
import { SessionContext } from '../domain/auth.types';
import { AuthIdentityPolicy } from '../domain/policies/auth-identity.policy';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';
import { AuthUserRepository } from '../infrastructure/repositories/auth-user.repository';
import { AuthTokenService } from '../infrastructure/security/auth-token.service';
import { PasswordHasherService } from '../infrastructure/security/password-hasher.service';
import { TokenHasherService } from '../infrastructure/security/token-hasher.service';
import { LoginDto } from '../interface/dto/login.dto';

@Injectable()
export class LoginService {
  constructor(
    private readonly prismaTransactionService: PrismaTransactionService,
    private readonly authIdentityPolicy: AuthIdentityPolicy,
    private readonly authUserRepository: AuthUserRepository,
    private readonly authTokenService: AuthTokenService,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly passwordHasherService: PasswordHasherService,
    private readonly tokenHasherService: TokenHasherService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(dto: LoginDto, sessionContext?: SessionContext) {
    const identifier = this.authIdentityPolicy.resolveLoginIdentifier(dto);
    const user = await this.authUserRepository.findForLogin(identifier);

    if (
      !user ||
      !(await this.passwordHasherService.compare(
        dto.password,
        user.passwordHash,
      ))
    ) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.invalidCredentials,
        message: 'Invalid login credentials',
      });
    }

    this.authIdentityPolicy.assertUserIsActive(user.status);

    const authenticatedUser =
      await this.authUserRepository.touchLastLoginAndGetAuthUser(user.id);
    const sessionId = randomUUID();
    const lastUsedAt = new Date();
    const authTokens = await this.authTokenService.issueTokenPair(
      authenticatedUser,
      sessionId,
    );
    const refreshExpiresAt = this.authTokenService.buildExpiryDate(
      authTokens.refreshExpiresIn,
    );

    await this.prismaTransactionService.run(async (tx) => {
      await this.authSessionRepository.create(
        {
          id: sessionId,
          userId: authenticatedUser.id,
          refreshTokenHash: this.tokenHasherService.hash(
            authTokens.refreshToken,
          ),
          ipAddress: sessionContext?.ipAddress ?? null,
          userAgent: sessionContext?.userAgent ?? null,
          lastUsedAt,
          expiresAt: refreshExpiresAt,
        },
        tx,
      );

      await this.auditLogService.log(
        {
          action: AUDIT_ACTIONS.authLogin,
          resource: 'session',
          resourceId: sessionId,
          actorId: authenticatedUser.id,
          schoolId: authenticatedUser.schoolId,
          ipAddress: sessionContext?.ipAddress ?? null,
          metadata: {
            sessionId,
            loginMethod: 'email' in identifier ? 'email' : 'phone',
            userAgent: sessionContext?.userAgent ?? null,
          },
        },
        tx,
      );
    });

    return {
      ...authTokens,
      user: authenticatedUser,
    };
  }
}
