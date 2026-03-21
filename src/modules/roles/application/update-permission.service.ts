import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { rethrowPrismaError } from '../../../common/database/prisma-error.util';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';

@Injectable()
export class UpdatePermissionService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async execute(id: string, dto: UpdatePermissionDto) {
    try {
      return await this.rolesRepository.updatePermission(id, dto);
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
            code: 'RELATION_NOT_FOUND',
            message: 'Requested relation was not found',
          });
        },
        onForeignKey: () => {
          throw new NotFoundException({
            code: 'RELATION_NOT_FOUND',
            message: 'Requested relation was not found',
          });
        },
      });
    }
  }
}
