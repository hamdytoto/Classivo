import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { executePrismaOperation } from '../../../common/database/prisma-operation.util';
import { hash } from '../../../common/security/hash.utils';
import type { AuthenticatedActor } from '../../../common/types/request-context.type';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UsersAccessPolicy } from '../domain/policies/users-access.policy';
import { UsersRepository } from '../infrastructure/repositories/users.repository';
import { updateUserPrismaErrorHandlers } from './users-prisma-error.util';

@Injectable()
export class UpdateUserService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersAccessPolicy: UsersAccessPolicy,
  ) {}

  async execute(id: string, dto: UpdateUserDto, actor?: AuthenticatedActor) {
    const existingUser = await this.usersRepository.findScopeById(id);

    if (!existingUser) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    this.usersAccessPolicy.assertActorCanAccessUser(
      actor,
      existingUser.schoolId,
    );

    const data: Prisma.UserUpdateInput = {};

    if (dto.email !== undefined) {
      data.email = dto.email;
    }

    if (dto.phone !== undefined) {
      data.phone = dto.phone;
    }

    if (dto.firstName !== undefined) {
      data.firstName = dto.firstName;
    }

    if (dto.lastName !== undefined) {
      data.lastName = dto.lastName;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (dto.password !== undefined) {
      data.passwordHash = await hash(dto.password);
    }

    return executePrismaOperation(
      this.usersRepository.update(id, data),
      updateUserPrismaErrorHandlers,
    );
  }
}
