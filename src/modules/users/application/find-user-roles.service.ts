import { Injectable, NotFoundException } from '@nestjs/common';
import {
  paginateArray,
  resolvePaginationParams,
} from '../../../common/pagination/pagination.util';
import { compareSortableValues } from '../../../common/query/compare-values.util';
import type { AuthenticatedActor } from '../../../common/types/request-context.type';
import { FindUserRolesQueryDto } from '../dto/find-user-roles-query.dto';
import { UsersAccessPolicy } from '../domain/policies/users-access.policy';
import { UsersRepository } from '../infrastructure/repositories/users.repository';
import { filterUserRoles } from '../filters/user-list.filter';

@Injectable()
export class FindUserRolesService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersAccessPolicy: UsersAccessPolicy,
  ) {}

  async execute(
    userId: string,
    query: FindUserRolesQueryDto = {},
    actor?: AuthenticatedActor,
  ) {
    const user = await this.usersRepository.findRolesByUserId(userId);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    this.usersAccessPolicy.assertActorCanAccessUser(actor, user.schoolId);

    const sortBy = query.sortBy ?? 'assignedAt';
    const sortOrder = query.sortOrder ?? 'desc';
    let roles = user.roles.map((assignment) => ({
      id: assignment.role.id,
      code: assignment.role.code,
      name: assignment.role.name,
      assignedAt: assignment.assignedAt,
    }));
    roles = filterUserRoles(roles, query);

    roles.sort((left, right) =>
      compareSortableValues(left[sortBy], right[sortBy], sortOrder),
    );

    return {
      userId: user.id,
      ...paginateArray(roles, resolvePaginationParams(query)),
    };
  }
}
