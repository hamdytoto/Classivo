import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AUDIT_ACTIONS } from '../../../common/audit/audit.constants';
import { AuditLogService } from '../../../common/audit/audit-log.service';
import { rethrowPrismaError } from '../../../common/database/prisma-error.util';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import type { AuthenticatedActor } from '../../../common/types/request-context.type';
import { RolesAccessPolicy } from '../domain/policies/roles-access.policy';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';

@Injectable()
export class AssignRoleToUserService {
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
    const [role, user, existingAssignment] = await Promise.all([
      this.rolesRepository.findRoleSummaryById(roleId),
      this.rolesRepository.findUserScopeById(userId),
      this.rolesRepository.findUserRoleAssignment(userId, roleId),
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

    try {
      await this.prismaTransactionService.run(async (tx) => {
        await this.rolesRepository.upsertUserRole(userId, roleId, tx);

        await this.auditLogService.log(
          {
            action: AUDIT_ACTIONS.roleAssigned,
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

    return {
      userId,
      roleId,
      assigned: true,
    };
  }
}
