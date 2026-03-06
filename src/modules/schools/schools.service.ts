import { Injectable } from '@nestjs/common';

@Injectable()
export class SchoolsService {
  getStatus(): string {
    return 'schools module is ready';
  }
}
