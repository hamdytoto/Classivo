import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  AuthRateLimitGuard,
  JwtAuthGuard,
  PermissionsGuard,
  RolesGuard,
} from '../../common/guards';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthorizationReadRepository } from '../../common/repositories/authorization-read.repository';
import { getJwtAccessTokenConfig } from '../../common/security/jwt.utils';
import { ChangePasswordService } from './application/change-password.service';
import { ConfirmPasswordResetService } from './application/confirm-password-reset.service';
import { GetCurrentUserProfileService } from './application/get-current-user-profile.service';
import { ListActiveSessionsService } from './application/list-active-sessions.service';
import { LoginService } from './application/login.service';
import { LogoutAllService } from './application/logout-all.service';
import { LogoutService } from './application/logout.service';
import { RefreshSessionService } from './application/refresh-session.service';
import { RegisterSchoolService } from './application/register-school.service';
import { RequestPasswordResetService } from './application/request-password-reset.service';
import { RevokeSessionService } from './application/revoke-session.service';
import { AuthService } from './auth.service';
import { AuthenticatedUserProfileBuilder } from './domain/builders/authenticated-user-profile.builder';
import { AuthIdentityPolicy } from './domain/policies/auth-identity.policy';
import { PasswordResetPolicy } from './domain/policies/password-reset.policy';
import { RefreshSessionPolicy } from './domain/policies/refresh-session.policy';
import { AuthMailerService } from './infrastructure/notifications/auth-mailer.service';
import { PasswordResetMailFactory } from './infrastructure/notifications/password-reset-mail.factory';
import { AuthPasswordResetOtpRepository } from './infrastructure/repositories/auth-password-reset-otp.repository';
import { AuthRoleRepository } from './infrastructure/repositories/auth-role.repository';
import { AuthSchoolRepository } from './infrastructure/repositories/auth-school.repository';
import { AuthSessionRepository } from './infrastructure/repositories/auth-session.repository';
import { AuthUserRepository } from './infrastructure/repositories/auth-user.repository';
import { AuthTokenService } from './infrastructure/security/auth-token.service';
import { PasswordHasherService } from './infrastructure/security/password-hasher.service';
import { TokenHasherService } from './infrastructure/security/token-hasher.service';
import { AuthController } from './interface/auth.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const jwtAccessConfig = getJwtAccessTokenConfig();
        return {
          secret: jwtAccessConfig.secret,
          signOptions: {
            expiresIn: jwtAccessConfig.expiresInSeconds,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LoginService,
    RefreshSessionService,
    LogoutService,
    LogoutAllService,
    RevokeSessionService,
    RegisterSchoolService,
    ChangePasswordService,
    RequestPasswordResetService,
    ConfirmPasswordResetService,
    GetCurrentUserProfileService,
    ListActiveSessionsService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    AuthRateLimitGuard,
    AuthIdentityPolicy,
    PasswordResetPolicy,
    RefreshSessionPolicy,
    AuthenticatedUserProfileBuilder,
    AuthMailerService,
    PasswordResetMailFactory,
    PasswordHasherService,
    TokenHasherService,
    AuthTokenService,
    AuthUserRepository,
    AuthSchoolRepository,
    AuthRoleRepository,
    AuthSessionRepository,
    AuthPasswordResetOtpRepository,
    AuthorizationReadRepository,
  ],
  exports: [
    AuthService,
    JwtModule,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    AuthRateLimitGuard,
  ],
})
export class AuthModule {}
