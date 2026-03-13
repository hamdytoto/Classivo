import { Injectable } from '@nestjs/common';
import { RefreshSessionPolicy } from '../domain/policies/refresh-session.policy';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';

@Injectable()
export class LogoutAllService {
  constructor(
    private readonly refreshSessionPolicy: RefreshSessionPolicy,
    private readonly authSessionRepository: AuthSessionRepository,
  ) {}

  async execute(
    refreshToken: string,
    includeCurrent: boolean,
    actorId?: string,
  ): Promise<{ revokedCount: number }> {
    const session = await this.refreshSessionPolicy.validateRefreshSession(
      refreshToken,
      {
        actorId,
      },
    );

    const result = await this.authSessionRepository.revokeManyByUserId(
      session.userId,
      new Date(),
      includeCurrent ? undefined : session.id,
    );

    return { revokedCount: result.count };
  }
}
