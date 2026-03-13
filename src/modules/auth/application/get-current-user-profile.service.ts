import { Injectable, NotFoundException } from '@nestjs/common';
import { AUTH_ERROR_CODES } from '../domain/auth-errors';
import { AuthenticatedUserProfileBuilder } from '../domain/builders/authenticated-user-profile.builder';
import { AuthUserRepository } from '../infrastructure/repositories/auth-user.repository';

@Injectable()
export class GetCurrentUserProfileService {
  constructor(
    private readonly authUserRepository: AuthUserRepository,
    private readonly authenticatedUserProfileBuilder: AuthenticatedUserProfileBuilder,
  ) {}

  async execute(actorId: string) {
    const user = await this.authUserRepository.findAuthProfileById(actorId);

    if (!user) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.userNotFound,
        message: 'Authenticated user was not found',
      });
    }

    return this.authenticatedUserProfileBuilder.build(user);
  }
}
