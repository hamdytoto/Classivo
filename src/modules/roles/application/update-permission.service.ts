import { Injectable } from '@nestjs/common';
import { executePrismaOperation } from '../../../common/database/prisma-operation.util';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';
import { updateRoleEntityPrismaErrorHandlers } from './roles-prisma-error.util';

@Injectable()
export class UpdatePermissionService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async execute(id: string, dto: UpdatePermissionDto) {
    return executePrismaOperation(
      this.rolesRepository.updatePermission(id, dto),
      updateRoleEntityPrismaErrorHandlers,
    );
  }
}
