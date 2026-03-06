import { Injectable } from '@nestjs/common';

@Injectable()
export class AttendanceService {
  getStatus(): string {
    return 'attendance module is ready';
  }
}
