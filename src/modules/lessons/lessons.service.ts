import { Injectable } from '@nestjs/common';

@Injectable()
export class LessonsService {
  getStatus(): string {
    return 'lessons module is ready';
  }
}
