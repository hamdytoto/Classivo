import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { rethrowPrismaError } from '../../../common/database/prisma-error.util';
import { CreateRoleDto } from '../dto/create-role.dto';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';

@Injectable()
export class CreateRoleService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async execute(dto: CreateRoleDto) {
    try {
      return await this.rolesRepository.createRole(dto);
    } catch (error) {
      return rethrowPrismaError(error, {
        onUnique: (target) => {
          throw new ConflictException({
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
            message: `Duplicate value for ${target}`,
          });
        },
      });
    }
  }
}
