import { Injectable } from '@nestjs/common';

@Injectable()
export class RolesService {
  getStatus(): string {
    return 'roles module is ready';
  }
}
