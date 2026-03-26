import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { resolveListQuery } from '../../../common/query/list-query.util';
import { FindRolesQueryDto } from '../dto/find-roles-query.dto';
import { buildRoleWhere } from '../filters/role-list.filter';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';

@Injectable()
export class FindRolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async execute(query: FindRolesQueryDto = {}) {
    const where = buildRoleWhere(query);
    const { pagination, orderBy } = resolveListQuery<
      NonNullable<FindRolesQueryDto['sortBy']>,
      Prisma.RoleOrderByWithRelationInput
    >(query, 'createdAt');

    return this.rolesRepository.findRolesPage(where, pagination, orderBy);
  }
}
