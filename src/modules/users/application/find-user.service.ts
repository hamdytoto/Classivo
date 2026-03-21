import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedActor } from '../../../common/types/request-context.type';
import { UsersAccessPolicy } from '../domain/policies/users-access.policy';
import { UsersRepository } from '../infrastructure/repositories/users.repository';

@Injectable()
export class FindUserService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersAccessPolicy: UsersAccessPolicy,
  ) {}

  async execute(id: string, actor?: AuthenticatedActor) {
    const user = await this.usersRepository.findPublicById(id);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    this.usersAccessPolicy.assertActorCanAccessUser(actor, user.schoolId);

    return user;
  }
}
