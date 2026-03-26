import { Injectable } from '@nestjs/common';
import { AUDIT_ACTIONS } from '../../../common/audit/audit.constants';
import { AuditLogService } from '../../../common/audit/audit-log.service';
import { executePrismaOperation } from '../../../common/database/prisma-operation.util';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';
import { createRoleEntityPrismaErrorHandlers } from './roles-prisma-error.util';

@Injectable()
export class CreatePermissionService {
  constructor(
    private readonly prismaTransactionService: PrismaTransactionService,
    private readonly rolesRepository: RolesRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(dto: CreatePermissionDto, actorId?: string) {
    return executePrismaOperation(
      this.prismaTransactionService.run(async (tx) => {
        const permission = await this.rolesRepository.createPermission(dto, tx);

        await this.auditLogService.log(
          {
            action: AUDIT_ACTIONS.permissionCreated,
            resource: 'permission',
            resourceId: permission.id,
            actorId,
            metadata: {
              permissionId: permission.id,
              permissionCode: permission.code,
              permissionName: permission.name,
            },
          },
          tx,
        );

        return permission;
      }),
      createRoleEntityPrismaErrorHandlers,
    );
  }
}
