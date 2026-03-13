import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  AuthRateLimitGuard,
  JwtAuthGuard,
  PermissionsGuard,
  RolesGuard,
} from '../../common/guards';
import { getJwtAccessTokenConfig } from '../../common/security/jwt.utils';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthIdentityService } from './auth-identity.service';
import { AuthPasswordResetService } from './auth-password-reset.service';
import { AuthRefreshSessionService } from './auth-refresh-session.service';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { AuthTokenService } from './auth-token.service';

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
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    AuthRateLimitGuard,
    AuthIdentityService,
    AuthPasswordResetService,
    AuthRefreshSessionService,
    AuthSessionService,
    AuthTokenService,
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
