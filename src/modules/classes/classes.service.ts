import { Injectable } from '@nestjs/common';

@Injectable()
export class ClassesService {
  getStatus(): string {
    return 'classes module is ready';
  }
}
