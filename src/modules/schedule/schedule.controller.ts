import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';

@ApiTags('schedule')
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('status')
  @ApiOperation({ summary: 'Schedule module status endpoint' })
  getStatus(): string {
    return this.scheduleService.getStatus();
  }
}
