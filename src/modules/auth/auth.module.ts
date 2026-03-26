import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { getJwtAccessTokenConfig } from '../../common/security/jwt.utils';
import { AuthController } from './interface/auth.controller';
import { MailModule } from '../mail/mail.module';
import { authProviders } from './auth.providers';

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
    ...authProviders,
  ],
  exports: [
    JwtModule,
  ],
})
export class AuthModule {}
