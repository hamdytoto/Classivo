import { Injectable, NotFoundException } from '@nestjs/common';
import { AUDIT_ACTIONS } from '../../../common/audit/audit.constants';
import { AuditLogService } from '../../../common/audit/audit-log.service';
import { executePrismaOperation } from '../../../common/database/prisma-operation.util';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import type { AuthenticatedActor } from '../../../common/types/request-context.type';
import { RolesAccessPolicy } from '../domain/policies/roles-access.policy';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';
import { roleAssignmentPrismaErrorHandlers } from './roles-prisma-error.util';

@Injectable()
export class RemoveRoleFromUserService {
  constructor(
    private readonly prismaTransactionService: PrismaTransactionService,
    private readonly rolesRepository: RolesRepository,
    private readonly rolesAccessPolicy: RolesAccessPolicy,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(
    userId: string,
    roleId: string,
    actorId?: string,
    actor?: AuthenticatedActor,
  ) {
    const [role, user] = await Promise.all([
      this.rolesRepository.findRoleSummaryById(roleId),
      this.rolesRepository.findUserScopeById(userId),
    ]);

    if (!role) {
      throw new NotFoundException({
        code: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    }

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    this.rolesAccessPolicy.assertActorCanAccessUserSchool(actor, user.schoolId);

    await executePrismaOperation(
      this.prismaTransactionService.run(async (tx) => {
        await this.rolesRepository.deleteUserRole(userId, roleId, tx);

        await this.auditLogService.log(
          {
            action: AUDIT_ACTIONS.roleRemoved,
            resource: 'user',
            resourceId: user.id,
            actorId,
            schoolId: user.schoolId,
            metadata: {
              userId: user.id,
              userSchoolId: user.schoolId,
              roleId: role.id,
              roleCode: role.code,
              roleName: role.name,
            },
          },
          tx,
        );
      }),
      roleAssignmentPrismaErrorHandlers,
    );

    return {
      userId,
      roleId,
      assigned: false,
    };
  }
}
