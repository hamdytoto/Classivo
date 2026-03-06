import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { getRedisConnectionOptions } from '../config/redis.config';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const connection = getRedisConnectionOptions();
        return new Redis({
          ...connection,
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
        });
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
