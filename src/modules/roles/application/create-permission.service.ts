import { Injectable } from '@nestjs/common';
import { executePrismaOperation } from '../../../common/database/prisma-operation.util';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';
import { createRoleEntityPrismaErrorHandlers } from './roles-prisma-error.util';

@Injectable()
export class CreatePermissionService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async execute(dto: CreatePermissionDto) {
    return executePrismaOperation(
      this.rolesRepository.createPermission(dto),
      createRoleEntityPrismaErrorHandlers,
    );
  }
}
