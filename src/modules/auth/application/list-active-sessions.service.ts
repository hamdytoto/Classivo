import { Injectable } from '@nestjs/common';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';

@Injectable()
export class ListActiveSessionsService {
  constructor(
    private readonly authSessionRepository: AuthSessionRepository,
  ) {}

  execute(actorId: string) {
    return this.authSessionRepository.listActiveByUserId(actorId);
  }
}
