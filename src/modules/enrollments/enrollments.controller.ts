import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Enrollments module status endpoint' })
  getStatus(): string {
    return this.enrollmentsService.getStatus();
  }
}
