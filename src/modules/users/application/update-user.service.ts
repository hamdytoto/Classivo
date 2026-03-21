import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { rethrowPrismaError } from '../../../common/database/prisma-error.util';
import { hash } from '../../../common/security/hash.utils';
import type { AuthenticatedActor } from '../../../common/types/request-context.type';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UsersAccessPolicy } from '../domain/policies/users-access.policy';
import { UsersRepository } from '../infrastructure/repositories/users.repository';

@Injectable()
export class UpdateUserService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersAccessPolicy: UsersAccessPolicy,
  ) {}

  async execute(
    id: string,
    dto: UpdateUserDto,
    actor?: AuthenticatedActor,
  ) {
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

    try {
      return await this.usersRepository.update(id, data);
    } catch (error) {
      return rethrowPrismaError(error, {
        onUnique: (target) => {
          throw new ConflictException({
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
            message: `Duplicate value for ${target}`,
          });
        },
        onNotFound: () => {
          throw new NotFoundException({
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          });
        },
      });
    }
  }
}
