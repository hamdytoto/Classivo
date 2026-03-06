import { Injectable } from '@nestjs/common';

@Injectable()
export class ExamsService {
  getStatus(): string {
    return 'exams module is ready';
  }
}
