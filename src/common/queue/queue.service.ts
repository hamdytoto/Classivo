import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Job, JobsOptions, Queue, QueueEvents } from 'bullmq';
import { DEFAULT_QUEUE_NAME } from './queue.constants';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly queue: Queue;
  private readonly queueEvents: QueueEvents;

  constructor(private readonly redisService: RedisService) {
    const connection = this.redisService.getConnectionOptions();
    this.queue = new Queue(DEFAULT_QUEUE_NAME, { connection });
    this.queueEvents = new QueueEvents(DEFAULT_QUEUE_NAME, { connection });
  }

  add<T = unknown>(name: string, data: T, options?: JobsOptions): Promise<Job> {
    return this.queue.add(name, data, options);
  }

  getQueue(): Queue {
    return this.queue;
  }

  getQueueEvents(): QueueEvents {
    return this.queueEvents;
  }

  async onModuleDestroy(): Promise<void> {
    await this.queueEvents.close();
    await this.queue.close();
  }
}
