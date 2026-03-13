import { Injectable, NotFoundException } from '@nestjs/common';
import { AUTH_ERROR_CODES } from '../domain/auth-errors';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';

@Injectable()
export class RevokeSessionService {
  constructor(
    private readonly authSessionRepository: AuthSessionRepository,
  ) {}

  async execute(sessionId: string, actorId: string): Promise<void> {
    const session = await this.authSessionRepository.findById(sessionId);

    if (!session || session.userId !== actorId) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.sessionNotFound,
        message: 'Session not found',
      });
    }

    if (session.revokedAt) {
      return;
    }

    await this.authSessionRepository.revokeById(session.id, new Date());
  }
}
