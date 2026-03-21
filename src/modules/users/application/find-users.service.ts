import { Injectable } from '@nestjs/common';
import {
  buildPaginatedResult,
  resolvePaginationParams,
} from '../../../common/pagination/pagination.util';
import type { AuthenticatedActor } from '../../../common/types/request-context.type';
import { FindUsersQueryDto } from '../dto/find-users-query.dto';
import { UsersAccessPolicy } from '../domain/policies/users-access.policy';
import { UsersRepository } from '../infrastructure/repositories/users.repository';
import { buildUserWhere } from '../filters/user-list.filter';

@Injectable()
export class FindUsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersAccessPolicy: UsersAccessPolicy,
  ) {}

  async execute(query: FindUsersQueryDto = {}, actor?: AuthenticatedActor) {
    const scopedQuery = this.usersAccessPolicy.applySchoolScopeToUsersQuery(
      query,
      actor,
    );
    const pagination = resolvePaginationParams(query);
    const where = buildUserWhere(scopedQuery);
    const sortBy = scopedQuery.sortBy ?? 'createdAt';
    const sortOrder = scopedQuery.sortOrder ?? 'desc';

    const [users, total] = await this.usersRepository.runInTransaction([
      this.usersRepository.findMany(where, pagination.skip, pagination.limit, {
        [sortBy]: sortOrder,
      }),
      this.usersRepository.count(where),
    ]);

    return buildPaginatedResult(users, pagination, total);
  }
}
