import { Injectable } from '@nestjs/common';

@Injectable()
export class AnnouncementsService {
  getStatus(): string {
    return 'announcements module is ready';
  }
}
