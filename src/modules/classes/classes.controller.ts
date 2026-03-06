import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClassesService } from './classes.service';

@ApiTags('classes')
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get('status')
  @ApiOperation({ summary: 'Classes module status endpoint' })
  getStatus(): string {
    return this.classesService.getStatus();
  }
}
