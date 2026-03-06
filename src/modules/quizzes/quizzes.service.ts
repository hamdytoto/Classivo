import { Injectable } from '@nestjs/common';

@Injectable()
export class QuizzesService {
  getStatus(): string {
    return 'quizzes module is ready';
  }
}
