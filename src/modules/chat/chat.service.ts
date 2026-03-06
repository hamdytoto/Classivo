import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  getStatus(): string {
    return 'chat module is ready';
  }
}
