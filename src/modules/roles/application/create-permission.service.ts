import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { rethrowPrismaError } from '../../../common/database/prisma-error.util';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';

@Injectable()
export class CreatePermissionService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async execute(dto: CreatePermissionDto) {
    try {
      return await this.rolesRepository.createPermission(dto);
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
