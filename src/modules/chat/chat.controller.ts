import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('status')
  @ApiOperation({ summary: 'Chat module status endpoint' })
  getStatus(): string {
    return this.chatService.getStatus();
  }
}
