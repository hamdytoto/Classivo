import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExamsService } from './exams.service';

@ApiTags('exams')
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Exams module status endpoint' })
  getStatus(): string {
    return this.examsService.getStatus();
  }
}
