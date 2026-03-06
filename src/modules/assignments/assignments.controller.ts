import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';

@ApiTags('assignments')
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Assignments module status endpoint' })
  getStatus(): string {
    return this.assignmentsService.getStatus();
  }
}
