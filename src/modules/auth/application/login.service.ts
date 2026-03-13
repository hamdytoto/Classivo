import { randomUUID } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    private readonly authIdentityPolicy: AuthIdentityPolicy,
    private readonly authUserRepository: AuthUserRepository,
    private readonly authTokenService: AuthTokenService,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly passwordHasherService: PasswordHasherService,
    private readonly tokenHasherService: TokenHasherService,
  ) {}

  async execute(dto: LoginDto, sessionContext?: SessionContext) {
    const identifier = this.authIdentityPolicy.resolveLoginIdentifier(dto);
    const user = await this.authUserRepository.findForLogin(identifier);

    if (
      !user ||
      !(await this.passwordHasherService.compare(dto.password, user.passwordHash))
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
    const authTokens = await this.authTokenService.issueTokenPair(
      authenticatedUser,
      sessionId,
    );

    await this.authSessionRepository.create({
      id: sessionId,
      userId: authenticatedUser.id,
      refreshTokenHash: this.tokenHasherService.hash(authTokens.refreshToken),
      ipAddress: sessionContext?.ipAddress ?? null,
      userAgent: sessionContext?.userAgent ?? null,
      expiresAt: this.authTokenService.buildExpiryDate(
        authTokens.refreshExpiresIn,
      ),
    });

    return {
      ...authTokens,
      user: authenticatedUser,
    };
  }
}
