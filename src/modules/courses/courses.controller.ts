import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('status')
  @ApiOperation({ summary: 'Courses module status endpoint' })
  getStatus(): string {
    return this.coursesService.getStatus();
  }
}
