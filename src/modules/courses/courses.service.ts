import { Injectable } from '@nestjs/common';

@Injectable()
export class CoursesService {
  getStatus(): string {
    return 'courses module is ready';
  }
}
