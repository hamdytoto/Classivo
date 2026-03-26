import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { FEATURE_MODULES } from './modules';
import { RedisModule } from './common/redis/redis.module';
import { QueueModule } from './common/queue/queue.module';
import { StorageModule } from './common/storage/storage.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { MailModule } from './modules/mail/mail.module';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from './common/guards';
import { AuthorizationReadRepository } from './common/repositories/authorization-read.repository';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    QueueModule,
    StorageModule,
    MailModule,
    ...FEATURE_MODULES,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    AuthorizationReadRepository,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    {
      provide: APP_GUARD,
      useExisting: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
