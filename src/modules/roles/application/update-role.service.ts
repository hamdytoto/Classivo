import { Injectable } from '@nestjs/common';
import { executePrismaOperation } from '../../../common/database/prisma-operation.util';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';
import { updateRoleEntityPrismaErrorHandlers } from './roles-prisma-error.util';

@Injectable()
export class UpdateRoleService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async execute(id: string, dto: UpdateRoleDto) {
    return executePrismaOperation(
      this.rolesRepository.updateRole(id, dto),
      updateRoleEntityPrismaErrorHandlers,
    );
  }
}
