import { Injectable } from '@nestjs/common';

@Injectable()
export class EnrollmentsService {
  getStatus(): string {
    return 'enrollments module is ready';
  }
}
