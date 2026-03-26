import { Injectable } from '@nestjs/common';
import { executePrismaOperation } from '../../../common/database/prisma-operation.util';
import { CreateRoleDto } from '../dto/create-role.dto';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';
import { createRoleEntityPrismaErrorHandlers } from './roles-prisma-error.util';

@Injectable()
export class CreateRoleService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async execute(dto: CreateRoleDto) {
    return executePrismaOperation(
      this.rolesRepository.createRole(dto),
      createRoleEntityPrismaErrorHandlers,
    );
  }
}
