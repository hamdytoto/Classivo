import { Injectable } from '@nestjs/common';

@Injectable()
export class GradesService {
  getStatus(): string {
    return 'grades module is ready';
  }
}
