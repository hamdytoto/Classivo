import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { getRedisConnectionOptions } from '../config/redis.config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  getClient(): Redis {
    return this.client;
  }

  getConnectionOptions() {
    return getRedisConnectionOptions();
  }

  async ping(): Promise<string> {
    const result = await this.client.ping();
    this.logger.debug(`Redis ping result: ${result}`);
    return result;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
