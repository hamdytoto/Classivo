import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SchoolsService } from './schools.service';

@ApiTags('schools')
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Schools module status endpoint' })
  getStatus(): string {
    return this.schoolsService.getStatus();
  }
}
