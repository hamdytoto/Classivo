import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';

@ApiTags('announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Announcements module status endpoint' })
  getStatus(): string {
    return this.announcementsService.getStatus();
  }
}
