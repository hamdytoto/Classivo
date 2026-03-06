import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Reports module status endpoint' })
  getStatus(): string {
    return this.reportsService.getStatus();
  }
}
