import { Injectable } from '@nestjs/common';
import { RefreshSessionPolicy } from '../domain/policies/refresh-session.policy';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';

@Injectable()
export class LogoutService {
  constructor(
    private readonly refreshSessionPolicy: RefreshSessionPolicy,
    private readonly authSessionRepository: AuthSessionRepository,
  ) {}

  async execute(refreshToken: string, actorId?: string): Promise<void> {
    const session = await this.refreshSessionPolicy.validateRefreshSession(
      refreshToken,
      {
        actorId,
      },
    );

    await this.authSessionRepository.revokeById(session.id, new Date());
  }
}
