import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {
  getStatus(): string {
    return 'files module is ready';
  }
}
