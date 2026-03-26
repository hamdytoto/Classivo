import { Injectable } from '@nestjs/common';
import { AUDIT_ACTIONS } from '../../../common/audit/audit.constants';
import { AuditLogService } from '../../../common/audit/audit-log.service';
import { executePrismaOperation } from '../../../common/database/prisma-operation.util';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';
import { updateRoleEntityPrismaErrorHandlers } from './roles-prisma-error.util';

@Injectable()
export class UpdateRoleService {
  constructor(
    private readonly prismaTransactionService: PrismaTransactionService,
    private readonly rolesRepository: RolesRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(id: string, dto: UpdateRoleDto, actorId?: string) {
    const existingRole = await this.rolesRepository.findRoleSummaryById(id);

    return executePrismaOperation(
      this.prismaTransactionService.run(async (tx) => {
        const role = await this.rolesRepository.updateRole(id, dto, tx);
        const changedFields = Object.keys(dto).filter(
          (field) => dto[field as keyof UpdateRoleDto] !== undefined,
        );

        await this.auditLogService.log(
          {
            action: AUDIT_ACTIONS.roleUpdated,
            resource: 'role',
            resourceId: role.id,
            actorId,
            metadata: {
              roleId: role.id,
              previousCode: existingRole?.code ?? null,
              previousName: existingRole?.name ?? null,
              nextCode: role.code,
              nextName: role.name,
              changedFields,
            },
          },
          tx,
        );

        return role;
      }),
      updateRoleEntityPrismaErrorHandlers,
    );
  }
}
