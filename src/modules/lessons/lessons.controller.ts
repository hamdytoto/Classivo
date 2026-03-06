import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';

@ApiTags('lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Lessons module status endpoint' })
  getStatus(): string {
    return this.lessonsService.getStatus();
  }
}
