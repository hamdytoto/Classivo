import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AUDIT_ACTIONS } from '../../../common/audit/audit.constants';
import { AuditLogService } from '../../../common/audit/audit-log.service';
import { rethrowPrismaError } from '../../../common/database/prisma-error.util';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';
import { FindRoleService } from './find-role.service';

@Injectable()
export class AssignPermissionToRoleService {
  constructor(
    private readonly prismaTransactionService: PrismaTransactionService,
    private readonly rolesRepository: RolesRepository,
    private readonly auditLogService: AuditLogService,
    private readonly findRoleService: FindRoleService,
  ) {}

  async execute(roleId: string, permissionId: string, actorId?: string) {
    const [role, permission, existingAssignment] = await Promise.all([
      this.rolesRepository.findRoleSummaryById(roleId),
      this.rolesRepository.findPermissionSummaryById(permissionId),
      this.rolesRepository.findRolePermissionAssignment(roleId, permissionId),
    ]);

    if (!role) {
      throw new NotFoundException({
        code: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    }

    if (!permission) {
      throw new NotFoundException({
        code: 'PERMISSION_NOT_FOUND',
        message: 'Permission not found',
      });
    }

    try {
      await this.prismaTransactionService.run(async (tx) => {
        await this.rolesRepository.upsertRolePermission(roleId, permissionId, tx);

        await this.auditLogService.log(
          {
            action: AUDIT_ACTIONS.permissionAssigned,
            resource: 'role',
            resourceId: role.id,
            actorId,
            metadata: {
              roleId: role.id,
              roleCode: role.code,
              roleName: role.name,
              permissionId: permission.id,
              permissionCode: permission.code,
              permissionName: permission.name,
              alreadyAssigned: Boolean(existingAssignment),
            },
          },
          tx,
        );
      });
    } catch (error) {
      return rethrowPrismaError(error, {
        onNotFound: () => {
          throw new NotFoundException({
            code: 'RELATION_NOT_FOUND',
            message: 'Requested relation was not found',
          });
        },
        onForeignKey: () => {
          throw new BadRequestException({
            code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
            message: 'Invalid related resource reference',
          });
        },
      });
    }

    return this.findRoleService.execute(roleId);
  }
}
