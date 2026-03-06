import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';

@ApiTags('quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get('status')
  @ApiOperation({ summary: 'Quizzes module status endpoint' })
  getStatus(): string {
    return this.quizzesService.getStatus();
  }
}
