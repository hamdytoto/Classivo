import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  getStatus(): string {
    return 'payments module is ready';
  }
}
