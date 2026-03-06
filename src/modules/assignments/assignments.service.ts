import { Injectable } from '@nestjs/common';

@Injectable()
export class AssignmentsService {
  getStatus(): string {
    return 'assignments module is ready';
  }
}
