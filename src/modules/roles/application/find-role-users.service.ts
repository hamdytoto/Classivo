import { Injectable, NotFoundException } from '@nestjs/common';
import {
  paginateArray,
  resolvePaginationParams,
} from '../../../common/pagination/pagination.util';
import { compareSortableValues } from '../../../common/query/compare-values.util';
import type { AuthenticatedActor } from '../../../common/types/request-context.type';
import { FindRoleUsersQueryDto } from '../dto/find-role-users-query.dto';
import { RolesAccessPolicy } from '../domain/policies/roles-access.policy';
import { filterRoleUsers } from '../filters/role-list.filter';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';

@Injectable()
export class FindRoleUsersService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly rolesAccessPolicy: RolesAccessPolicy,
  ) {}

  async execute(
    roleId: string,
    query: FindRoleUsersQueryDto = {},
    actor?: AuthenticatedActor,
  ) {
    const role = await this.rolesRepository.findRoleUsersByRoleId(roleId);

    if (!role) {
      throw new NotFoundException({
        code: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    }

    const scopedQuery = this.rolesAccessPolicy.applySchoolScopeToRoleUsersQuery(
      query,
      actor,
    );
    const sortBy = scopedQuery.sortBy ?? 'assignedAt';
    const sortOrder = scopedQuery.sortOrder ?? 'desc';
    let users = role.users.map((assignment) => ({
      assignedAt: assignment.assignedAt,
      ...assignment.user,
    }));
    users = filterRoleUsers(users, scopedQuery);

    users.sort((left, right) =>
      compareSortableValues(left[sortBy], right[sortBy], sortOrder),
    );

    return {
      roleId: role.id,
      roleCode: role.code,
      roleName: role.name,
      ...paginateArray(users, resolvePaginationParams(query)),
    };
  }
}
