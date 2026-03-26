import { Injectable, NotFoundException } from '@nestjs/common';
import { executePrismaOperation } from '../../../common/database/prisma-operation.util';
import { hash } from '../../../common/security/hash.utils';
import type { AuthenticatedActor } from '../../../common/types/request-context.type';
import { CreateUserDto } from '../dto/create-user.dto';
import { UsersAccessPolicy } from '../domain/policies/users-access.policy';
import { UsersRepository } from '../infrastructure/repositories/users.repository';
import { createUserPrismaErrorHandlers } from './users-prisma-error.util';

@Injectable()
export class CreateUserService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersAccessPolicy: UsersAccessPolicy,
  ) {}

  async execute(dto: CreateUserDto, actor?: AuthenticatedActor) {
    this.usersAccessPolicy.ensureContactProvided(dto.email, dto.phone);
    const schoolId = this.usersAccessPolicy.resolveSchoolId(
      actor,
      dto.schoolId,
    );

    if (schoolId) {
      const school = await this.usersRepository.findSchoolById(schoolId);

      if (!school) {
        throw new NotFoundException({
          code: 'INVALID_SCHOOL_ID',
          message: 'Invalid schoolId',
        });
      }
    }

    return executePrismaOperation(
      this.usersRepository.create({
        schoolId,
        email: dto.email,
        phone: dto.phone,
        passwordHash: await hash(dto.password),
        firstName: dto.firstName,
        lastName: dto.lastName,
        status: dto.status,
      }),
      createUserPrismaErrorHandlers,
    );
  }
}
