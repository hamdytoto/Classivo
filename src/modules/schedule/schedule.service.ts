import { Injectable } from '@nestjs/common';

@Injectable()
export class ScheduleService {
  getStatus(): string {
    return 'schedule module is ready';
  }
}
