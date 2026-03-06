import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GradesService } from './grades.service';

@ApiTags('grades')
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get('status')
  @ApiOperation({ summary: 'Grades module status endpoint' })
  getStatus(): string {
    return this.gradesService.getStatus();
  }
}
