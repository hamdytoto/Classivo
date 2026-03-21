import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { rethrowPrismaError } from '../../../common/database/prisma-error.util';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';

@Injectable()
export class UpdateRoleService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async execute(id: string, dto: UpdateRoleDto) {
    try {
      return await this.rolesRepository.updateRole(id, dto);
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
