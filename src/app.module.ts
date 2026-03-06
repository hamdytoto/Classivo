import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { FEATURE_MODULES } from './modules';
import { RedisModule } from './common/redis/redis.module';
import { QueueModule } from './common/queue/queue.module';
import { StorageModule } from './common/storage/storage.module';

@Module({
  imports: [RedisModule, QueueModule, StorageModule, ...FEATURE_MODULES],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
