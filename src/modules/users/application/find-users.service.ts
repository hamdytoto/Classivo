import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { resolveListQuery } from '../../../common/query/list-query.util';
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
    const where = buildUserWhere(scopedQuery);
    const { pagination, orderBy } = resolveListQuery<
      NonNullable<FindUsersQueryDto['sortBy']>,
      Prisma.UserOrderByWithRelationInput
    >(scopedQuery, 'createdAt');

    return this.usersRepository.findPage(where, pagination, orderBy);
  }
}
