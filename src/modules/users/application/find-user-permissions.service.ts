import { Injectable, NotFoundException } from '@nestjs/common';
import {
  paginateArray,
  resolvePaginationParams,
} from '../../../common/pagination/pagination.util';
import { compareSortableValues } from '../../../common/query/compare-values.util';
import type { AuthenticatedActor } from '../../../common/types/request-context.type';
import { FindUserPermissionsQueryDto } from '../dto/find-user-permissions-query.dto';
import { UsersAccessPolicy } from '../domain/policies/users-access.policy';
import { UsersRepository } from '../infrastructure/repositories/users.repository';
import { filterUserPermissions } from '../filters/user-list.filter';

@Injectable()
export class FindUserPermissionsService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersAccessPolicy: UsersAccessPolicy,
  ) {}

  async execute(
    userId: string,
    query: FindUserPermissionsQueryDto = {},
    actor?: AuthenticatedActor,
  ) {
    const user = await this.usersRepository.findPermissionsByUserId(userId);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    this.usersAccessPolicy.assertActorCanAccessUser(actor, user.schoolId);

    const permissionMap = new Map<
      string,
      {
        id: string;
        code: string;
        name: string;
        grantedByRoles: Array<{
          id: string;
          code: string;
          name: string;
        }>;
      }
    >();

    for (const assignment of user.roles) {
      const role = assignment.role;

      for (const entry of role.permissions) {
        const permission = entry.permission;
        const existing = permissionMap.get(permission.code);

        if (!existing) {
          permissionMap.set(permission.code, {
            id: permission.id,
            code: permission.code,
            name: permission.name,
            grantedByRoles: [
              {
                id: role.id,
                code: role.code,
                name: role.name,
              },
            ],
          });
          continue;
        }

        existing.grantedByRoles.push({
          id: role.id,
          code: role.code,
          name: role.name,
        });
      }
    }

    const sortBy = query.sortBy ?? 'code';
    const sortOrder = query.sortOrder ?? 'asc';
    let permissions = filterUserPermissions(
      Array.from(permissionMap.values()),
      query,
    );

    permissions.sort((left, right) =>
      compareSortableValues(left[sortBy], right[sortBy], sortOrder),
    );

    return {
      userId: user.id,
      ...paginateArray(permissions, resolvePaginationParams(query)),
    };
  }
}
