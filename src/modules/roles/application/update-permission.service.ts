import { Injectable } from '@nestjs/common';
import { AUDIT_ACTIONS } from '../../../common/audit/audit.constants';
import { AuditLogService } from '../../../common/audit/audit-log.service';
import { executePrismaOperation } from '../../../common/database/prisma-operation.util';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';
import { updateRoleEntityPrismaErrorHandlers } from './roles-prisma-error.util';

@Injectable()
export class UpdatePermissionService {
  constructor(
    private readonly prismaTransactionService: PrismaTransactionService,
    private readonly rolesRepository: RolesRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(id: string, dto: UpdatePermissionDto, actorId?: string) {
    const existingPermission =
      await this.rolesRepository.findPermissionSummaryById(id);

    return executePrismaOperation(
      this.prismaTransactionService.run(async (tx) => {
        const permission = await this.rolesRepository.updatePermission(
          id,
          dto,
          tx,
        );
        const changedFields = Object.keys(dto).filter(
          (field) => dto[field as keyof UpdatePermissionDto] !== undefined,
        );

        await this.auditLogService.log(
          {
            action: AUDIT_ACTIONS.permissionUpdated,
            resource: 'permission',
            resourceId: permission.id,
            actorId,
            metadata: {
              permissionId: permission.id,
              previousCode: existingPermission?.code ?? null,
              previousName: existingPermission?.name ?? null,
              nextCode: permission.code,
              nextName: permission.name,
              changedFields,
            },
          },
          tx,
        );

        return permission;
      }),
      updateRoleEntityPrismaErrorHandlers,
    );
  }
}
