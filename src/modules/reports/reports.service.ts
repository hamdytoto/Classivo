import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsService {
  getStatus(): string {
    return 'reports module is ready';
  }
}
