import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';

@ApiTags('attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('status')
  @ApiOperation({ summary: 'Attendance module status endpoint' })
  getStatus(): string {
    return this.attendanceService.getStatus();
  }
}
