import { Injectable } from '@nestjs/common';
import { AUDIT_ACTIONS } from '../../../common/audit/audit.constants';
import { AuditLogService } from '../../../common/audit/audit-log.service';
import { executePrismaOperation } from '../../../common/database/prisma-operation.util';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';
import { createRoleEntityPrismaErrorHandlers } from './roles-prisma-error.util';

@Injectable()
export class CreateRoleService {
  constructor(
    private readonly prismaTransactionService: PrismaTransactionService,
    private readonly rolesRepository: RolesRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(dto: CreateRoleDto, actorId?: string) {
    return executePrismaOperation(
      this.prismaTransactionService.run(async (tx) => {
        const role = await this.rolesRepository.createRole(dto, tx);

        await this.auditLogService.log(
          {
            action: AUDIT_ACTIONS.roleCreated,
            resource: 'role',
            resourceId: role.id,
            actorId,
            metadata: {
              roleId: role.id,
              roleCode: role.code,
              roleName: role.name,
            },
          },
          tx,
        );

        return role;
      }),
      createRoleEntityPrismaErrorHandlers,
    );
  }
}
