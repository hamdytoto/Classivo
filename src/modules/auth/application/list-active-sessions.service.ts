import { Injectable } from '@nestjs/common';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';
import { ListActiveSessionsQueryDto } from '../interface/dto/list-active-sessions-query.dto';

@Injectable()
export class ListActiveSessionsService {
  constructor(
    private readonly authSessionRepository: AuthSessionRepository,
  ) {}

  execute(actorId: string, query: ListActiveSessionsQueryDto = {}) {
    return this.authSessionRepository.listActiveByUserId(actorId, query);
  }
}
